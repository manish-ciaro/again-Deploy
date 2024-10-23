import { Schema,model} from "mongoose";


const commentsSchema = new Schema({
    content:{
        type:String,
        required:true,
    },
    images:{
        type:[Schema.Types.ObjectId],
        ref:"images"
    },
    created_by:{
        type:Schema.Types.ObjectId,
        ref: "users",
        required:true
    },
    created_at:{
        type: Date,
        default: Date.now,
    }
})

const commentsModel = model("comments",commentsSchema)
export default commentsModel
