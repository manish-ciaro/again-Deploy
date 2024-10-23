import { Schema, model } from "mongoose";


const controlGroupsSchema = new Schema({
    name: {
        type: String,
    },
    controls: {
        type: [Schema.Types.ObjectId],
        ref: "controls"
    },
    custom: {
        type: Boolean,
    },
})

const controlGroupsModel = model("controlGroups", controlGroupsSchema)
export default controlGroupsModel
