import { Schema,model} from "mongoose";


const scopesSchema = new Schema({
    name:{
        type:String,
        unique: true,
        required: true 
    },
    description:{
        type:String,
    },
    projects:{
        type:[Schema.Types.ObjectId],
        ref: "projects"
    }
})

const scopesModel = model("scopes",scopesSchema)
export default scopesModel


