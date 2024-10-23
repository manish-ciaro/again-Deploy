import { Schema,model} from "mongoose";

const superAdminEmailSchema = new Schema({
    username:{
        type:String,
        required:true,
    },
    email:{
         type:String,
         required:true,
    },
    userId:{
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    created_at:{
        type: Date,
        default: Date.now,
    }

})

const superAdminEmailModel = model("superAdminEmail",superAdminEmailSchema)
export default superAdminEmailModel