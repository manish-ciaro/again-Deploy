import { Schema,model} from "mongoose";

const tokenSchema = new Schema({
    email:{
        type:String,
        required:true
    },
    token:{
     type:String,
     required:false
    },
    created_at:{
        type: Date,
        default: Date.now,
    },
    tokenExpiry: {
        type: Date,
        required:true
    }
})

const userTokenModel = model("userTokens",tokenSchema)
export default userTokenModel