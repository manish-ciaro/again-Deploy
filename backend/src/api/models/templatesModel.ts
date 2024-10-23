import { Schema,model} from "mongoose";


const templatesSchema = new Schema({
    standard:{
        type:String
    },
    content:{
        type:String
    }
})

const templatesModel = model("templates",templatesSchema)
export default templatesModel


