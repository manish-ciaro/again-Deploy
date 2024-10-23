import logsModel from "../models/logsModel.js";
import policyModel from "../models/policyModel.js";
import { LogType } from "../models/logsModel.js";
import { Types } from "mongoose";
import myResponse from "../../@types/response.js";
import { checkRolePermissions } from "../../utils/roles.js";
import assert  from "assert";
// CREATE
async function addLog({objectType,objectId,userId,action,description}:LogType): Promise<Types.ObjectId|null> {
    try {
        // if(!masterData.log.category[objectType]) return null;
        const log = await logsModel.create({
            objectType,
            objectId,
            userId,
            action,
            description
        })
        return log.id
    } catch (error) {
        return null
    }
}

// Retrive 
async function logs(uId:string,page:number, count:number,sortBydate: number):Promise<myResponse> { // by default sortBydate = desc
    try {
        // auth
        var auth = await checkRolePermissions(uId,[
            {admin: true}
        ])
        assert(auth,"Auth Failed")
        const logs = await logsModel.aggregate([
            { 
                $sort: {
                    timestamp : sortBydate === 1 ? 1 : -1
                } 
            },
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);
        return {
            status:true,
            data: logs
        }
    } catch (error) {
        if(error instanceof assert.AssertionError) return{
            status: false,
            msg: error.message
        }

        return {
            status:true,
            msg: "Error"
        }
    }
}

async function logs_policy(id:string,uId:string):Promise<myResponse> { // by default sortBydate = desc
    try {
        var auth = await checkRolePermissions(uId,[
            {admin: true}
        ])
        assert(auth,"Auth Failed")

        var logs = await policyModel.aggregate([
            {$match:{_id:new Types.ObjectId(id)}},
            {$project:{logs:1}},
        ])
        logs[0].logs.reverse()
        await logsModel.populate(logs,{path:'logs'})
        return logs[0].logs
    } catch (error) {
        if(error instanceof assert.AssertionError) return{
            status: false,
            msg: error.message
        }

        return {
            status:true,
            msg: "Error"
        }
    }
}


export {
    addLog,
    logs,
    logs_policy
}
