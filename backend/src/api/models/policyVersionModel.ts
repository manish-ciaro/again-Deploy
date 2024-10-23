import { Schema,model} from "mongoose";
import { policyStatusEnum } from "./policyModel.js";

const policyVersionSchema = new Schema({
    ID:{
        type: String,
    },
    description: {
        type: String,
        required: true,
    },
    policy: {
        type: Schema.Types.ObjectId,
        ref: "policies",
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: Object.values(policyStatusEnum),
        default: "draft"
    },
    comments: {
        type: [Schema.Types.ObjectId],
        ref: "comments"
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
    onWatch: {
        type: Boolean,
        default: false
    }
})

const policyVersionModel = model("policyVerison",policyVersionSchema)
export default policyVersionModel
