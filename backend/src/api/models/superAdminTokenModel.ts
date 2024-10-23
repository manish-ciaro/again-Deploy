import { Schema,model} from "mongoose";

const tokenSchema = new Schema({
    username:{
        type:String,
        required:true
    },
    created_at:{
        type: Date,
        default: Date.now,
    },  
    expiryDate: {
        type: Date,
        default: Date.now
    }
})

const superAdminToken = model("superadmintokens",tokenSchema)
export default superAdminToken