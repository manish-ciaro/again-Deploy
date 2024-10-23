import { Schema,model} from "mongoose";


const policyDraftsSchema = new Schema({
    content:{
        type:String,
        required:true,

    },
    created_by:{
        type:Schema.Types.ObjectId,
        ref: "users",
        required:true
    },
    created_at:{
        type: Date,
        default: Date.now,
    },
    updated_by:{
        type:Schema.Types.ObjectId,
        ref: "users",
        required:true,
    },
    updated_at:{
        type:Date,
        default: Date.now,
    }
    // grammar_check:{
    //     type: []
    // },
    // spelling_check:{
    //     type:[],
    // },
    // images:{
    //     type:Schema.Types.ObjectId,
    //     ref: "images"
    // }
})

const policyDraftsModel = model("policyDrafts",policyDraftsSchema)
export default policyDraftsModel
