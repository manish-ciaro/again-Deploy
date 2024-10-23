import { Schema,model} from "mongoose";

const mfaSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    secret:{
        type: String
    },
    // tries:{
    //     type: Number,
    //     default: 0
    // }
})

const mfaModel = model("mfa",mfaSchema)
export default mfaModel
