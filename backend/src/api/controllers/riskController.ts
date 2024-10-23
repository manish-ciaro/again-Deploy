import tagsModel from "../models/tagsModel.js";
import riskModel, { riskStatusEnum } from "../models/riskModel.js";
import myResponse from "../../@types/response.js";
import assert, { AssertionError } from "assert";
import { checkRolePermissions, isAdmin, isRiskApprover, isRiskAssignee, isRiskReviewer } from "../../utils/roles.js";
import filesModel from "../models/filesModel.js";
import { Types } from "mongoose";
import commentsModel from "../models/commentModel.js";
import { addOneRiskToManyTags, incomingTagsData } from "./tagsController.js";
import { addLog } from "./logController.js";
import { exportPdfFromString } from "../../utils/pdfExport.js";
import riskVersionModel from "../models/riskVersionModel.js";


async function checkRiskAccessToUser(riskId: string, userId: string) {
  try {
      var risk = await riskModel.findById(riskId).select({ status: 1 })
      assert(risk)

      var auth = await isAdmin(userId)
      if (auth) return auth
      // Checking risk state
      switch (risk.status) {
          case riskStatusEnum.draft:
          case riskStatusEnum.rejected:
              auth = await isRiskAssignee(riskId, userId)
              break;
          case riskStatusEnum.drafted:
              auth = await isRiskReviewer(riskId, userId)
              break;
          case riskStatusEnum.reviewed:
          case riskStatusEnum.approved:
              auth = await isRiskApprover(riskId, userId)
              break;
          default:
              break;
      }
      return auth
  } catch (error) {
      return false
  }

}


// CREATE
async function saveRisk(uId: string, content: any): Promise<myResponse> {
  try {
    // auth
    var auth = await checkRolePermissions(uId, [
      { risk: { edit: true } }
    ])
    assert(auth, "Auth Failed")

    const risk = await riskModel.create({
      ...content,
      created_by: uId,
      updated_by: uId,
      'assignees.author': [uId]
    });

    return {
      status: true,
      msg: risk.id,
    };
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }

    console.log(error)
    return {
      status: false,
      msg: 'Error in saving risk',
    };
  }
}


async function saveComment(riskId: string, uId: string, content: string, images: string[] = []): Promise<myResponse> {
  try {
    // auth
    var auth = await checkRolePermissions(uId, [
      { risk: { view: true } }
    ])
    assert(auth, "Auth Failed")

    var exists = await riskModel.exists({ _id: riskId })
    assert(exists, `No risk found with id ${riskId}`)

    const comment = await commentsModel.create({
      content,
      images,
      created_by: uId,
    });

    assert(comment, "Error in comment")

    var update = await riskModel.updateOne(
      { _id: new Types.ObjectId(riskId) },
      {
        $push: {
          comments: comment._id
        }
      }
    )

    assert(update.modifiedCount, "Error in comment")

    return {
      status: true,
      msg: comment._id,
    };
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }

    return {
      status: false,
      msg: 'Error in saving comment',
    };
  }
}


async function addRiskTag(riskId: string, uId: string, tags: incomingTagsData): Promise<myResponse> {
  try {
    var auth = await checkRolePermissions(uId, [
      { risk: { view: true } }
    ])
    assert(auth, "Auth Failed")



    var exists = await riskModel.exists({ _id: riskId })
    assert(exists, `No risk with id: ${riskId}`)

    var allTags = await addOneRiskToManyTags(riskId, tags, uId)
    assert(allTags, "Error! Can't add tags")

    await riskModel.updateOne(
      { _id: new Types.ObjectId(riskId) },
      {
        $addToSet: {
          tags: {
            $each: allTags
          }
        },
        $set: {
          updated_by: uId,
          updated_at: Date.now()
        }
      },
    )



    // var log = await addLog(globalWhere,id,uId,methodEnum.add,"New Tags are added to the policy")
    var log = await addLog({
      objectType: "risk",
      objectId: riskId,
      userId: new Types.ObjectId(uId),
      action: "add",
      description: "New Tags are added to the risk"
    })
    await riskModel.updateOne(
      { _id: riskId },
      {
        $push: {
          logs: log
        }
      },
    )

    return {
      status: true,
      msg: `Added tags to risk: ${riskId}`,
    };
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }

    return {
      status: false,
      msg: "Can't add tags to policy",
    };
  }
}


async function saveVersion(id: string, name: string, uId: string): Promise<myResponse> {
  const session = await riskModel.startSession()
  try {
      // TODO: when to save the version
      var auth = await isRiskAssignee(id, uId)
      assert(auth, "Auth Failed")

      var exists = await riskModel.exists({ _id: id })
      assert(exists, "The risk doesn't exists")

      session.startTransaction()
      var risk = await riskModel.findById(id)
          .select("title description content reminder tags procedure")
      assert(risk, "Risk not found")
      // console.log(risk)
      const version = (await riskVersionModel.create([risk], { session }))[0]
      assert(version, "Version not saved")

      var log = await addLog({
          objectType: "risk",
          objectId: risk!.id,
          userId: new Types.ObjectId(uId),
          action: "add",
          description: "New risk version was created"
      })
      assert(log, "Failed to update log")



      await riskModel.updateOne(
          { _id: risk._id },
          {
              $push: {
                  versions: version._id,
                  logs: log._id

              }
          },
          { session }
      )

      await session.commitTransaction()

      if (!session.hasEnded) session.endSession()

      return {
          status: true,
          version: version.id
      }
  } catch (error) {
      if (session.inTransaction()) await session.abortTransaction()
      if (!session.hasEnded) session.endSession()

      if (error instanceof AssertionError) return {
          status: false,
          msg: error.message
      }
      console.log(error)

      return {
          status: false,
          msg: "Error in saving policy version"
      }
  }
}




// RETRIVE
async function getRiskComments(riskId: string, page: number, count: number, uId: string): Promise<myResponse> {
  try {
    // auth 
    var auth = await checkRolePermissions(uId, [
      { risk: { view: true } }
    ])
    assert(auth, "Auth Failed")



    const commentsIds = await riskModel.aggregate([
      { $match: { _id: new Types.ObjectId(riskId) } },
      { $project: { comments: 1 } },
      { $unwind: '$comments' },
      { $skip: (page - 1) * count },
      { $limit: count },
    ]);
    assert(commentsIds, "No Comments")
    var comment = (await riskModel.populate(commentsIds, { path: "comments" })).map(e => e.comments[0])

    return {
      status: true,
      comment
    }
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }
    console.log(error)
    return {
      status: false,
      msg: "Error"
    }
  }
}

async function getAllRisks(page: number, count: number, uId: string): Promise<myResponse> {
  try {
    var auth = await checkRolePermissions(uId, [
      { risk: { view: true } }
    ])

    assert(auth, "Auth Failed")
    const risk = await riskModel.aggregate([
      { $project: { title: 1, description: 1, status: 1, created_by: 1, category: 1 } },
      { $skip: (page - 1) * count },
      { $limit: count },
    ]);
    return {
      status: true,
      risk
    }
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }

    return {
      status: false,
      msg: "Error"
    }
  }
}

async function getVersion(versionId: string, uId: string): Promise<myResponse> {
  try {
      var auth = await checkRolePermissions(uId, [
          { risk: { view: true } }
      ])
      assert(auth, "Auth Failed")

      var version = await riskVersionModel.findById(versionId)
      assert(version, "No version found")

      return {
          status: true,
          version
      }
  } catch (error) {
      if (error instanceof AssertionError) return {
          status: false,
          msg: error.message
      }
      return {
          status: false,
          msg: "Error"
      }
  }
}

async function getRisk(riskId: string, uId: string): Promise<myResponse> {
  try {
    var auth = await checkRolePermissions(uId, [
      { risk: { view: true } }
    ])
    assert(auth, "Auth Failed")
    var risk = await riskModel.findById(riskId).select({ tags: 0, comments: 0, logs: 0 }).exec()
    assert(risk, "Risk not found")

    return {
      status: true,
      risk
    }
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }

    return {
      status: false,
      msg: "Error"
    }
  }
}


async function exportRisks(type: string, uId: string): Promise<myResponse> {
  try {
    // auth
    var auth = await checkRolePermissions(uId, [
      { risk: { view: true } }
    ])
    assert(auth, "Auth failed")

    var risks = await riskModel.find({}).select({ assignees: 0, tags: 0, comments: 0, logs: 0, policies: 0, projects: 0, controls: 0, procedures: 0 })
    var data = "title,description,status,content,created_by,created_at,updated_by,updated_at,category,likelihood,impact,risk";
    risks.forEach(risk => {
      data += `\n${risk.title},${risk.description},${risk.status},${risk.content},${risk.created_by},${risk.created_at},${risk.updated_by},${risk.updated_at},${risk.category},${risk.likelihood},${risk.impact},${risk.risk}`
    })

    switch (type) {
      case "csv":
        return {
          status: true,
          data,
          contentType: "text/csv",
          filename: "risks.csv"
        }
      case "pdf":
        // var data2 = await exportPdfFromString(data) as { [key: string]: string }
        var data2 = {buffer:""}
        assert(data2, "Can't convert to pdf")
        return {
          status: true,
          data: Buffer.from(data2.buffer),
          contentType: "application/pdf",
          filename: "risks.pdf"
        }
      default:
        return {
          status: false,
          msg: "Unsupported format"
        }
    }

  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }
    console.log(error)
    return {
      status: false,
      msg: "Error"
    }
  }
}

// ASSIGN
async function assignUserToRisk(id: string, uId: string, assignees = {
  author: [], reviewer: [], approver: []
}) {

  try {
      var auth = await checkRiskAccessToUser(id, uId)
      assert(auth, "Auth Failed")

      var risk = await riskModel.exists({ _id: id })
      assert(risk, `No risk with id: ${id}`)


      await riskModel.updateOne(
          { _id: id },
          {
              $addToSet: {
                  'assignees.author': {
                      $each: assignees.author
                  },
                  'assignees.reviewer': {
                      $each: assignees.reviewer
                  },
                  'assignees.approver': {
                      $each: assignees.approver
                  },
              }
          }
      )
      var log = await addLog({
          objectType: "risk",
          objectId: risk._id,
          userId: new Types.ObjectId(uId),
          action: "add",
          description: "New risk comments was created"
      })
      await riskModel.updateOne(
          { _id: id },
          {
              $push: {
                  logs: log
              }
          }
      )

      return {
          status: true,
          msg: "Added users to the risk",
      }

  } catch (error) {
      if (error instanceof AssertionError) return {
          status: false,
          msg: error.message
      }
      return {
          status: false,
          msg: "Error"
      }
  }
}


// UPDATE
async function updateRisk(riskId: string, uId: string, body: {}): Promise<myResponse> {
  try {
    // auth
    var auth = await checkRolePermissions(uId, [
      { risk: { edit: true } }
    ])
    assert(auth, "Auth Failed")


    var exists = await riskModel.exists({ _id: riskId })
    assert(exists, "Not Found")

    await riskModel.updateOne(
      { _id: new Types.ObjectId(riskId) },
      body
    )
    return {
      status: true,
      msg: 'Risk updated successfully',
    };
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }

    return {
      status: false,
      msg: "Error",
    };
  }
}


async function changeRiskStatus(id: string, uId: string, type: string): Promise<myResponse> {
  try {
      var auth = await isRiskAssignee(id, uId)
      assert(auth, "Auth Failed")
      var riskStatus = (await riskModel.findById(id).select("status").exec())?.status
      switch (type) {
          case riskStatusEnum.draft:
              assert((
                  riskStatus == riskStatusEnum.rejected
              ), "For changing it's state, it should be in draft or rejected state")
              // var auth = await isRiskAssignee(id, uId)
              break;
          case riskStatusEnum.drafted:
              assert((
                  riskStatus == riskStatusEnum.draft
              ), "For changing it's state, it should be in draft or rejected state")
              var auth = await isRiskAssignee(id, uId)
              break;
          case riskStatusEnum.reviewed:
              if (global.masterData.workflow.tier3Enabled) {
                  assert(riskStatus == riskStatusEnum.drafted, "For reviewing, risk should be drafted")
                  var auth = await isRiskReviewer(id, uId)
              } else {
                  assert(false, "Not available")
              }
              break;
          case riskStatusEnum.approved:
              if (global.masterData.workflow.tier3Enabled) {
                  assert(riskStatus == riskStatusEnum.reviewed, "For approving, risk should be reviewed")
              } else {
                  assert(riskStatus == riskStatusEnum.drafted, "For approving, risk should be drafted")
              }
              var auth = await isRiskApprover(id, uId)
              break;
          case riskStatusEnum.rejected:
              var auth = await isRiskReviewer(id, uId)
              break;
          default:
              var auth = false
              break;
      }

      assert(auth, "Auth Failed")

      await riskModel.updateOne(
          { _id: id },
          {
              $set: {
                  status: type
              }
          }
      )

      return {
          status: true,
          msg: "Risk status changed"
      }


  } catch (error) {
      if (error instanceof AssertionError) return {
          status: false,
          msg: error.message
      }
      return {
          status: false,
          msg: "Error"
      }
  }
}


// Delete
async function deleteComment(riskId: string, commentId: string | Types.ObjectId, uId: string): Promise<myResponse> {
  try {
    var auth = await checkRolePermissions(uId, [
      { risk: { edit: true } }
    ])
    assert(auth, "Auth Failed")

    const comment = await commentsModel.findByIdAndDelete(commentId)
    assert(comment, "Comment not found")

    if (comment.images) {
      filesModel.deleteMany({ _id: comment.images })
    }

    var update = await riskModel.updateOne(
      { _id: new Types.ObjectId(riskId) },
      {
        $pull: {
          comments: commentId
        }
      }
    )

    return {
      status: true,
      msg: "Comment Deleted",
    };
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }

    return {
      status: false,
      msg: 'Error in deleting comment',
    };
  }
}

async function deleteTagsFromRisk(riskId: string, tags: string[] | Types.ObjectId[], uId: string): Promise<myResponse> {
  try {
    var auth = await checkRolePermissions(uId, [
      { risk: { edit: true } }
    ])
    assert(auth, "Auth Failed")

    var update = await riskModel.updateOne(
      { _id: new Types.ObjectId(riskId) },
      {
        $pull: {
          tags: {
            $in: tags
          }
        }
      }
    )

    assert(update.modifiedCount, "No tag deleted")

    var update = await tagsModel.updateMany(
      { _id: tags },
      {
        $pull: {
          risks: riskId
        }
      }
    )

    assert(update.modifiedCount, "No tag deleted")

    return {
      status: true,
      msg: "Tags Deleted",
    };
  } catch (error) {
    console.log(error)
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }
    return {
      status: false,
      msg: 'Error in deleting tags',
    };
  }
}

async function deleteRisk(riskId: string, uId: string): Promise<myResponse> {
  try {
    var auth = await checkRolePermissions(uId, [
      { risk: { edit: true } }
    ])
    assert(auth, "Auth Failed")


    var risk = await riskModel.findByIdAndUpdate(riskId, {
      $set: {
        status: "deleted"
      }
    });
    assert(risk, "Risk not found")

    // delete comments
    if (risk.comments) {
      Promise.all(risk.comments.map(async comment => {
        await deleteComment(riskId, comment, uId)
      }))
    }
    // delete Tags
    if (risk.tags) await deleteTagsFromRisk(riskId, risk.tags, uId)


    return {
      status: true,
      msg: 'Risk deleted successfully',
    };
  } catch (error) {
    if (error instanceof AssertionError) return {
      status: false,
      msg: error.message
    }

    return {
      status: false,
      msg: `No risk found with id ${riskId}`,
    };
  }
}

async function unAssignUserToRisk(id: string, uId: string, assignees = {
  author: [], reviewer: [], approver: []
}) {
  try {
      var auth = await checkRiskAccessToUser(id, uId)
      assert(auth, "Auth Failed")

      var risk = await riskModel.exists({ _id: id })
      assert(risk, `No risk with id: ${id}`)


      await riskModel.updateOne(
          { _id: id },
          {
              $pullAll: {
                  'assignees.author': assignees.author,
                  'assignees.reviewer': assignees.reviewer,
                  'assignees.approver': assignees.approver,
              },
              updated_by: uId,
              updated_at: Date.now()
          }
      )

  } catch (error) {
      if (error instanceof AssertionError) return {
          status: false,
          msg: error.message
      }
      return {
          status: false,
          msg: "Can't remove assignees to risk",
      };
  }


  return {
      status: true,
      msg: `Removed assignees to risk:${id}`,
  };
}


async function deleteVersion(id: string, versionId: string, uId: string) {
  const session = await riskModel.startSession()
  try {
      // auth 
      var auth = await checkRiskAccessToUser(id, uId)
      assert(auth, "Auth Failed")

      var version = await riskVersionModel.exists({ _id: versionId })
      assert(version, `No risk with id: ${versionId}`)
      
      // TODO: Check if version id exists in risk record version 

      session.startTransaction()
      await riskModel.updateOne(
          { _id: id },
          {
              $pull: {
                  versions: versionId
              }
          },
          { session }
      )

      await riskVersionModel.findByIdAndDelete({ _id: versionId }, { session })
      await session.commitTransaction()
      if (!session.hasEnded) session.endSession()
      return {
          status: true,
          msg: "Risk verson is Deleted"
      }
  } catch (error) {
      if (session.inTransaction()) await session.abortTransaction()
      if (!session.hasEnded) session.endSession()
      if (error instanceof AssertionError) return {
          status: false,
          msg: error.message
      }
      return {
          status: false,
          msg: "Error"
      }
  }
}



export {
  saveRisk,
  updateRisk,
  deleteRisk,
  exportRisks,
  getRisk,
  getAllRisks,
  saveComment,
  deleteComment,
  deleteTagsFromRisk,
  assignUserToRisk,
  unAssignUserToRisk,
  changeRiskStatus,
  addRiskTag,
  getRiskComments,
  saveVersion,
  getVersion,
  deleteVersion
}

