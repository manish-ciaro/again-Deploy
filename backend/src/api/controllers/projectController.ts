import assert, { AssertionError } from "assert";
import myResponse from "../../@types/response.js";
import { checkRolePermissions } from "../../utils/roles.js";
import projectModel from "../models/projectModel.js";
import policyModel from "../models/policyModel.js";
import { Types } from "mongoose";

// import "./tests/controlT est.js"

interface bodyForAddingInterface  {
    name: string,
    created_by?: string,
    created_at?: Date,
}

// CREATE
async function create(name:string,description:string,uId:string):Promise<myResponse> {
    try {
        // auth
        var auth = await checkRolePermissions(uId,[
            {admin: true}
        ])
        assert(auth,"Auth Failed")

        var project = await projectModel.create({
            name,
            description,
            created_by: uId
        })

        return {
            status: true,
            msg: project._id
        }

    } catch (error) {
        if(error instanceof AssertionError) return{
            status:false,
            msg:error.message
        }
        return{
            status:false,
            msg:"Error"
        }
        
    }
}

// RETRIVE
async function getAll(page = 1, count = 10, name: string = "", uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { admin: true  }
        ])
        assert(auth,"Auth Failed")

        var projects = await projectModel.aggregate([
            { $match: { name: { $regex: name, $options: "i" } } },
            { $project: { name: 1,description:1} },
            { $skip: (page - 1) * count },
            { $limit: count }
        ])
        return {
            status: true,
            projects
        }
    } catch (error) {
        if(error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }
}

async function getProject(projectId:string, uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { admin: true  }
        ])
        assert(auth,"Auth Failed")

        var project = await projectModel
                                .findById(projectId)
                                .populate("scopes","name")
                                .populate("policies","title")
        assert(project,"Project not found")
        return {
            status: true,
            project
        }
    } catch (error) {
        if(error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }
}


async function getProjectPolicies(projectId:string, page:number, count:number,policyTitle="", uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { admin: true  }
        ])
        assert(auth,"Auth Failed")

        const project = await policyModel.aggregate([
            { $match: {project: new Types.ObjectId(projectId)}},
            { $match: { title: { $regex: policyTitle, $options: "i" } } },
            { $project: { title: 1 } },
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);
                            
        assert(project,"Project policies not found")
        

        return {
            status: true,
            project
        }
    } catch (error) {
        if(error instanceof AssertionError) return {
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

// Update

async function updateProject(projectId:string,name:string, uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { admin: true  }
        ])
        assert(auth,"Auth Failed")

        var exists = await projectModel.exists({_id:projectId})
        assert(exists,"Project not found")

        var update = await projectModel.updateOne(
            {_id: projectId},
            {
                $set:{name}
            }
        )
        assert(update,"Nothing to update")

        return {
            status: true,
            msg: "updated"
        }
    } catch (error) {
        if(error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }
}

//  DELETE
async function deleteProject(projectId:string, uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { admin: true  }
        ])
        assert(auth,"Auth Failed")

        var project = await projectModel.findByIdAndDelete(projectId)
        assert(project,"Project not found")

        return {
            status: true,
            msg: "deleted"
        }
    } catch (error) {
        if(error instanceof AssertionError) return {
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
    create,
    getAll,
    getProject,
    getProjectPolicies,
    updateProject,
    deleteProject
}



