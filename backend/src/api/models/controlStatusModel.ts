import { Schema, model } from "mongoose";

export const scopes = {
    "In Scope":'In Scope',
     "Not in Scope":'Not In Scope'
};

export interface IControlStatus {
    controlId:string;
    scope:string;
    justification:string;
    projects:string[];
    policy:string[];
    risks:string[];
    evidence:string[];
    updatedAt:Date;
    updatedBy:string;
}

const controlStatusSchema = new Schema({
    controlId: {
        type: Schema.Types.ObjectId,
        ref: 'controls',  
    },
    scope: {
        type:String,
        enum:Object.keys(scopes),
    },
     justification: {
        type: String,
    },
    projects:{
         type: [Schema.Types.ObjectId],
            ref: 'projects' 
    },
    // scopeName:{
    //     type:[String],
    //     default:null
    // },
    policy:{
        type: [Schema.Types.ObjectId],
           ref: 'Policy' 
   },
    risks:{
        type: [Schema.Types.ObjectId],
           ref: 'risks' 
   },
    evidence:{
        type: [Schema.Types.ObjectId],
           ref: 'evidences' 
   },
     updatedAt:{
     type:Date,
     default: Date.now
    },
     updatedBy:{
    type: Schema.Types.ObjectId,
    ref: "users"
   },
    
})

const controlStatusModel = model("controlStatus", controlStatusSchema)
export default controlStatusModel