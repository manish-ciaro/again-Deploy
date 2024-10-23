/**
 * isAdmin(), isSuperAdmin() are just a target specific function same things can be done through checkRolePermissions() function
 */







import userModel from "../api/models/userModel.js";
import rolesModel, { RoleInterface } from "../api/models/rolesModel.js";
import { flattenDictionary } from "./functions.js";
import { RecursivePartial } from "../@types/partial.js";
import policyModel from "../api/models/policyModel.js";
import assert from "assert";
import procedureModel from "../api/models/procedureModel.js";
import riskModel from "../api/models/riskModel.js";
import { Types } from "mongoose";
import policyVersionModel from "../api/models/policyVersionModel.js";



// const asyncSome = async (arr: any[], predicate: any) => {
//   for (let e of arr) {
//     if (await predicate(e)) return true;
//   }
//   return false;
// };

async function checkRolePermissions(userId: string, permissions: RecursivePartial<RoleInterface>[]): Promise<boolean> {
  try {
    var user = await userModel.findById(userId)
  
    assert(user)
    assert(user.active)
    assert(user.role)
   

    const role = await rolesModel.findById(user.role.toString());

    assert(role)

    return permissions.some(permission => {
      var tmp = flattenDictionary(permission)
     
      return Object.keys(tmp).every(key => role.get(key) === tmp[key])
    })
  } catch (e) {
    return false
  }
};


async function isAdmin(userId: string) {
  try {
    var user = await userModel.findById(userId)
    assert(user)
    assert(user.role)

    const role = await rolesModel.findById(user.role);
    assert(role)

    return role.admin || role.superAdmin
  } catch (e) {
    return false
  }
}

async function isSuperAdmin(userId: string) {
  try {
    var user = await userModel.findById(userId)
    assert(user)
    assert(user.role)


    const role = await rolesModel.findById(user.role);
    assert(role)

    return role.superAdmin
  } catch (e) {
    return false
  }

}

async function isUserDisabled(userId: string) {
  return (await userModel.findById(userId))?.active
}



async function isPolicyAssignee(policyId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true

    const result = await policyModel.exists({
      _id: policyId,
      $or: [
        { 'assignees.author': userId },
        { 'assignees.reviewer': userId },
        { 'assignees.approver': userId }
      ]
    });
    // console.log({result,userId,policyId})
    return !!result;
  } catch (error) {
    return false;
  }
}

async function isPolicyReviewer(policyId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true

    const result = await policyModel.exists({
      _id: policyId,
      'assignees.reviewer': userId
    });
    return !!result;
  } catch (error) {
    return false;
  }
}
async function isPolicyApprover(policyId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true
    var result;
    if (global.masterData.workflow.tier3Enabled) {
      result = await policyModel.exists({
        _id: policyId,
        'assignees.approver': userId,
      });

    } else {
      result = await policyModel.exists({
        _id: policyId,
        'assignees.reviewer': userId
      });

    }
    return !!result;
  } catch (error) {
    return false;
  }
}

async function isPolicyVersionAssignee(versionId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true

    const result = await policyVersionModel.exists({
      _id: versionId,
      $or: [
        { 'assignees.author': userId },
        { 'assignees.reviewer': userId },
        { 'assignees.approver': userId }
      ]
    });
    return !!result;
  } catch (error) {
    return false;
  }
}

async function isPolicyVersionReviewer(policyId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true

    const result = await policyVersionModel.exists({
      _id: policyId,
      'assignees.reviewer': userId
    });
    return !!result;
  } catch (error) {
    return false;
  }
}
async function isPolicyVersionApprover(policyId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true
    var result;
    if (global.masterData.workflow.tier3Enabled) {
      result = await policyVersionModel.exists({
        _id: policyId,
        'assignees.approver': userId,
      });

    } else {
      result = await policyModel.exists({
        _id: policyId,
        'assignees.reviewer': userId
      });

    }
    return !!result;
  } catch (error) {
    return false;
  }
}



async function isRiskAssignee(riskId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true

    const result = await riskModel.exists({
      _id: riskId,
      $or: [
        { 'assignees.author': userId },
        { 'assignees.reviewer': userId },
        { 'assignees.approver': userId }
      ]
    });
    return !!result;
  } catch (error) {
    return false;
  }
}

async function isRiskReviewer(riskId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true

    const result = await riskModel.exists({
      _id: riskId,
      'assignees.reviewer': userId
    });
    return !!result;
  } catch (error) {
    return false;
  }
}
async function isRiskApprover(riskId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true
    var result;
    if (global.masterData.workflow.tier3Enabled) {
      result = await riskModel.exists({
        _id: riskId,
        'assignees.approver': userId,
      });
    } else {
      result = await riskModel.exists({
        _id: riskId,
        'assignees.reviewer': userId
      });
    }
    return !!result;
  } catch (error) {
    return false;
  }
}


async function isProcedureAssignee(procedureId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true

    const result = await procedureModel.exists({
      _id: procedureId,
      $or: [
        { 'assignees.author': userId },
        { 'assignees.reviewer': userId },
        { 'assignees.approver': userId }
      ]
    });
    return !!result;
  } catch (error) {
    return false;
  }
}

async function isProcedureReviewer(procedureId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true

    const result = await procedureModel.exists({
      _id: procedureId,
      'assignees.reviewer': userId
    });
    return !!result;
  } catch (error) {
    return false;
  }
}
async function isProcedureApprover(procedureId: string|Types.ObjectId, userId: string) {
  try {
    var active = await isUserDisabled(userId)
    assert(active)

    var admin = await isAdmin(userId)
    if (admin) return true
    var result;
    if (global.masterData.workflow.tier3Enabled) {
      result = await procedureModel.exists({
        _id: procedureId,
        'assignees.approver': userId,
      });
    } else {
      result = await procedureModel.exists({
        _id: procedureId,
        'assignees.reviewer': userId
      });
    }
    return !!result;
  } catch (error) {
    return false;
  }
}


export {
  checkRolePermissions,
  isPolicyReviewer,
  isPolicyApprover,
  isPolicyAssignee,
  isPolicyVersionAssignee,
  isPolicyVersionReviewer,
  isPolicyVersionApprover,
  isProcedureReviewer,
  isProcedureApprover,
  isProcedureAssignee,
  isRiskReviewer,
  isRiskApprover,
  isRiskAssignee,
  isSuperAdmin,
  isAdmin
}
