import { Schema,model} from "mongoose";

const counterSchema = new Schema({
    name:{
        type: String
    },
    seq:{
        type:Number,
        default: 0
    }
})

const counterModel = model("counter",counterSchema)

export async function getAndSetPolicyCounter(){
    return (await counterModel.findOneAndUpdate(
        {name:"policies"},
        {
            $inc:{
                seq: 1
            }
        },
        {upsert:true,returnOriginal: false}
    )).seq
}

export async function getAndSetControlCounter(){
    return (await counterModel.findOneAndUpdate(
        {name:"controls"},
        {
            $inc:{
                seq: 1
            }
        },
        {upsert:true,returnOriginal: false}
    )).seq
}


export default counterModel


