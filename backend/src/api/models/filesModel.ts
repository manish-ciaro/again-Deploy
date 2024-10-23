import { Schema,model} from "mongoose";

const filesSchema = new Schema({
    name: String,
    data:{
        type:Buffer
    },
    mime:{
        type:String
    },
    private:{
        type: Boolean,
        default: false
    }
})

const filesModel = model("files",filesSchema)
export default filesModel