import { Schema,model} from "mongoose";

const linksSchema = new Schema({
    email:{
        type:String,
        required:true,
    },
    created_by:{
        type:Schema.Types.ObjectId,
        ref: "users",
    },
    created_at:{
        type: Date,
        default: Date.now,
    },
    checkedIn:{
        type:Boolean,
        default: false,
    },
    expiryDate:{
        type: Date,
        required:true
    }
})

const linksModel = model("links",linksSchema)
export default linksModel
