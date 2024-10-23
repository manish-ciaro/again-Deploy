import { Schema,model} from "mongoose";

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    notifications:[{
        content:{
            type: String
        },
        date:{
            type: Number
        },
        viewed:{
            type: Boolean
        }
    }],
})

const notificationModel = model("notification",notificationSchema)
export default notificationModel
