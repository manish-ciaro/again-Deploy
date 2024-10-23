import { Schema,model} from "mongoose";


const guildelineSchema = new Schema({
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

const guildelineModel = model("guildelines",guildelineSchema)
export default guildelineModel
