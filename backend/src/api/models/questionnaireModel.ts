import { Schema, model } from "mongoose";


const questionnaireSchema = new Schema({
    content: {
        type: String,
        required: true,

    },
    type: {
        type: String,
        enum: ["Boolean", "String"],
    }
})

const questionnaireModel = model("questionnaire", questionnaireSchema)
export default questionnaireModel
