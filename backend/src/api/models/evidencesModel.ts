import { Schema,Types,model} from "mongoose";


export const frequencies = {
    "One Time": -1,
    "Daily": 1,
    "Weekly": 7,
    "Fortnightly": 14,
    "Monthly": 30,
    "Quarterly": 90,
    "Biannually": 180,
    "Annually": 365,
    "Biennial": 730
};


export interface IEvidence {
    name: string;
    url: string[];
    createdAt: number;
    updatedAt: number;
    updatedBy: string;
    frequency: keyof typeof frequencies;
    assignee: string[];
    custom: boolean;
    files: string[];
    controls: string[];
    risks: string[];
  }


const evidencesSchema = new Schema({
    name:{
        type:String,
        unique:true,
        required: true
    },
    url:{
        type:[String],
        default:[]
    },
    createdAt:{
        type:Number,
        default: Date.now
    },
    updatedAt:{
        type:Number,
        default: Date.now
    },
    updatedBy:{
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    frequency:{
        type:String,
        enum: Object.keys(frequencies),
        required:true
    },
    assignee:{
        type: [Schema.Types.ObjectId],
        ref: "users",
        required:true,

    },
    custom:{
        type:Boolean,
        default: true
    },
    files:{
        type: [Schema.Types.ObjectId],
        ref: "files"
    },
    controls:{
        type: [Schema.Types.ObjectId],
        ref: "controls"
    },
    risks:{
        type: [Schema.Types.ObjectId],
        ref: "risks"
    },
})

const evidencesModel = model("evidences",evidencesSchema)
export default evidencesModel
