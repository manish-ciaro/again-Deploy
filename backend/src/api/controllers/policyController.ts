import commentsModel from "../models/commentModel.js";
import policyModel, { policyStatusEnum } from "../models/policyModel.js";
import imagesModel from "../models/filesModel.js";
import policyVersionModel from "../models/policyVersionModel.js";
import { addOnePolicyToManyTags, rmOnePolicyFromManyTags } from "./tagsController.js";
import { PipelineStage, Types } from "mongoose";
import { addLog } from "./logController.js";
import myResponse from "../../@types/response.js";
import { AssertionError } from "assert";
import { checkRolePermissions, isAdmin, isPolicyApprover, isPolicyAssignee, isPolicyReviewer, isPolicyVersionAssignee, isSuperAdmin } from "../../utils/roles.js";
import assert from "assert";
import { pdfExport } from "../../utils/pdfExport.js";
import { getDateAfterDays } from "../../utils/functions.js";
import { incomingTagsData } from "./tagsController.js";
import userModel from "../models/userModel.js";
import projectModel from "../models/projectModel.js";
import { getAndSetPolicyCounter } from "../models/counterModel.js";
import { createNotification } from "./notificationController.js";
import axios, { AxiosError } from "../../../node_modules/axios/index.cjs";




interface policyUpdateInterface {
    description?: string
    content?: string
    beingModified?: boolean
}

interface overviewItem {
    _id: string
    count: number
}

async function checkPolicyVersionAccessToUser(policyVersionId: string, userId: string) {
    try {
        var version = await policyVersionModel.findById(policyVersionId).select({ status: 1, policy: 1 })
        assert(version)
        var auth = await isAdmin(userId)
        if (auth) return true
        // Checking policy state
        switch (version.status) {
            case policyStatusEnum.draft:
            case policyStatusEnum.rejected:
            case policyStatusEnum.inactive:
                auth = await isPolicyAssignee(version.policy!, userId)
                break;
            case policyStatusEnum.drafted:
                auth = await isPolicyReviewer(version.policy!, userId)
                break;
            case policyStatusEnum.reviewed:
            case policyStatusEnum.approved:
                auth = await isPolicyApprover(version.policy!, userId)
                break;
            default:
                break;
        }
        return auth
    } catch (error) {
        return false
    }

}

async function sendNotifcationWapper(onWatch: Boolean, policyVersionId: String, msg: String, by: String, status?: String) {
    try {
        var version = await policyVersionModel.findById(policyVersionId)
        assert(version, "Policy Version not found")
        var userEmail = await userModel.findById(by).select({ email: 1 })

        switch (status || version.status) {
            case policyStatusEnum.draft:
                if (onWatch) {
                    if (version.assignees?.approver) {
                        await Promise.all(version.assignees.approver.map(async (userId) => {
                            await userModel.findById(userId)
                            await createNotification(userId, `${msg} by ${userEmail?.email}`)
                        }))
                    }
                    if (version.assignees?.reviewer) {
                        await Promise.all(version.assignees.reviewer.map(async (userId) => {
                            await userModel.findById(userId)
                            await createNotification(userId, `${msg} by ${userEmail?.email}`)
                        }))
                    }
                }
                break;

            case policyStatusEnum.drafted:
                if (version.assignees?.author) {
                    await Promise.all(version.assignees.author.map(async (userId) => {
                        await userModel.findById(userId)
                        await createNotification(userId, `${msg} by ${userEmail?.email}`)
                    }))
                }
                if (onWatch) {
                    if (version.assignees?.approver) {
                        await Promise.all(version.assignees.reviewer.map(async (userId) => {
                            await userModel.findById(userId)
                            await createNotification(userId, `${msg} by ${userEmail?.email}`)
                        }))
                    }
                }
                break;

            case policyStatusEnum.reviewed:
                if (version.assignees?.author) {
                    await Promise.all(version.assignees.author.map(async (userId) => {
                        await userModel.findById(userId)
                        await createNotification(userId, `${msg} by ${userEmail?.email}`)
                    }))
                }
                if (version.assignees?.reviewer) {
                    await Promise.all(version.assignees.reviewer.map(async (userId) => {
                        await userModel.findById(userId)
                        await createNotification(userId, `${msg} by ${userEmail?.email}`)
                    }))
                }
                break;

            default:
                break;
        }
    } catch (error) {

    }




}


// const OBJECT_TYPE = objectEnum.policy


// CREATE
async function createPolicy(
    uId: string,
    projectId: string,
    title: string
): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { edit: true } }
        ])
        assert(auth, "Auth Failed")

        var exists = await projectModel.exists({_id:projectId})
        assert(exists,"Project Not found")
        // console.log(exists)
        // Get frequency from global state
// 'Quarterly' | 'Biannually' | 'Annually'
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

        var counterId = (await getAndSetPolicyCounter()).toString()

        var policy = await policyModel.create({
            // title:`policy ${counterId}`,
            title,
            project: projectId,
            created_by: uId,
            updated_by: uId,
            ID: counterId,
            reminder,
            // tags,
            // status
        });


        // add policy to a project
        await projectModel.updateOne(
            { _id: projectId },
            {
                $addToSet: {
                    policies: policy._id
                }
            }
        )

        return {
            status: true,
            data: {
                _id: policy._id,
                nameID: counterId
            },
        };


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
            msg: "Error creating Policy",
        };

    }
}

async function createPolicyFromTemplate(
    uId: string,
    projectId: string,
    templateIds: string[],
    assignees = {
        author: [], reviewer: [], approver: []
    }
): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { edit: true } }
        ])
        assert(auth, "Auth Failed")

        // assert(assignees.author,"Must have atleast one author")
        // assert(assignees.author.length > 0,"Must have atleast 1 author")
        // assert(assignees.author.length <= 3,"Can't have more than 3 author")
        assert(templateIds.length > 0,"template id not found")

        // await Promise.all(assignees.author.map(async _id=>{
        //     var user = await userModel.exists({"_id":_id})
        //     assert(user,"author not found")
        // }))

        var reminder : null | Date = null
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

        

        
        await Promise.all(templateIds.map(async _tId=>{
            var tmp = await axios.get(`${process.env.ORG_API}/api/v2/auth/policy/${_tId}`,{
                headers:{
                    'x-api-key':global.masterData.apiKey
                }
            })
            // console.log(tmp.data)
            
            var counterId = (await getAndSetPolicyCounter()).toString()

            var policy = await policyModel.create({
                // title:`policy ${counterId}`,
                title: tmp.data['data']['title'],
                project: projectId,
                created_by: uId,
                updated_by: uId,
                ID: counterId,
                reminder,
                status: 'draft',
            });


            // add policy to a project
            await projectModel.updateOne(
                { _id: projectId },
                {
                    $addToSet: {
                        policies: policy._id
                    }
                }
            )

            await assignUserToPolicy(policy.id,uId,assignees)

        }))
        

        return {
            status: true
        };


    } catch (error: any) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }
        if (error.name === "MongoServerError" && error.code === 11000) return {
            status: false,
            msg: "Title is dublicate",
        };
        if (error instanceof AxiosError){
            return {
                status: false,
                msg: 'Policy not found',
            };
        }
        

        return {
            status: false,
            msg: "Error creating Policy",
        };

    }
}




async function createPolicyVersion(
    uId: string,
    policyId: string,
    description: string,
    assignees:{author:[],reviewer:[],approver:[]}
): Promise<myResponse> {

    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { edit: true } }
        ])
        assert(auth, "Auth Failed")
        assert(assignees.author.length > 0 && assignees.author.length <= 3,"Policy Version require author")
        var policy = await policyModel.findById(policyId).select({ count: 1, ID: 1,versions:1 })
        assert(policy, "Policy not found")
        assert(policy.versions!.draft.length < 1, "Policy already have a ongoing version")

        policy.count = policy.count + 1
        policy.assignees = assignees

        var version = await policyVersionModel.create({
            ID: `${policy.ID}.${policy?.count}`,
            description,
            policy: policyId,
            created_by: uId,
            updated_by: uId,
        });

        await policy.save()


        var log = await addLog({
            objectType: "policy",
            objectId: version.id,
            userId: uId,
            action: "add",
            description: "New policy version was created"
        })
        if (log) {
            await version.save()
            await policyModel.updateOne(
                { _id: policyId },
                {
                    $addToSet: {
                        "versions.draft": version._id
                    },
                    $push: {
                        logs: log._id
                    }
                }
            )
        }
        return {
            status: true,
            msg: version._id
        };


    } catch (error: any) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }
        if (error.name === "MongoServerError" && error.code === 11000) return {
            status: false,
            msg: "Title is dublicate",
        };
        console.log(error)
        return {
            status: false,
            msg: "Error creating Policy",
        };

    }
}

async function savePolicyVersionComments(versionId: string, uId: string, content: string | string[], images: string[]): Promise<myResponse> {

    const session = await policyModel.startSession()
    try {
        session.startTransaction()

        var auth = await checkRolePermissions(uId, [
            { policy: { view: true } }
        ])
        assert(auth, "Auth Failed")

        const version = await policyVersionModel.exists({ _id: versionId });
        assert(version, `No policy version with id: ${versionId}`)

        const comment = (await commentsModel.create([{
            content,
            created_by: uId,
            images
        }], { session }))[0]


        // var log = await addLog(globalWhere,id,uId,methodEnum.add,"New policy comments was created")
        var log = await addLog({
            objectType: "policyVersion",
            objectId: version._id,
            userId: new Types.ObjectId(uId),
            action: "add",
            description: "New policy comments was created"
        })

        if (log) {
            const result = await policyVersionModel.updateOne(
                { _id: versionId },
                { $push: { comments: comment._id, logs: log!._id } },
                { session }
            );

            assert(result.modifiedCount, `Failed to add comment to policy version with id: ${versionId}`)

        }

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
// TODO: get policy or policy version
async function getAllPolicy(uId: string, _page: string, _count: string, sort = { field: "updated_at", order: "asc" }, search = ""): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var page = parseInt(_page)
        var count = parseInt(_count)

        const pipeline: PipelineStage[] = []

        if (!!search) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: search, $options: "i" } },
                        { ID: { $regex: search, $options: "i" } }
                    ]
                }
            })
        }

        pipeline.push(
            { $project: { ID: 1, title: 1, status: 1,tags:1,assignees:1,created_at:1,updated_at:1 } },
            {
                $addFields: {
                    status: {
                      $cond: {
                        if: { $gt: [ { $getField: "versions.active" }, 0 ] },
                        then: { $getField: "status" }, // Set the status to "reviewed" if active array has elements
                        else: "Comming Soon"  // Set the status to "drafted" if active array is empty
                      }
                    }
                  }
            }
        )

        if (!!sort.field) {
            pipeline.push({ $sort: { [sort.field]: sort.order === "asc" ? 1 : -1 } })
        }
        pipeline.push(
            { $skip: (page - 1) * count },
            { $limit: count }
        )

        const policies = await policyModel.aggregate(pipeline);
            await policyModel.populate(policies,[
            {path:"tags",select:{name:1}},
            {path:"assignees.author",select:{email:1,firstname:1,lastname:1,image:1}},
            {path:"assignees.reviewer",select:{email:1,firstname:1,lastname:1,image:1}},
            {path:"assignees.approver",select:{email:1,firstname:1,lastname:1,image:1}},
        ])
        const totalCount = await policyModel.countDocuments()
        return {
            status: true,
            count: totalCount,
            policies
        }
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: true,
            msg: error.message
        }
        console.log(error)

        return {
            status: false,
            msg: "Error"
        }
    }
}

async function overview(uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { view: true } }
        ])
        assert(auth, "Auth Failed")

        const data = (await policyModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]));
        var overview: { [key: string]: number } = {}

        data.forEach((item: overviewItem) => {
            overview[item._id] = item.count;
        });
        return {
            status: true,
            data: [
                { label: "Total Count", value: Object.values(overview).reduce((a, b) => a + b, 0) },
                { label: "Active", value: overview.approved || 0 },
                { label: "Inactive", value: overview.inactive || 0 },
                { label: "In Draft", value: overview.draft || 0 },
                { label: "In Review", value: overview.drafted || 0 },
            ]
        }
    } catch (error) {
        // console.log(error)
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

async function getPolicyVersionComments(versionId: string, _page: string, _count: string, uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var page = parseInt(_page)
        var count = parseInt(_count)
        const commentsIds = await policyVersionModel.aggregate([
            { $match: { _id: new Types.ObjectId(versionId) } },
            { $project: { comments: 1 } },
            { $unwind: '$comments' },
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);
        assert(commentsIds, "No Comments")
        var comments = (await policyVersionModel.populate(commentsIds, { path: "comments" })).map(e => e.comments[0])

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

async function getPolicy(id: string, uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var policy = await policyModel.findById(id).select({ count: 0, logs: 0 }).exec();
        assert(policy, `No policy with id: ${id}`)
        await policy.populate("tags")
        return {
            status: true,
            policy,
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
async function getPolicyVersion(policyId: string, versionId: string, uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { view: true } }
        ])
        assert(auth, "Auth Failed")


        var policy = await policyModel.findById(policyId).select({ versions: 1 }).exec();
        assert(policy, `Policy not found`)


        var version = await policyVersionModel.findById(versionId).select({ comments: 0, logs: 0 }).exec();
        assert(version, `No policy version with id: ${versionId}`)


        // CHECK if author, reviwer and approver exists or not
        var _change = false
        if (version.assignees?.author) {
            await Promise.all(version.assignees.author.map(async (userId, _index) => {
                var exists = await userModel.exists({ _id: userId })
                if (!exists) {
                    _change = true;
                    delete version!.assignees!.author[_index]
                }
            }))
            version!.assignees!.author = version!.assignees!.author.filter((value) => value !== undefined)

        }

        if (version.assignees?.reviewer) {
            await Promise.all(version.assignees.reviewer.map(async (userId, _index) => {
                var exists = await userModel.exists({ _id: userId })
                if (!exists) {
                    _change = true;
                    delete version!.assignees!.reviewer[_index]
                }
            }))
            version!.assignees!.reviewer = version!.assignees!.reviewer.filter((value) => value !== undefined)

        }

        if (version.assignees?.approver) {
            await Promise.all(version.assignees.approver.map(async (userId, _index) => {
                var exists = await userModel.exists({ _id: userId })
                if (!exists) {
                    _change = true;
                    delete version!.assignees!.approver[_index]
                }
            }))
            version!.assignees!.approver = version!.assignees!.approver.filter((value) => value !== undefined)

        }


        if (_change) await version.save()

        if (!policy.versions?.active.length && version.status == policyStatusEnum.draft) {
            version.status = 'Comming Soon'
        }

        return {
            status: true,
            version,
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

// async function getVersion(versionId: string, uId: string): Promise<myResponse> {
//     try {
//         var auth = await checkRolePermissions(uId, [
//             { policy: { view: true } }
//         ])
//         assert(auth, "Auth Failed")

//         var version = await policyVersionModel.findById(versionId)
//         assert(version, "No version found")

//         return {
//             status: true,
//             version
//         }
//     } catch (error) {
//         if (error instanceof AssertionError) return {
//             status: false,
//             msg: error.message
//         }
//         return {
//             status: false,
//             msg: "Error"
//         }
//     }
// }

async function getTotalCount(uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { policy: { view: true } }
        ])
        assert(auth, "Auth Failed")
        var count = await policyModel.countDocuments()
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
async function assignUserToPolicy(policyId: string, uId: string, assignees = {
    author: [], reviewer: [], approver: []
}) {

    try {
        // var auth = await checkPolicyVersionAccessToUser(versionId, uId)
        // assert(auth, "Auth Failed")

        var version = await policyModel.exists({ _id: policyId })
        assert(version, `No version with id: ${policyId}`)

        var auth = await isPolicyAssignee(policyId, uId)
        assert(auth, "Auth Failed")

        assert(assignees.author.length <= 3,"Not more than 3 Authors")
        assert(assignees.reviewer.length <= 3,"Not more than 3 Reviewer")
        assert(assignees.approver.length <= 3,"Not more than 3 Approver")

        await policyModel.updateOne(
            { _id: policyId },
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
            objectType: "policy",
            objectId: version._id,
            userId: new Types.ObjectId(uId),
            action: "add",
            description: "New policy comments was created"
        })
        if (log) {

            await policyModel.updateOne(
                { _id: policyId },
                {
                    $push: {
                        logs: log
                    }
                }
            )

        }

        return {
            status: true,
            msg: "Added users to the policy",
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


async function addPolicyTags(id: string, uId: string, tags: incomingTagsData): Promise<myResponse> {
    const session = await policyModel.startSession()
    session.startTransaction()

    try {
        var auth = await checkRolePermissions(uId, [{
            policy: {
                edit: true
            }
        }])
        assert(auth, "Auth Failed")

        var policy = await policyModel.exists({ _id: id })
        assert(policy, `No policy with id: ${id}`)
        // console.log(tags)
        var allTags = await addOnePolicyToManyTags(id, tags, uId, session)
        // console.log(allTags)
        assert(allTags.length, "Error! Can't add tags")

        await policyModel.updateOne(
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

        // [ ] 
        // await sendNotifcationWapper(id, "added tags", uId)

        var log = await addLog({
            objectType: "policy",
            objectId: policy._id,
            userId: uId,
            action: "add",
            description: "New Tags are added to the policy"
        })
        if (log) {


            await policyModel.updateOne(
                { _id: id },
                {
                    $push: {
                        logs: log
                    }
                },
                { session }
            )
        }

        await session.commitTransaction()
        return {
            status: true,
            msg: `Added tags to policies: ${id}`,
        };
    } catch (error) {
        await session.abortTransaction()
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Can't add tags to policy",
        };
    } finally {
        if (!session.hasEnded) await session.endSession()
    }

}


// UPDATE

async function updatePolicyVersionDetails(versionId: string, uId: string, props: policyUpdateInterface) {
    try {
        var auth = await checkPolicyVersionAccessToUser(versionId, uId)
        assert(auth, "Auth Failed")

        // var policy = await policyModel.findOne({_id:policyId}).select({onWatch:1})
        // assert(policy, "Auth Failed")


        var version = await policyVersionModel.findOneAndUpdate(
            { _id: versionId },
            {
                $set: {
                    description: props.description,
                    content: props.content,
                    beingModified: props.beingModified,
                    updated_by: uId, updated_at: Date.now()
                },
            },
            { new: true, runValidators: true }
        );
        assert(version, "Version not found")

        await sendNotifcationWapper(version.onWatch, versionId, "was updated", uId)

        var log = await addLog({
            objectType: "policy",
            objectId: versionId,
            userId: uId,
            action: "update",
            description: "Updated policy details"
        })
        if (log) {

            await policyVersionModel.updateOne(
                { _id: versionId },
                {
                    $push: {
                        logs: log._id
                    }
                }
            )

        }

        return {
            status: true,
            msg: `Policy version with id: ${version.ID} updated`,
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

async function changePolicyVersionStatus(versionId: string, uId: string, type: string): Promise<myResponse> {
    try {
        var auth = await isAdmin(uId)
        var version = await policyVersionModel.findById(versionId).select({ status: 1, ID: 1, policy: 1 }).exec()
        assert(version, "Policy version not found")
        var policy = await policyModel.findById(version.policy).select({  assignees: 1 }).exec()
        assert(policy, "Policy version not found")
        if (!auth) {
            // if Not a admin
            auth = await isPolicyAssignee(policy._id, uId)
            // console.log({auth})
            assert(auth, "Auth Failed")
            switch (type) {
                case policyStatusEnum.draft:
                    assert((
                        version.status == policyStatusEnum.rejected
                    ), "For changing it's state, it should be in draft or rejected state")
                    assert(policy.assignees!.author.length >= 1,"No author selected")
                    break;
                case policyStatusEnum.drafted:
                    assert((
                        version.status == policyStatusEnum.draft
                    ), "For changing it's state, it should be in draft or rejected state")
                    assert(policy.assignees!.reviewer.length >= 1,"No reviewer selected")
                    var auth = await isPolicyAssignee(policy._id, uId)
                    break;
                case policyStatusEnum.reviewed:
                    if (global.masterData.workflow.tier3Enabled) {
                        assert(version.status == policyStatusEnum.drafted, "For reviewing, policy should be drafted")
                        var auth = await isPolicyReviewer(policy._id, uId)
                        assert(policy.assignees!.approver.length >= 1,"No approver selected")
                    } else {
                        assert(false, "Not available")
                    }
                    break;
                case policyStatusEnum.approved:
                    if (global.masterData.workflow.tier3Enabled) {
                        assert(version.status == policyStatusEnum.reviewed, "For approving, policy should be reviewed")
                    } else {
                        assert(version.status == policyStatusEnum.drafted, "For approving, policy should be drafted")
                    }
                    var auth = await isPolicyApprover(policy._id, uId)
                    break;
                case policyStatusEnum.inactive:
                    assert((version.status == policyStatusEnum.draft || version.status == policyStatusEnum.approved), "For inactivating, policy should be in active state")
                    var auth = await isPolicyAssignee(policy._id, uId)
                    break;
                case policyStatusEnum.rejected:
                    switch (version.status) {
                        case policyStatusEnum.drafted:
                            var auth = await isPolicyReviewer(policy._id, uId)
                            break
                        case policyStatusEnum.reviewed:
                            var auth = await isPolicyApprover(policy._id, uId)
                            break
                    }
                    break;
                default:
                    var auth = false
                    break;
            }

            assert(auth, "Auth Failed")


        }

        var set;
        if (type == policyStatusEnum.rejected) {
            set = {
                status: type,
                onWatch: true
            }
        } else {
            set = {
                status: type,
            }
        }

        await policyVersionModel.updateOne(
            { _id: versionId },
            {
                $set: set
            }
        )

        await policyModel.updateOne(
            { _id: version.policy },
            {
                $set: set
            }
        )


        var userEmail = await userModel.findById(uId).select({ email: 1 })
        if (policy.assignees) {
            // Send To All
            await Promise.all(policy.assignees.author.map(async (userId) => {
                if (uId == userId.toString()) return
                await createNotification(userId, `policyId: ${version?.ID} status changed to ${type} by ${userEmail?.email}`)
            }))
            await Promise.all(policy.assignees.reviewer.map(async (userId) => {
                if (uId == userId.toString()) return
                await createNotification(userId, `policyId: ${version?.ID} status changed to ${type} by ${userEmail?.email}`)
            }))
            await Promise.all(policy.assignees.approver.map(async (userId) => {
                if (uId == userId.toString()) return
                await createNotification(userId, `policyId: ${version?.ID} status changed to ${type} by ${userEmail?.email}`)
            }))

        }


        var log = await addLog({
            objectType: "policy",
            objectId: versionId,
            userId: uId,
            action: "update",
            description: `Updated policy status to ${type}`
        })
        if (log) {
            await policyVersionModel.updateOne(
                { _id: version },
                {
                    $push: {
                        logs: log._id
                    }
                }
            )

        }

        return {
            status: true,
            msg: "Policy status changed"
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

async function updatePolicyReminder(id: string, uId: string, next_reminder: string) {
    // check if policy exists
    try {
        var policy = await policyModel.exists({ _id: id })
        assert(policy, `No policy with id: ${id}`)

        var auth = await checkRolePermissions(uId, [{
            policy: {
                edit: true
            }
        }])
        assert(auth, "Auth Failed")


        // Change policy status
        const result = await policyModel.updateOne(
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
                msg: `Unable to change policy reminder`,
            };
        }

        var log = await addLog({
            objectType: "policy",
            objectId: id,
            userId: uId,
            action: "update",
            description: "Updated policy details"
        })
        if (log) {

            await policyModel.updateOne(
                { _id: id },
                {
                    $push: {
                        logs: log._id
                    }
                }
            )
        }




        return {
            status: true,
            msg: `Changed policy reminder`,
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
async function unAssignUserToPolicyVersion(policyId: string, uId: string, assignees = {
    author: [], reviewer: [], approver: []
}) {
    try {
        var policy = await policyModel.exists({ _id: policyId })
        assert(policy, `No policy with id: ${policyId}`)

        var auth = await isPolicyAssignee(policyId, uId)
        assert(auth, "Auth Failed")


        await policyModel.updateOne(
            { _id: policy._id },
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

        var log = await addLog({
            objectType: "policy",
            objectId: policy._id,
            userId: uId,
            action: "delete",
            description: `Deleted users from policy `
        })
        if (log) {
            await policyModel.updateOne(
                { _id: policy._id },
                {
                    $push: {
                        logs: log._id
                    }
                }
            )
        }

        return {
            status: true,
            msg: `Removed assignees from policy version ${policy._id}`,
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Can't remove assignees to policy",
        };
    }



}

async function deletePolicyVersion(policyId: string, versionId: string, uId: string) {
    const session = await policyModel.startSession()
    try {
        // auth 
        var auth = await checkPolicyVersionAccessToUser(versionId, uId)
        assert(auth, "Auth Failed")

        // var version = await policyVersionModel.exists({ _id: versionId })
        // assert(version, `No policy with id: ${versionId}`)

        // var policy = policyModel.exists({ _id: id })
        // assert(policy, `No policy with id: ${id}`)

        session.startTransaction()
        await policyModel.updateOne(
            { _id: policyId },
            {
                $pull: {
                    "versions.active": versionId,
                    "versions.draft": versionId,
                }
            },
            { session }
        )

        await policyVersionModel.findByIdAndDelete({ _id: versionId }, { session })

        var log = await addLog({
            objectType: "policy",
            objectId: versionId,
            userId: uId,
            action: "delete",
            description: `Deleted policy policy version`
        })
        if (log) {
            await policyVersionModel.updateOne(
                { _id: versionId },
                {
                    $push: {
                        logs: log._id
                    }
                },
                { session }
            )
        }

        await session.commitTransaction()
        if (!session.hasEnded) session.endSession()
        return {
            status: true,
            msg: "Policy version is Deleted"
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

async function deletePolicyTags(id: string, uId: string, tags: [string]): Promise<myResponse> {
    try {
        // var policy = await policyModel.exists({ _id: id })
        // assert(policy, `No policy with id: ${id}`)

        // var auth = await checkPolicyAccessToUser(id, uId)
        var auth = await checkRolePermissions(uId, [{
            policy: {
                edit: true
            }
        }])
        console.log(auth)
        assert(auth, "Auth Failed")

        await policyModel.updateOne(
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

        assert(!await rmOnePolicyFromManyTags(id, tags, uId), "Can't remove tags")

        var log = await addLog({
            objectType: "policy",
            objectId: id,
            userId: uId,
            action: "delete",
            description: `Removed policy tags `
        })
        if (log) {


            await policyModel.updateOne(
                { _id: id },
                {
                    $push: {
                        logs: log._id
                    }
                }
            )
        }

        return {
            status: true,
            msg: `Removed tags to policies: ${id}`,
        };

    } catch (error) {

        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Can't remove tags to policy",
        };
    }
}

async function deletePolicyVersionComment(versionId: string, cId: string, uId: string) {
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
        const result = await policyVersionModel.updateOne(
            { _id: versionId, comments: cId },
            {
                $pull: { comments: cId },
                $set: { updated_at: Date.now(), updated_by: uId },
            }
        );

        if (result.modifiedCount === 0) {
            return {
                status: false,
                msg: `No Comment of id: ${cId} in policy with id: ${versionId}`,
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

        var log = await addLog({
            objectType: "policy",
            objectId: versionId,
            userId: uId,
            action: "delete",
            description: `Removed comments from policy`
        })
        if (log) {


            await policyVersionModel.updateOne(
                { _id: versionId },
                {
                    $push: {
                        logs: log._id
                    }
                }
            )
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

async function deletePolicy(id: string, uId: string): Promise<myResponse> {
    try {
        var auth = await isPolicyAssignee(id, uId)
        assert(auth, "Auth Failed")

        var policy = await policyModel.findById(id).select({ versions: 1, status: 1 })
        assert(policy, "Policy Not Found")
        assert(
            (policy.status == policyStatusEnum.approved)
            ||
            (policy.status == policyStatusEnum.draft),
            "Can't delete policy"
        )

        await policyModel.updateOne(policy._id, {
            $set: {
                status: policyStatusEnum.deleted
            }
        });

        // remove tags associated with it
        var removed = await rmOnePolicyFromManyTags(id, policy.tags, uId)
        assert(removed, "Tags not removed")

        var log = await addLog({
            objectType: "policy",
            objectId: id,
            userId: uId,
            action: "delete",
            description: `Deleted policy `
        })
        if (log) {

            await policyModel.updateOne(
                { _id: id },
                {
                    $push: {
                        logs: log._id
                    }
                }
            )
        }

        return {
            status: true,
            msg: `Policy with id: ${id} was deleted`,
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

async function revivePolicy(id: string, uId: string): Promise<myResponse> {
    try {
        var auth = await isPolicyAssignee(id, uId)
        assert(auth, "Auth Failed")

        var policy = await policyModel.findByIdAndUpdate(id, {
            $set: {
                status: policyStatusEnum.draft
            }
        });
        if (!policy) return {
            status: false,
            msg: `No policy with id: ${id}`,
        }

        // remove tags associated with it
        var removed = await rmOnePolicyFromManyTags(id, policy.tags, uId)
        assert(removed, "Tags not removed")

        var log = await addLog({
            objectType: "policy",
            objectId: id,
            userId: uId,
            action: "update",
            description: `Policy Revived`
        })
        if (log) {


            await policyModel.updateOne(
                { _id: id },
                {
                    $push: {
                        logs: log._id
                    }
                }
            )
        }

        return {
            status: true,
            msg: `Policy with id: ${id} was revived`,
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



async function exportPolicyVersion(policyId: string, versionId: string, uId: string): Promise<myResponse> {
    try {
        var policy = await policyModel.findById(policyId).select({ title: 1 })
        assert(policy, "Policy not found")

        var version = await policyVersionModel.findById(versionId)
        assert(version, "Policy version not found")

        var auth = await checkRolePermissions(uId, [
            { policy: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var data = await pdfExport(policy.title, '', policy.title, version.assignees?.author!, version.ID!)
        return {
            status: true,
            data,
            msg: policy?.title
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
    createPolicy,
    createPolicyVersion,
    savePolicyVersionComments,
    assignUserToPolicy,
    addPolicyTags,
    createPolicyFromTemplate,

    getPolicy,
    getAllPolicy,
    getPolicyVersionComments,
    getPolicyVersion,
    getTotalCount,
    overview,

    updatePolicyVersionDetails,
    changePolicyVersionStatus,
    updatePolicyReminder,

    unAssignUserToPolicyVersion,
    deletePolicyVersion,
    deletePolicyVersionComment,
    deletePolicyTags,
    deletePolicy,

    revivePolicy,
    exportPolicyVersion

};