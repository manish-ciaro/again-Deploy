import { Schema,model} from "mongoose";

const optSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    token:{
        type: String
    },
    tries:{
        type: Number,
        default: 0
    }
})

const optModel = model("opt",optSchema)
export default optModel
