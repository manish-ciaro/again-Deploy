import { Schema,model } from "mongoose";

const exportTemplatesSchema = new Schema({
    name:{
        type:String
    },
    header:{
        type:String
    },
    body:{
        type:String
    },
    footer:{
        type:String
    },
    
})

const exportTemplatesModel = model("exportTemplates",exportTemplatesSchema)
export default exportTemplatesModel