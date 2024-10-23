import controlsModel from "../models/controlsModel.js";
import myResponse from "../../@types/response.js";
import { PipelineStage, Types } from "mongoose";
import { checkRolePermissions } from "../../utils/roles.js";
import assert, { AssertionError } from "assert";
import controlGroupsModel from "../models/controlGroupsModel.js";
import { getAndSetControlCounter } from "../models/counterModel.js";

// CREATE
async function saveControl(uId:string, name:string,group:string,content:string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { control: { fullAccess: true } }
        ])
        assert(auth, "Auth Failed")


        var counterId = (await getAndSetControlCounter()).toString()

        var control = await controlsModel.create({
            content,
            name,
            nameId: counterId,
            group,
            created_by: uId,
            updated_by: uId,
            custom: true
        });
    } catch (error) {
        // console.log(error)
        return {
            status: false,
            msg: "Error creating Policy",
        };
    }

    return {
        status: true,
        msg: control.id,
    };
}


async function createControlGroup(groupName:string):Promise<myResponse> {
    try {
        var group = await controlGroupsModel.create({name:groupName})
        assert(group,"Group not created")
        return {
            status:true,
            msg:group._id
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

// RETRIVE
// async function getAllControls(_page: string, _count: string,search:string,uId: string): Promise<myResponse> {
//     try {
//         var auth = await checkRolePermissions(uId, [
//             { control: { view: true } }
//         ])
//         assert(auth, "Auth Failed")

//         var page = parseInt(_page)
//         var count = parseInt(_count)

//         const pipeline:PipelineStage[] = []
//         if(!!search){
//             pipeline.push({ $match: { $or:[
//                 {nameId: { $regex: `^${search}`, $options: "i" }},
//                 {name: { $regex: `${search}`, $options: "i" }},
//             ] } })
//         }
//         pipeline.push(
//             { $project: { content: 1, created_by: 1, created_at: 1, updated_at: 1, updated_by: 1} },
//             { $skip: (page - 1) * count },
//             { $limit: count },
//         )

//         const controls = await controlsModel.aggregate(pipeline);
//         return {
//             status: true,
//             controls
//         }
//     } catch (error) {
//         // console.log(error)
//         if (error instanceof AssertionError) return {
//             status: true,
//             msg: error.message
//         }

//         return {
//             status: false,
//             msg: "Error"
//         }
//     }
// }

async function getAllControlsFromGroup(_page: string, _count: string,search:string,groupId:string,uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { control: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var page = parseInt(_page)
        var count = parseInt(_count)

        var matchPipeline:PipelineStage.Match = {$match:{}}
        if(!!groupId){
            var group = await controlGroupsModel.findById(groupId)
            matchPipeline.$match["_id"] = {$in:group?.controls || []}
        }

        if(!!search){
            matchPipeline.$match["$or"] = [
                {nameId: { $regex: `^${search}`, $options: "i" }},
                {name: { $regex: `${search}`, $options: "i" }}, 
            ]
        }



        const pipeline:PipelineStage[] = []
        if(!!search || !!groupId){
            pipeline.push(matchPipeline)
        }
        pipeline.push(
            { $skip: (page - 1) * count },
            { $limit: count },
        )

        const controls = await controlsModel.aggregate(pipeline);
        return {
            status: true,
            controls
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
async function getAllGroups(_page: string, _count: string,search:string,uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { control: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var page = parseInt(_page)
        var count = parseInt(_count)
        

        const groups = await controlGroupsModel.aggregate([
            { $match: { name: { $regex: search, $options: "i" } } },
            { $project: { name: 1} },
            { $skip: (page - 1) * count },
            { $limit: count }
        ]);
        return {
            status: true,
            groups
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


async function getSubControls(nameId:string,groupId:string,uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { control: { view: true } }
        ])
        assert(auth, "Auth Failed")

        console.log(groupId)
        var group = await controlGroupsModel.findById(groupId)
        assert(group,"Group not found")

        var controls = await controlsModel.aggregate([
            {$match:{
                _id:{$in:group.controls},
                nameId: { $regex: `^${nameId}.`, $options: "i" },
            }}
        ]);

        // var tmp = createNestedJsonWithSubDocs(controls)

        return {
            status: true,
            controls
            // controls:tmp
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

async function getControl(id: string,uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { control: { view: true } }
        ])
        assert(auth, "Auth Failed")

        const control = await controlsModel.findById(id);
        assert(control,"Control not found")
        return {
            status: true,
            control
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




// UPDATE
async function updateControl(id:string,uId:string,content:string): Promise<myResponse>{
    // check if control exists
    try {
        var control = await controlsModel.findById(id)
        if(control == null) return{
            status: false,
            msg: `No control with id: ${id}`
        }
        assert(control.custom,"Can't edit default controls")

        control.content = content
        await control.save()
    
        return{
            status: true,
            msg: `Control updated`
        }
        
    } catch (error) {
        return{
            status: false,
            msg: "Can't update"
        }
    }

}

// DELETE
async function deleteControl(id:string,uId:string): Promise<myResponse>{
    // remove the control from database
    try {
        await controlsModel.findByIdAndDelete(id)
    } catch(error) {
        // console.log(error)
        return{
            status: false,
            msg: `No control with id: ${id}`
        }
    }


    return{
        status: true,
        msg: `Control Deleted`
    }

}

// CHECK












export {
    saveControl,
    // getAllControls,
    createControlGroup,
    getAllControlsFromGroup,
    getSubControls,
    getAllGroups,
    getControl,
    updateControl,
    deleteControl
}
