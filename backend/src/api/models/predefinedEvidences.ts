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
    description:string;
    enabled:boolean;
    url: string[];
    updatedAt: Date;
    updatedBy: string;
    frequency: keyof typeof frequencies;
    assignee: string[];
    custom: boolean;
    files: string[];
    controls: string[];
    risks: string[];
  }


const predefinedEvidencesSchema = new Schema({
    name:{
        type:String,
        unique:true,
    },
    description:{
        type:String,
    },
    enabled:{
        type:Boolean,
        default: false
    },
    url:{
        type:[String],
        default:[]
    },
    updatedAt:{
        type:Date,
        default: Date.now
    },
    updatedBy:{
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    frequency:{
        type:String,
        enum: Object.keys(frequencies)
    },
    assignee:{
        type: [Schema.Types.ObjectId],
        ref: "users",
    },
    custom:{
        type:Boolean,
        default: false
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

const predefinedEvidencesModel = model("predefinedEvidences",predefinedEvidencesSchema)
export default predefinedEvidencesModel
