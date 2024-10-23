import commentsModel from "../models/commentModel.js";
import procedureModel, { procedureStatusEnum } from "../models/procedureModel.js";
import imagesModel from "../models/filesModel.js";
import procedureVersionModel from "../models/policyVersionModel.js";
import { addOneProcedureToManyTags, rmOneProcedureFromManyTags } from "./tagsController.js";
import { Types } from "mongoose";
import { addLog } from "./logController.js";
import myResponse from "../../@types/response.js";
import { AssertionError } from "assert";
import { checkRolePermissions, isAdmin, isProcedureApprover, isProcedureAssignee, isProcedureReviewer, isSuperAdmin } from "../../utils/roles.js";
import assert from "assert";
import {pdfExport} from "../../utils/pdfExport.js";
import { getDateAfterDays } from "../../utils/functions.js";
import { incomingTagsData } from "./tagsController.js";
import userModel from "../models/userModel.js";


interface procedureUpdateInterface {
    title?: string
    description?: string
    content?: string
    beingModified?: boolean
}

async function checkProcedureAccessToUser(procedureId: string, userId: string) {
    var procedureStatus = (await procedureModel.findById(procedureId).select("status").exec())?.status
    if (!procedureStatus) return false

    // Checking procedure state
    var auth = false
    switch (procedureStatus) {
        case procedureStatusEnum.draft:
        case procedureStatusEnum.rejected:
            auth = await isProcedureAssignee(procedureId, userId)
            break;
        case procedureStatusEnum.drafted:
            auth = await isProcedureReviewer(procedureId, userId)
            break;
        case procedureStatusEnum.reviewed:
        case procedureStatusEnum.approved:
            auth = await isProcedureApprover(procedureId, userId)
            break;
        default:
            break;
    }
    return auth
}


// const OBJECT_TYPE = objectEnum.procedure


// CREATE
async function saveProcedure(
    uId: string,
    title: string,
    description: string,
    content: string,
    tags: incomingTagsData,
    policies: string[],
    projectId: string
): Promise<myResponse> {

    try {
        var auth = await checkRolePermissions(uId, [
            { procedure: { edit: true } }
        ])
        assert(auth, "Auth Failed")


        // Get frequency from global state

        var reminder = null
        switch (global.masterData.reviewFrequency) {
            case "Monthly":
                reminder = getDateAfterDays(1)
                break;
            case "Quarterly":
                reminder = getDateAfterDays(7)
                break;
            case "Biannually":
                reminder = getDateAfterDays(30)
                break;
            case "Annually":
                reminder = getDateAfterDays(365)
                break;
            default:
                break;
        }

        assert(reminder, "Frequency is not defined")

        var procedure = await procedureModel.create({
            project: projectId,
            created_by: uId,
            updated_by: uId,
            title,
            description,
            content,
            reminder,
            'assignees.author': [uId],
            policies,
        });

        if (tags) {
            var allTags = await addOneProcedureToManyTags(procedure._id.toString(), tags, uId)
            if (allTags.length) {
                await procedureModel.updateOne(
                    { _id: procedure._id },
                    {
                        $addToSet: {
                            tags: { $each: allTags }
                        }
                    }
                )
            }
        }
        
    } catch (error: any) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }
        // console.log(error)
        if (error.name === "MongoServerError" && error.code === 11000) return {
            status: false,
            msg: "Title is dublicate",
        };

        return {
            status: false,
            msg: "Error creating procedure",
        };

    }

    // var log = await addLog({
    //     objectType: "procedure",
    //     objectId: procedure.id,
    //     userId: uId,
    //     action: "add",
    //     description: "New procedure was created"
    // })
    // if (!log) return {
    //     status: false,
    //     msg: "Error Can't add logs"
    // }
    // procedure.logs.push(log)
    await procedure.save()

    return {
        status: true,
        msg: procedure.id,
    };
}

async function saveVersion(id: string, name: string, uId: string): Promise<myResponse> {
    const session = await procedureModel.startSession()
    try {
        // TODO: when to save the version
        var auth = await isProcedureAssignee(id, uId)
        assert(auth, "Auth Failed")

        var exists = await procedureModel.exists({ _id: id })
        assert(exists, "The procedure doesn't exists")

        session.startTransaction()
        var procedure = await procedureModel.findById(id)
            .select("title description content reminder tags procedure")
        assert(procedure, "procedure not found")
        // console.log(procedure)
        const version = (await procedureVersionModel.create([{
            name,
            title: procedure.title,
            description: procedure.description,
            created_by: uId,
            reminder: procedure.reminder,
            tags: procedure.tags,
            policies: procedure.policies
        }], { session }))[0]
        assert(version, "Version not saved")

        // var log = await addLog({
        //     objectType: "procedure",
        //     objectId: procedure!.id,
        //     userId: new Types.ObjectId(uId),
        //     action: "add",
        //     description: "New procedure version was created"
        // })
        // assert(log, "Failed to update log")



        await procedureModel.updateOne(
            { _id: procedure._id },
            {
                $push: {
                    versions: version._id,
                    // logs: log._id
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
            msg: "Error in saving procedure version"
        }
    }
}

async function saveProcedureComments(id: string, uId: string, content: string | string[], images: string[]): Promise<myResponse> {

    const session = await procedureModel.startSession()
    try {
        session.startTransaction()

        var auth = await checkRolePermissions(uId, [
            { procedure: { view: true } }
        ])
        assert(auth, "Auth Failed")

        const procedure = await procedureModel.exists({ _id: id });
        assert(procedure, `No procedure with id: ${id}`)

        const comment = (await commentsModel.create([{
            content,
            created_by: uId,
            images
        }], { session }))[0]


        // var log = await addLog({
        //     objectType: "procedure",
        //     objectId: procedure._id,
        //     userId: new Types.ObjectId(uId),
        //     action: "add",
        //     description: "New procedure comments was created"
        // })
        // assert(log, "Can't save logs")


        const result = await procedureModel.updateOne(
            { _id: id },
            { $push: { 
                comments: comment._id,
                // logs: log!._id
            } },
            { session }
        );

        assert(result.modifiedCount, `Failed to add comment to procedure with id: ${id}`)

        await session.commitTransaction()
        if (!session.hasEnded) session.endSession()
        return {
            status: true,
            msg: comment._id
        };

    } catch (error) {
        // console.log(error)
        await session.abortTransaction()
        if (!session.hasEnded) session.endSession()

        if (error instanceof AssertionError) return {
            status: true,
            msg: error.message
        }


        return {
            status: false,
            msg: `Can't create the comment`,
        };
    }
}

// RETRIVE
// TODO: sort is not used
async function getAllProcedure(uId: string, _page: string, _count: string, sort: { field: string, order: string }): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { procedure: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var page = parseInt(_page)
        var count = parseInt(_count)
        const procedures = await procedureModel.aggregate([
            { $project: { title: 1, description: 1, created_by: 1, updated_at: 1, status: 1, beingModified: 1 } },
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);
        return {
            status: true,
            procedures
        }
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: true,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error"
        }
    }
}

async function getProcedureComments(id: string, _page: string, _count: string, uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { procedure: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var page = parseInt(_page)
        var count = parseInt(_count)
        const commentsIds = await procedureModel.aggregate([
            { $match: { _id: new Types.ObjectId(id) } },
            { $project: { comments: 1 } },
            { $unwind: '$comments' },
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);
        assert(commentsIds, "No Comments")
        var comments = (await procedureModel.populate(commentsIds, { path: "comments" })).map(e => e.comments[0])

        return {
            status: true,
            comment: comments
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

async function getProcedure(id: string, uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { procedure: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var procedure = await procedureModel.findById(id).select({ comments: 0, logs: 0 }).exec();
        assert(procedure, `No procedure with id: ${id}`)


        // CHECK if author, reviwer and approver exists or not
        var _change = false
        if (procedure.assignees?.author) {
            await Promise.all(procedure.assignees.author.map(async (userId, _index) => {
                var exists = await userModel.exists({ _id: userId })
                if (!exists) {
                    _change = true;
                    delete procedure!.assignees!.author[_index]
                }
            }))
            procedure!.assignees!.author = procedure!.assignees!.author.filter((value) => value !== undefined)

        }

        if (procedure.assignees?.reviewer) {
            await Promise.all(procedure.assignees.reviewer.map(async (userId, _index) => {
                var exists = await userModel.exists({ _id: userId })
                if (!exists) {
                    _change = true;
                    delete procedure!.assignees!.reviewer[_index]
                }
            }))
            procedure!.assignees!.reviewer = procedure!.assignees!.reviewer.filter((value) => value !== undefined)

        }

        if (procedure.assignees?.approver) {
            await Promise.all(procedure.assignees.approver.map(async (userId, _index) => {
                var exists = await userModel.exists({ _id: userId })
                if (!exists) {
                    _change = true;
                    delete procedure!.assignees!.approver[_index]
                }
            }))
            procedure!.assignees!.approver = procedure!.assignees!.approver.filter((value) => value !== undefined)

        }


        if (_change) await procedure.save()

        await procedure.populate("tags")

        return {
            status: true,
            procedure,
        };
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
            { procedure: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var version = await procedureVersionModel.findById(versionId)
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

async function getTotalCount(uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { procedure: { view: true } }
        ])
        assert(auth, "Auth Failed")
        var count = await procedureModel.countDocuments()
        return {
            status: true,
            count
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

// ASSIGNMENT
async function assignUserToProcedure(id: string, uId: string, assignees = {
    author: [], reviewer: [], approver: []
}) {

    try {
        var auth = await checkProcedureAccessToUser(id, uId)
        assert(auth, "Auth Failed")

        var procedure = await procedureModel.exists({ _id: id })
        assert(procedure, `No procedure with id: ${id}`)


        await procedureModel.updateOne(
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
            objectType: "procedure",
            objectId: procedure._id,
            userId: new Types.ObjectId(uId),
            action: "add",
            description: "New procedure comments was created"
        })
        await procedureModel.updateOne(
            { _id: id },
            {
                $push: {
                    logs: log
                }
            }
        )

        return {
            status: true,
            msg: "Added users to the procedure",
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

async function addProcedureTags(id: string, uId: string, tags: incomingTagsData): Promise<myResponse> {
    const session = await procedureModel.startSession()
    session.startTransaction()

    try {
        var auth = await checkProcedureAccessToUser(id, uId)
        assert(auth, "Auth Failed")

        var procedure = await procedureModel.exists({ _id: id })
        assert(procedure, `No procedure with id: ${id}`)
        // console.log(tags)
        var allTags = await addOneProcedureToManyTags(id, tags, uId, session)
        // console.log(allTags)
        assert(allTags.length, "Error! Can't add tags")

        await procedureModel.updateOne(
            { _id: id },
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
            { session }
        )

        // var log = await addLog({
        //     objectType: "procedure",
        //     objectId: procedure._id,
        //     userId: new Types.ObjectId(uId),
        //     action: "add",
        //     description: "New Tags are added to the procedure"
        // })
        // await procedureModel.updateOne(
        //     { _id: id },
        //     {
        //         $push: {
        //             logs: log
        //         }
        //     },
        //     { session }
        // )

        await session.commitTransaction()
        return {
            status: true,
            msg: `Added tags to procedure: ${id}`,
        };
    } catch (error) {
        await session.abortTransaction()
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        console.log(error)
        return {
            status: false,
            msg: "Can't add tags to procedure",
        };
    } finally {
        if (!session.hasEnded) await session.endSession()
    }

}

async function setReminder(id: string, uId: string, next_reminder: string) {
    // check if procedure exists
    try {
        var procedure = await procedureModel.exists({ _id: id })
        if (!procedure) return {
            status: false,
            msg: `No procedure with id: ${id}`,
        };

        var auth = await isProcedureAssignee(id, uId)
        assert(auth, "Auth Failed")

        await procedureModel.updateOne(
            { _id: id },
            {
                $set: {
                    reminder: next_reminder,
                    updated_at: Date.now(),
                    updated_by: uId
                }
            }
        )

        return {
            status: true,
            msg: `Reminder added to procedure with id: ${id}`,
        };

    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: `Unable to set reminder to procedure with id: ${id}`,
        };
    }
}


// UPDATE
async function updateProcedureDetails(id: string, uId: string, props: procedureUpdateInterface) {
    try {
        var auth = await checkProcedureAccessToUser(id, uId)
        assert(auth, "Auth Failed")
        var updated_procedure = await procedureModel.updateOne(
            { _id: id },
            {
                $set: {
                    title: props.title,
                    description: props.description,
                    content: props.content,
                    beingModified: props.beingModified,
                    updated_by: uId, updated_at: Date.now()
                },
            },
            { new: true, runValidators: true }
        );
        if (!updated_procedure) {
            return {
                status: false,
                msg: `No procedure with id: ${id}`,
            };
        }
        return {
            status: true,
            msg: `procedure with id: ${id} updated`,
        };
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

async function changeProcedureStatus(id: string, uId: string, type: string): Promise<myResponse> {
    try {
        var auth = await isProcedureAssignee(id, uId)
        assert(auth, "Auth Failed")
        var procedureStatus = (await procedureModel.findById(id).select("status").exec())?.status
        switch (type) {
            case procedureStatusEnum.draft:
                assert((
                    procedureStatus == procedureStatusEnum.rejected
                ), "For changing it's state, it should be in draft or rejected state")
                // var auth = await isprocedureAssignee(id, uId)
                break;
            case procedureStatusEnum.drafted:
                assert((
                    procedureStatus == procedureStatusEnum.draft
                ), "For changing it's state, it should be in draft or rejected state")
                var auth = await isProcedureAssignee(id, uId)
                break;
            case procedureStatusEnum.reviewed:
                if (global.masterData.workflow.tier3Enabled) {
                    assert(procedureStatus == procedureStatusEnum.drafted, "For reviewing, procedure should be drafted")
                    var auth = await isProcedureReviewer(id, uId)
                } else {
                    assert(false, "Not available")
                }
                break;
            case procedureStatusEnum.approved:
                if (global.masterData.workflow.tier3Enabled) {
                    assert(procedureStatus == procedureStatusEnum.reviewed, "For approving, procedure should be reviewed")
                } else {
                    assert(procedureStatus == procedureStatusEnum.drafted, "For approving, procedure should be drafted")
                }
                var auth = await isProcedureApprover(id, uId)
                break;
            case procedureStatusEnum.rejected:
                var auth = await isProcedureReviewer(id, uId)
                break;
            default:
                var auth = false
                break;
        }

        assert(auth, "Auth Failed")

        await procedureModel.updateOne(
            { _id: id },
            {
                $set: {
                    status: type
                }
            }
        )

        return {
            status: true,
            msg: "procedure status changed"
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

async function updateProcedureReminder(id: string, uId: string, next_reminder: string) {
    // check if procedure exists
    try {
        var procedure = await procedureModel.exists({ _id: id })
        assert(procedure, `No procedure with id: ${id}`)

        var auth = await checkProcedureAccessToUser(id, uId)
        assert(auth, "Auth Failed")


        // Change procedure status
        const result = await procedureModel.updateOne(
            { _id: id },
            {
                $set: {
                    reminder: next_reminder, updated_at: Date.now(), updated_by: uId
                }
            }
        );

        if (result.modifiedCount === 0) {
            return {
                status: false,
                msg: `Unable to change procedure reminder`,
            };
        }

        return {
            status: true,
            msg: `Changed procedure reminder`,
        };
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

// DELETE
async function unAssignUserToProcedure(id: string, uId: string, assignees = {
    author: [], reviewer: [], approver: []
}) {
    try {
        var auth = await checkProcedureAccessToUser(id, uId)
        assert(auth, "Auth Failed")

        var procedure = await procedureModel.exists({ _id: id })
        assert(procedure, `No procedure with id: ${id}`)


        await procedureModel.updateOne(
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
            msg: "Can't remove assignees to procedure",
        };
    }


    return {
        status: true,
        msg: `Removed assignees to procedure:${id}`,
    };
}

async function deleteVersion(id: string, versionId: string, uId: string) {
    const session = await procedureModel.startSession()
    try {
        // auth 
        var auth = await checkProcedureAccessToUser(id, uId)
        assert(auth, "Auth Failed")

        var version = await procedureVersionModel.exists({ _id: versionId })
        assert(version, `No procedure with id: ${versionId}`)

        // var procedure = procedureModel.exists({ _id: id })
        // assert(procedure, `No procedure with id: ${id}`)

        session.startTransaction()
        await procedureModel.updateOne(
            { _id: id },
            {
                $pull: {
                    versions: versionId
                }
            },
            { session }
        )

        await procedureVersionModel.findByIdAndDelete({ _id: versionId }, { session })
        await session.commitTransaction()
        if (!session.hasEnded) session.endSession()
        return {
            status: true,
            msg: "procedure verson is Deleted"
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

async function deleteProcedureTags(id: string, uId: string, tags: [string]): Promise<myResponse> {
    try {
        // var procedure = await procedureModel.exists({ _id: id })
        // assert(procedure, `No procedure with id: ${id}`)

        var auth = await checkProcedureAccessToUser(id, uId)
        assert(auth, "Auth Failed")

        await procedureModel.updateOne(
            { _id: id },
            {
                $pull: {
                    tags: {
                        $in: tags
                    }
                },
                $set: {
                    updated_by: uId,
                    updated_at: Date.now()
                }
            })

        assert(await rmOneProcedureFromManyTags(id, tags, uId), "Can't remove tags")

        return {
            status: true,
            msg: `Removed tags to policies: ${id}`,
        };

    } catch (error) {

        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }  
        console.log(error)

        return {
            status: false,
            msg: "Can't remove tags to procedure",
        };
    }
}

async function deleteProcedureComment(id: string, cId: string, uId: string) {
    try {
        var auth = await isAdmin(uId)
        if (!auth) {
            var comment = await commentsModel.findById(cId).select("created_by").exec()
            if (comment?.created_by.toString() == uId) {
                var auth = true
            } else {
                var auth = false
            }

        }
        assert(auth, "Auth Failed")
        const result = await procedureModel.updateOne(
            { _id: id, comments: cId },
            {
                $pull: { comments: cId },
                $set: { updated_at: Date.now(), updated_by: uId },
            }
        );

        if (result.modifiedCount === 0) {
            return {
                status: false,
                msg: `No Comment of id: ${cId} in procedure with id: ${id}`,
            };
        }

        var comment = await commentsModel.findById(cId);
        if (comment != null) {
            if (comment.images) {
                await Promise.all(comment.images.map(async id => {
                    await imagesModel.findByIdAndDelete(id)
                }))
            }
            comment.deleteOne()
        }

        return {
            status: true,
            msg: `Comment Deleted`,
        };
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

async function deleteProcedure(id: string, uId: string): Promise<myResponse> {
    try {
        var auth = await checkProcedureAccessToUser(id, uId)
        assert(auth, "Auth Failed")

        var procedure = await procedureModel.findByIdAndUpdate(id,{
            $set:{
                status: "deleted"
            }
        });
        if (!procedure) return {
            status: false,
            msg: `No procedure with id: ${id}`,
        }

        // remove tags associated with it
        var removed = await rmOneProcedureFromManyTags(id, procedure.tags, uId)
        assert(removed, "Tags not removed")
        return {
            status: true,
            msg: `procedure with id: ${id} was deleted`,
        };

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



async function exportProcedure(id: string, uId: string): Promise<myResponse> {
    try {
        var procedure = await procedureModel.findById(id)
        assert(procedure, "procedure not found")

        var auth = await checkRolePermissions(uId, [
            { procedure: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var data = await pdfExport(procedure.title, "",procedure.title,procedure.assignees?.author!,(procedure.versions.length + 1).toString())
        return {
            status: true,
            data,
            msg: procedure?.title
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




export {
    saveProcedure,
    saveProcedureComments,
    setReminder,
    assignUserToProcedure,
    addProcedureTags,
    saveVersion,

    getProcedure,
    getAllProcedure,
    getProcedureComments,
    getVersion,
    getTotalCount,


    updateProcedureDetails,
    changeProcedureStatus,
    updateProcedureReminder,

    unAssignUserToProcedure,
    deleteProcedure,
    deleteProcedureComment,
    deleteProcedureTags,
    deleteVersion,

    exportProcedure

};
