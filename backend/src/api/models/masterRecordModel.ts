import { Schema, model } from "mongoose";

type reviewFrequencyType = 'Monthly' | 'Quarterly' | 'Biannually' | 'Annually'

export interface masterRecordInterfaceForRisk extends Object {
    title: string,
    text: string
}

export interface masterRecordInterface extends Object {
    logoUri: string,
    apiKey : string,
    exportTemplatesId: string,
    OrgDetails: {
        name: string,
        date: {
            startYear: number,
            format: string
        },
        IFL: string
    },
    licenseDetail: {
        licenseNumber: { 
            type: string, 
            required: true, 
            unique: true 
        },
        purchaseDate: { 
            type: string, 
            required: true 
        },
        expiryDate: { 
            type: string, 
            required: true 
        },
        frameworksSubscribed: [{
            name: { 
                type: String, 
                required: true 
            },
            subscribedOn: { 
                type: String, 
                required: true 
            },
            expiryOn: { 
                type: String, 
                required: true 
            }
        }],
        totalFrameworks: { 
            type: Number, 
            default: 0 
        }
    },
    authSetup: {
        sso: {
            enabled: boolean,
            samlFile: string
        },
        normalLogin: {
            enabled: boolean,
            mfa: {
                enabled: boolean,
                email: boolean,
                _3dParty: boolean
            },
            complexity: {
                passwordMinLength: number,
                passwordMaxLength: number,
                includeUppercase: boolean,
                includeLowercase: boolean,
                includeNumber: boolean,
                includeSpecialCharacter: boolean
            }
        }
    },
    workflow: {
        tier3Enabled: boolean
    },
    risk: {
        formula: string,
        desc: {
            likelihood: masterRecordInterfaceForRisk[],
            impact: masterRecordInterfaceForRisk[],
            risk: masterRecordInterfaceForRisk[]
        }
    },
    log: {
        retentionPeriod: number,
        category: {
            saAdminAct:boolean,
            userAuth:boolean,
            polProcDoc:boolean,
            govMonitor :boolean,
            riskReg :boolean, 
            privImpAssmt:boolean,
            tpRiskAssmt:boolean,

            policy: boolean,
            policyVersion: boolean,
            procedure: boolean,
            control: boolean,
            user: boolean,
            tags: boolean,
            risk: boolean
        }
    },
    export: {
        header: {
            orgName: boolean,
            docName: boolean,
            pageNum: boolean,
            AuthName: boolean,
            CurVersion: boolean,
            IFL: boolean
        },
        footer: {
            orgName: boolean,
            docName: boolean,
            pageNum: boolean,
            AuthName: boolean,
            CurVersion: boolean,
            IFL: boolean
        }
    },
    reviewFrequency: reviewFrequencyType,
    isOnboardingDone:boolean
}

const masterRecordSchemaForRisk = new Schema<masterRecordInterfaceForRisk>({
    title: { type: String },
    text: { type: String }
})

const masterRecordSchema = new Schema<masterRecordInterface>({
    logoUri:{type:String},
    exportTemplatesId: { type: String},
    apiKey: { type: String },
    OrgDetails: {
        name: { type: String },
        date: {
            startYear: { type: String},
            format: { type: String}
        },
        IFL: { type: String }
    },
    licenseDetail: {
        licenseNumber: { 
            type: String,  
            unique: true 
        },
        purchaseDate: { 
            type: String,
        },
        expiryDate: { 
            type: String, 
        },
        frameworksSubscribed: [{
            name: { 
                type: String, 
            },
            subscribedOn: { 
                type: String, 
            },
            expiryOn: { 
                type: String, 
            }
        }],
        totalFrameworks: { 
            type: Number, 
            default: 0 
        }
    },
    authSetup: {
        sso: {
            enabled: { type: Boolean},
            samlFile: { type: String}
        },
        normalLogin: {
            enabled: { type: Boolean},
            mfa: {
                enabled: { type: Boolean},
                email: { type: Boolean},
                _3dParty: { type: Boolean}
            },
            complexity: {
                passwordMinLength: { type: Number},
                passwordMaxLength: { type: Number },
                includeUppercase: { type: Boolean },
                includeLowercase: { type: Boolean },
                includeNumber: { type: Boolean},
                includeSpecialCharacter: { type: Boolean}
            }
        }
    },
    workflow: {
        tier3Enabled: { type: Boolean }
    },
    log: {
        retentionPeriod: { type: Number, default: 365 },
        category: {
            saAdminAct: { type: Boolean },
            userAuth: { type: Boolean },
            polProcDoc: { type: Boolean },
            govMonitor: { type: Boolean },
            riskReg : { type: Boolean},
            privImpAssmt: { type: Boolean},
            tpRiskAssmt: { type: Boolean}
        }
    },
    export: {
        header: {
            orgName: { type: Boolean},
            docName: { type: Boolean},
            pageNum: { type: Boolean },
            AuthName: { type: Boolean, default: false },
            CurVersion: { type: Boolean, default: false },
            IFL: { type: Boolean, default: false }
        },
        footer: {
            orgName: { type: Boolean, default: true },
            docName: { type: Boolean, default: true },
            pageNum: { type: Boolean, default: false },
            AuthName: { type: Boolean, default: false },
            CurVersion: { type: Boolean, default: false },
            IFL: { type: Boolean, default: false }
        }
    },
    reviewFrequency: {
        type: String,
        enum:  ["Monthly","Quarterly","Biannually","Annually"] as reviewFrequencyType[]
    },
    isOnboardingDone:{ type: Boolean,default:false},
})

const masterRecordModel = model<masterRecordInterface>("neworganization", masterRecordSchema);
export default masterRecordModel

