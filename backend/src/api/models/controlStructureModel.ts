import {Schema,model} from 'mongoose'

const consStrSchema = new Schema({
    controlName:{
        type:String
    },
    description:{
        type:String
    },
    implementationGuidance:{
        type:String
    },
    evidence:{
        type: [Schema.Types.ObjectId],
        ref: "evidences"
    },
    auditTrail:{
        type:String
    }
})

// cont name  cont des con implementation guidance relevant evidence , relevant audit trail
