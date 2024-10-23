import { Schema, model } from "mongoose";

const riskFormulaSchema = new Schema({
    formula: {
        type: String
    },
    description: {
        type: String
    }
})

const riskFormulaModel = model("riskFormula", riskFormulaSchema)
export default riskFormulaModel