import { Schema, model } from "mongoose";

export var policyStatusEnum = {
    draft: "draft",
    drafted: "drafted",
    reviewed: "reviewed",
    approved: "approved",
    rejected: "rejected",
    deleted: "deleted",
    inactive: "inactive"
}

const policySchema = new Schema({
    title: {
        type: String,
        unique: true,
        required: true,
    },
    ID: {
        type: String,
        unique: true,
    },
    count:{
        type: Number,
        default: 0,
    },
    versions: {
        draft:{
            type: [Schema.Types.ObjectId],
            ref: "policyVerison"
        },
        active:{
            type: [Schema.Types.ObjectId],
            ref: "policyVerison"
        }
    },
    reminder: {
        type: Date,
    },
    created_at:{
        type: Number,
        default: Date.now()
    },
    status: {
        type: String,
        enum: Object.values(policyStatusEnum),
        default: "draft"
    },
    tags: {
        type: [Schema.Types.ObjectId],
        ref: "tags",
    },
    processDocs: {
        type: [Schema.Types.ObjectId],
        ref: "processDocs",
    },
    evidence:{
        risks: {
            type: [Schema.Types.ObjectId],
            ref: "risks", 
        },
        attchements: {
            type: [Schema.Types.ObjectId],
            ref: "files", 
        },
    },
    controls: {
        type: [Schema.Types.ObjectId],
        ref: "controls", 
    },
    projects: {
        type: [Schema.Types.ObjectId],
        ref: "projects", 
    },
    logs: {
        type: [Schema.Types.ObjectId],
        ref: "logs"
    },
    assignees: {
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
    active:{
        type: Boolean
    },
    custom: {
        type: Boolean
    }
});


const policyModel = model("policies", policySchema)
export default policyModel
