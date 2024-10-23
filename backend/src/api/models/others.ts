import { Schema,model} from "mongoose";


const othersSchema = new Schema({
    title:{
        type:String,
    },
    createdAt:{
        type: Number,
        default: Date.now
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref:"users"
    },
    description:{
        type:String,
    },
    files:{
        type: [Schema.Types.ObjectId],
        ref:"files"
    },
})

const othersModel = model("others",othersSchema)
export default othersModel
