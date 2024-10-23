import { Schema, model, Document } from "mongoose";


interface allBasicRoleCategory {
    fullAccess: boolean
    view: boolean
    edit: boolean
}

interface basicRoleCategory {
    fullAccess: boolean
    view: boolean
}


export interface RoleInterface extends Object {
    name: string;
    userControl: basicRoleCategory
    onboarding: basicRoleCategory;
    control: basicRoleCategory;

    policy: allBasicRoleCategory;
    procedure: allBasicRoleCategory;
    risk: allBasicRoleCategory;
    TPRA: allBasicRoleCategory;
    training: allBasicRoleCategory
    evidences: allBasicRoleCategory
    audit: allBasicRoleCategory

    superAdmin: boolean
    admin: boolean
}



const editCategoryJSON = {
    edit: {
        type: Boolean,
        default: false
    }
}

const basicRoleCategoryJSON = {
    fullAccess:{
        type: Boolean,
        default: false
    },
    view: {
        type: Boolean,
        default: false
    }
}

const rolesSchema = new Schema<RoleInterface>({
    name: {
        type: String,
        unique: true,
        required: true,
    },
    userControl: basicRoleCategoryJSON,
    onboarding: basicRoleCategoryJSON,
    control: basicRoleCategoryJSON,

    policy: {...editCategoryJSON,...basicRoleCategoryJSON},
    procedure: {...editCategoryJSON,...basicRoleCategoryJSON},
    risk: {...editCategoryJSON,...basicRoleCategoryJSON},
    training: {...editCategoryJSON,...basicRoleCategoryJSON},
    TPRA: {...editCategoryJSON,...basicRoleCategoryJSON},
    evidences: {...editCategoryJSON,...basicRoleCategoryJSON},
    audit: {...editCategoryJSON,...basicRoleCategoryJSON},

    superAdmin: {
        type: Boolean,
        default: false
    },
    admin: {
        type: Boolean,
        default: false
    }
})

rolesSchema.methods.isAdmin = function () {
    
}






const rolesModel = model<RoleInterface>("roles", rolesSchema)
export default rolesModel

