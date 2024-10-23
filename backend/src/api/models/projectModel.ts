import { Schema,model} from "mongoose";

// TODO: add project ID which will be an inc. value
const projectSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
    policies: {
        type: [Schema.Types.ObjectId],
        ref: "policies"
    },
    procedures: {
        type: [Schema.Types.ObjectId],
        ref: "procedures"
    },
    risks: {
        type: [Schema.Types.ObjectId],
        ref: "risks"
    },
    scopes: {
        type: [Schema.Types.ObjectId],
        ref: "scopes"
    },
    controls: {
        type: [Schema.Types.ObjectId],
        ref: "controls"
    },
    created_by:{
        type:Schema.Types.ObjectId,
        ref: "users",
        required:true
    },
    created_at:{
        type: Date,
        default: Date.now,
    }
})

const projectModel = model("projects",projectSchema)
export default projectModel
