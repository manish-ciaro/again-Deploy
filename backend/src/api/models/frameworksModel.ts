import { Schema, model } from "mongoose";


const complianceSchema = new Schema({
    frameworkname: {
        type: String,
    },
    description:{
        type:String,
    },
    controls:[
        { type: Schema.Types.ObjectId,
            ref: 'controls' }
    ],
})

const complianceModel = model("compliance", complianceSchema)
export default complianceModel