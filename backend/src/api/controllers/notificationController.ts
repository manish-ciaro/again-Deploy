import assert, { AssertionError } from "assert";
import notificationModel from "../models/notificationModel.js";
import userModel from "../models/userModel.js";
import { Types } from "mongoose";
import myResponse from "../../@types/response.js";

// CREATE
async function createNotification(userId:string | Types.ObjectId,content:string) {
    try {
        var userExists = await userModel.exists({_id:userId})
        assert(userExists)
        var notification = await notificationModel.exists({
            userId: userId
        })
        if(!notification){
            // @ts-ignore
            var notification = await notificationModel.create({
                userId: userId
            })
        }
        assert(notification)
        await notificationModel.updateOne(
            {_id:notification._id},
            {
                $push:{
                    notifications:{
                        content,
                        date: Date.now(),
                        viewed: false
                    }
                }
            }
        )

        return true
    } catch (error) {
        return false
    }
}



// RETRIVE
async function getAllNotifications(userId:string):Promise<myResponse> {
    try {
        // auth
        // var auth  = await isAdmin(uId)
        // var auth = userId == uId
        // if(auth){
        // }
        // assert(auth,"Auth Failed")

        var notification = await notificationModel.findOne({
            userId
        })
        assert(notification,"No notifications")

        return{
            status: true,
            notifications: notification.notifications
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






export{
    createNotification,
    getAllNotifications
}


