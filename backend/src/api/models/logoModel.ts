import { Schema,model} from "mongoose";

const logoSchema = new Schema({
    name: String,
    data:{
        type:Buffer
    },
    mime:{
        type:String
    },
    private:{
        type: Boolean,
        default: true
    }
})

const logoModel = model("orglogo",logoSchema)
export default logoModel