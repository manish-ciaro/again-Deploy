import { Schema, model } from "mongoose";


const controlsSchema = new Schema({
    nameId:{
        type:String
    },
    group:{
        type: Schema.Types.ObjectId,
        ref: "controlGroups"
    },
    name: {
        type: String,
    },
    content: {
        type: String,
    },
    policies: {
        type: [Schema.Types.ObjectId],
        ref: "policies"
    },
    projects: {
        type: [Schema.Types.ObjectId],
        ref: "projects"
    },
    risks: {
        type: [Schema.Types.ObjectId],
        ref: "risks"
    },
    tags: {
        type: [Schema.Types.ObjectId],
        ref: "tags"
    },
    processDocs: {
        type: [Schema.Types.ObjectId],
        ref: "processDocs"
    },
    evidences: {
        type: [Schema.Types.ObjectId],
        ref: "evidences"
    },
    custom: {
        type: Boolean
    }
})

const controlsModel = model("controls", controlsSchema)
export default controlsModel
