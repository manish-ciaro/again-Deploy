import { Schema,model} from "mongoose";


const processDocSchema = new Schema({
    procedures:{
        type:[Schema.Types.ObjectId],
        ref: "procedures",
    },
    methodology:{
        type:[Schema.Types.ObjectId],
        ref: "methodology",
    },
    guidlines:{
        type:[Schema.Types.ObjectId],
        ref: "guidlines",
    },
    others:{
        type:[Schema.Types.ObjectId],
        ref: "others",
    }
})

const processDocModel = model("processDocs",processDocSchema)
export default processDocModel
