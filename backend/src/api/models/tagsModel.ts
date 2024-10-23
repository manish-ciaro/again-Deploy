import { Schema,model} from "mongoose";


const tagsSchema = new Schema({
    name:{
        type:String,
        unique: true,
        required: true 
    },
    policies:{
        type:[Schema.Types.ObjectId],
        ref: "policies"
    },
    procedures:{
        type:[Schema.Types.ObjectId],
        ref: "procedure"
    },
    risks:{
        type:[Schema.Types.ObjectId],
        ref: "risks"
    },
    controls:{
        type:[Schema.Types.ObjectId],
        ref: "controls"
    },

})

const tagsModel = model("tags",tagsSchema)
export default tagsModel


