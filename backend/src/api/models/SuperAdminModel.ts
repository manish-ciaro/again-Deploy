import { Schema,model} from "mongoose";

const userSchema = new Schema({
    image: {
        type: Schema.Types.ObjectId,
        ref: "files"
    },
    username: {
        type: String,
        unique: true,
        required: true,
    },
    email:{
        type:String,
        required:true,
    },
    firstname: {
        type: String,
        default: null,
    },
    lastname: {
        type: String,
        default: null,
    },
    hashedPassword: {
        type: String,
        default: null
    },
    prevPassword: {
        type: [String]
    },
    jobTitle: {
        type: String
    },
    phone: {
        type: String,
        maxLength: 12,
        minLength: 10
    },
    mobilePhone: {
        type: String,
        maxLength: 12,
        minLength: 10
    },
    country: {
        type: String
    },
    locale: {
        type: String
    },
    lastLogin: {
        type: Date
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: "roles"
    },
    active: {
        type: Boolean,
        default: true
    },
    login: {
        type: Boolean,
        default: false
    },
    isFirstLogin: {
        type: Boolean, 
        default: true
    },
    organization:{
        type: Schema.Types.ObjectId,
        ref: "masterRecord"
    }
} ,{ collection: 'users' })

const superAdminModel = model("superadmins",userSchema)
export default superAdminModel
