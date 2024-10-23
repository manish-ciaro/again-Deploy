import { Schema,model} from "mongoose";

const procedureVersionSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    title: {
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    created_by:{
        type:Schema.Types.ObjectId,
        ref: "users",
        required:true,
    },
    created_at:{
        type: Date,
        default: Date.now,
    },
    reminder:{
        type:Date,
        required:true,
    },
    tags:{
        type:[String],
    },
    policies:{
        type:[Schema.Types.ObjectId],
        ref: "procedures", 
    }
})

const procedureVersionModel = model("procedureVerison",procedureVersionSchema)
export default procedureVersionModel
