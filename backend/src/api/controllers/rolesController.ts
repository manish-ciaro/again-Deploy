import myResponse from "../../@types/response.js"
import { checkRolePermissions } from "../../utils/roles.js"
import rolesModel, { RoleInterface } from "../models/rolesModel.js"
import { Types } from "mongoose"
import assert, { AssertionError } from "assert"

// CREATE
async function create(body:Partial<RoleInterface>,uId:string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId,[
            {userControl: {fullAccess:true}}
        ])
        assert(auth,"Auth Failed")

        // delete body.superAdmin
        var role = await rolesModel.create(body)
        return {
            status: true,
            msg: role.id
        }
    } catch (error) {
        if(error instanceof AssertionError) return{
            status:false,
            msg:error.message
        }

        return {
            status: false,
            msg: "Error"
        }
    }
}

// RETRIVE
async function getAllRoles(page = 1, count = 10, name: string = "", uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { userControl: { view: true } }
        ])
        assert(auth,"Auth Failed")

        var roles = await rolesModel.aggregate([
            { $match: { name: { $regex: name, $options: "i" } } },
            { $project: { name: 1} },
            { $skip: (page - 1) * count },
            { $limit: count }
        ])
        return {
            status: true,
            roles
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

async function getRole(roleId:string, uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { userControl: { view: true } }
        ])
        assert(auth,"Auth Failed")

        var role = await rolesModel.findById(roleId)
        assert(role,"role not found")
        return {
            status: true,
            role
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

// RETRIVE
async function getTotalRolesCount(uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { userControl: { view: true } }
        ])
        assert(auth,"Auth Failed")

        var count = await rolesModel.countDocuments({})
        return {
            status: true,
            count
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



// UPDATE
async function updateRole(roleId:string,body:RoleInterface,uId:string):Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { userControl: { fullAccess: true } }
        ])
        assert(auth,"Auth Failed")


        var update = await rolesModel.updateOne(
            {_id: new Types.ObjectId(roleId)},
            body,
            {runValidators: true}
        )
        assert(update.modifiedCount,"Nothing to modify")
        return{
            status: true,
            msg: "Role modified"
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
// LINK



// DELETE
async function deleteById(id:string,uId:string): Promise<myResponse> {
    // TODO ensure basic roles are not deleted
    
    try {
        var auth = await checkRolePermissions(uId,[
            {userControl: {fullAccess:true}}
        ])
        assert(auth,"Auth Failed")
        
        await rolesModel.deleteOne({_id:id})
        
        return {
            status: true,
            msg: "Role Deleted"
        }
    } catch (error) {
        if(error instanceof AssertionError) return{
            status:false,
            msg:error.message
        }

        return {
            status: false,
            msg: "Error"
        }
    }
}


export{
    create,
    getAllRoles,
    getRole,
    updateRole,
    deleteById,
    getTotalRolesCount
}
