import { Schema,model} from "mongoose";

const userSchema = new Schema({
    ssoUser:{
        type:Boolean,
        default:false
    },
    image:{
        type: Schema.Types.ObjectId,
        ref: "files"
    },
    email: {
        type:String,
        unique: true,
        required:true,
    },
    firstname: {
        type: String,
        // required:true,
        default:null
    },
    lastname: {
        type: String,
        // required:true,
        default:null
    },
    hashedPassword: {
        type: String,
        default: null
    },
    prevPassword:{
        type: [String]
    },
    passExpiry: {
        type: Number,
        default: Date.now()
    },
    jobTitle:{
        type: String
    },
    phone:{
        type: String,
        maxLength: 12,
        minLength: 10
    },
    mobilePhone:{
        type: String,
        maxLength: 12,
        minLength: 10
    },
    country:{
        type: String
    },
    locale:{
        type: String
    },
    lastLogin:{
        type: Number
    },
    role:{
        type: Schema.Types.ObjectId,
        ref: "roles"
    },
    active:{
        type: Boolean,
        default: true
    },
    mfa:{
        type: Boolean,
        default: false
    },
    login:{
        type: Boolean,
        default: false
    },
    isFirstLogin:{
        type:Boolean,
        default:true
    },
    is3rdPartyMFAConfigured:{
        type:Boolean,
        default:false
    },
    organization:{
        type: Schema.Types.ObjectId,
        ref: "masterRecord"
    }
})

const userModel = model("users",userSchema)
export default userModel
