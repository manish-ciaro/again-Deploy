import { AssertionError } from "assert";
import myResponse from "../@types/response.js";
import policyModel from "../api/models/policyModel.js";
import procedureModel from "../api/models/procedureModel.js";
import riskModel from "../api/models/riskModel.js";
import controlsModel from "../api/models/controlsModel.js";
import { checkRolePermissions } from "./roles.js";
import { assert } from "console";
import projectModel from "../api/models/projectModel.js";




// POLICIES
async function unMapOnePolicyToManyProcedures(policyId:string,procedures:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // auth
        // var auth = await checkRolePermissions(uId,[
        //     {
        //         policy:{edit:true},
        //         procedure:{edit: true}
        //     }
        // ])
        // assert(auth,"Auth Failed")

        session.startTransaction()
        await policyModel.updateOne(
            {_id: policyId},
            {
                $pull:{
                    procedure: {
                        $in: procedures
                    }
                }
            },
            {session}
        )
        
        await procedureModel.updateMany(
            {_id: procedures},
            {
                $pull:{
                    policies: policyId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}


async function unMapOnePolicyToManyControls(policyId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // auth
        // var auth = await checkRolePermissions(uId,[
        //     {
        //         policy:{edit:true},
        //         control:{fullAccess: true}
        //     }
        // ])
        // assert(auth,"Auth Failed")

        session.startTransaction()
        await policyModel.updateOne(
            {_id: policyId},
            {
                $pull:{
                    controls: {
                        $in: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $pull:{
                    policies: policyId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}


async function unMapOnePolicyToManyProject(policyId:string,projects:string,uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await policyModel.updateOne(
            {_id: policyId},
            {
                $pull:{
                    projects: {
                        $in: projects
                    }
                }
            },
            {session}
        )
        
        await projectModel.updateOne(
            {_id: projects},
            {
                $pull:{
                    policies: policyId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}



// PROCEDURES
async function unMapOneProcedureToManyPolicies(procedureId:string,policies:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // auth
        // var auth = await checkRolePermissions(uId,[
        //     {
        //         procedure:{edit: true},
        //         policy:{edit:true}
        //     }
        // ])
        // assert(auth,"Auth Failed")

        session.startTransaction()
        await procedureModel.updateOne(
            {_id: procedureId},
            {
                $pull:{
                    policies: {
                        $in: policies
                    }
                }
            },
            {session}
        )
        
        await policyModel.updateMany(
            {_id: policies},
            {
                $pull:{
                    procedure: procedureId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}

async function unMapOneProcedureToManyControls(procedureId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // auth
        // var auth = await checkRolePermissions(uId,[
        //     {
        //         procedure:{edit: true},
        //         control:{fullAccess:true}
        //     }
        // ])
        // assert(auth,"Auth Failed")

        session.startTransaction()
        await procedureModel.updateOne(
            {_id: procedureId},
            {
                $pull:{
                    controls: {
                        $in: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $pull:{
                    procedure: procedureId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}

async function unMapOneProcedureToManyProject(procedureId:string,projects:string,uId: string):Promise<myResponse> {
    var session = await procedureModel.startSession();
    try {
        // assert
        session.startTransaction()
        await procedureModel.updateOne(
            {_id: procedureId},
            {
                $pull:{
                    projects: {
                        $in: projects
                    }
                }
            },
            {session}
        )
        
        await projectModel.updateOne(
            {_id: projects},
            {
                $pull:{
                    procedures: procedureId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}


// RISKS

async function unMapOneRiskToManyControls(riskId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await riskModel.updateOne(
            {_id: riskId},
            {
                $pull:{
                    controls: {
                        $in: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $pull:{
                    risks: riskId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}

async function unMapOneRiskToManyProject(riskId:string,projects:string,uId: string):Promise<myResponse> {
    var session = await riskModel.startSession();
    try {
        // assert
        session.startTransaction()
        await riskModel.updateOne(
            {_id: riskId},
            {
                $pull:{
                    projects: {
                        $in: projects
                    }
                }
            },
            {session}
        )
        
        await projectModel.updateOne(
            {_id: projects},
            {
                $pull:{
                    risks: riskId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}



// CONTROLS
async function unMapOneControlToManyPolicies(controlId:string,policies:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await controlsModel.updateOne(
            {_id: controlId},
            {
                $pull:{
                    policies: {
                        $in: policies
                    }
                }
            },
            {session}
        )
        
        await policyModel.updateMany(
            {_id: policies},
            {
                $pull:{
                    controls: controlId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}
async function unMapOneControlToManyProcedures(controlId:string,procedures:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await controlsModel.updateOne(
            {_id: controlId},
            {
                $pull:{
                    procedures: {
                        $in: procedures
                    }
                }
            },
            {session}
        )
        
        await procedureModel.updateMany(
            {_id: procedures},
            {
                $pull:{
                    controls: controlId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}
async function unMapOneControlToManyRisks(controlId:string,risks:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await controlsModel.updateOne(
            {_id: controlId},
            {
                $pull:{
                    risks: {
                        $in: risks
                    }
                }
            },
            {session}
        )
        
        await riskModel.updateMany(
            {_id: risks},
            {
                $pull:{
                    controls: controlId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}
async function unMapOneControlToManyProject(controlId:string,projects:string,uId: string):Promise<myResponse> {
    var session = await controlsModel.startSession();
    try {
        // assert
        session.startTransaction()
        await controlsModel.updateOne(
            {_id: controlId},
            {
                $pull:{
                    projects: {
                        $in: projects
                    }
                }
            },
            {session}
        )
        
        await projectModel.updateOne(
            {_id: projects},
            {
                $set:{
                    controls: controlId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}

// PROJECT
async function unMapOneProjectToManyPolicies(projectId:string,policies:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await projectModel.updateOne(
            {_id: projectId},
            {
                $pull:{
                    policies: {
                        $in: policies
                    }
                }
            },
            {session}
        )
        
        await policyModel.updateMany(
            {_id: policies},
            {
                $pull:{
                    project: projectId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}
async function unMapOneProjectToManyProcedures(projectId:string,procedures:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await projectModel.updateOne(
            {_id: projectId},
            {
                $pull:{
                    procedures: {
                        $in: procedures
                    }
                }
            },
            {session}
        )
        
        await procedureModel.updateMany(
            {_id: procedures},
            {
                $pull:{
                    project: projectId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}
async function unMapOneProjectToManyRisks(projectId:string,risks:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await projectModel.updateOne(
            {_id: projectId},
            {
                $pull:{
                    risks: {
                        $in: risks
                    }
                }
            },
            {session}
        )
        
        await riskModel.updateMany(
            {_id: risks},
            {
                $pull:{
                    project: projectId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}
async function unMapOneProjectToManyControls(projectId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await projectModel.updateOne(
            {_id: projectId},
            {
                $pull:{
                    controls: {
                        $in: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $pull:{
                    project: projectId
                }
            }
        )

        await session.commitTransaction()
        await session.endSession()
        
        return {
            status: true,
            msg: "Success"
        }
    } catch (error) {
        console.log(error)
        if(session.inTransaction()) await session.abortTransaction()
        if(!session.hasEnded) await session.endSession()

        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        return{
            status: false,
            msg: "Error"
        }

    }
}



export {
    unMapOnePolicyToManyControls,
    unMapOnePolicyToManyProcedures,
    unMapOnePolicyToManyProject,

    unMapOneProcedureToManyControls,
    unMapOneProcedureToManyPolicies,
    unMapOneProcedureToManyProject,

    unMapOneRiskToManyControls,
    unMapOneRiskToManyProject,

    unMapOneControlToManyRisks,
    unMapOneControlToManyProcedures,
    unMapOneControlToManyPolicies,
    unMapOneControlToManyProject,

    unMapOneProjectToManyPolicies,
    unMapOneProjectToManyProcedures,
    unMapOneProjectToManyRisks,
    unMapOneProjectToManyControls

}
