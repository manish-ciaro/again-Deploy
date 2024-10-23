import { Schema,model} from "mongoose";

export var procedureStatusEnum = {
    draft: "draft",
    drafted: "drafted",
    reviewed: "reviewed",
    approved: "approved",
    rejected: "rejected",
    deleted: "deleted"
}

const procedureSchema = new Schema({
    title: {
        type:String,
        unique: true,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    created_by:{
        type:Schema.Types.ObjectId,
        ref: "users",
        required:true,
    },
    created_at:{
        type: Date,
        default: Date.now,
    },
    updated_by:{
        type:Schema.Types.ObjectId,
        ref: "users",
        required:true,
    },
    updated_at:{
        type:Date,
        default: Date.now,
    },
    status:{
        type:String,
        enum: Object.values(procedureStatusEnum),
        default: "draft"
    },
    assignees:{
        author: {
            type: [Schema.Types.ObjectId],
            ref: "users",
        },
        reviewer: {
            type: [Schema.Types.ObjectId],
            ref: "users"
        },
        approver: {
            type: [Schema.Types.ObjectId],
            ref: "users"
        },
    },
    versions:{
        type: [Schema.Types.ObjectId],
        ref: "versions" 
    },
    reminder:{
        type: Date,
    },
    tags:{
        type:[Schema.Types.ObjectId],
        ref: "tags",
    },
    policies:{
        type:[Schema.Types.ObjectId],
        ref: "policies",
    },
    controls:{
        type:[Schema.Types.ObjectId],
        ref: "controls",
    },
    projects:{
        type:[Schema.Types.ObjectId],
        ref: "projects",
    },
    comments:{
        type:[Schema.Types.ObjectId],
        ref: "comments" 
    },  
    logs:{
        type:[Schema.Types.ObjectId],
        ref: "logs" 
    },
    beingModified:{
        type:Boolean,
        default:false
    },
})

const procedureModel = model("procedures",procedureSchema)
export default procedureModel
