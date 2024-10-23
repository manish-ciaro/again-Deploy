import { AssertionError } from "assert";
import myResponse from "../@types/response.js";
import policyModel from "../api/models/policyModel.js";
import procedureModel from "../api/models/procedureModel.js";
import riskModel from "../api/models/riskModel.js";
import controlsModel from "../api/models/controlsModel.js";
import tagsModel from "../api/models/tagsModel.js";
import projectModel from "../api/models/projectModel.js";
import { assert } from "console";




// POLICIES
async function mapOnePolicyToManyProcedures(policyId:string,procedures:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await policyModel.updateOne(
            {_id: policyId},
            {
                $addToSet:{
                    procedure: {
                        $each: procedures
                    }
                }
            },
            {session}
        )
        
        await procedureModel.updateMany(
            {_id: procedures},
            {
                $addToSet:{
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


async function mapOnePolicyToManyControls(policyId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await policyModel.updateOne(
            {_id: policyId},
            {
                $addToSet:{
                    controls: {
                        $each: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $addToSet:{
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



async function mapOnePolicyToManyProject(policyId:string,projects:string,uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await policyModel.updateOne(
            {_id: policyId},
            {
                $addToSet:{
                    projects: {
                        $each: projects
                    }
                }
            },
            {session}
        )
        
        await projectModel.updateOne(
            {_id: projects},
            {
                $addToSet:{
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
async function mapOneProcedureToManyPolicies(procedureId:string,policies:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await procedureModel.updateOne(
            {_id: procedureId},
            {
                $addToSet:{
                    policies: {
                        $each: policies
                    }
                }
            },
            {session}
        )
        
        await policyModel.updateMany(
            {_id: policies},
            {
                $addToSet:{
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

async function mapOneProcedureToManyControls(procedureId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await procedureModel.updateOne(
            {_id: procedureId},
            {
                $addToSet:{
                    controls: {
                        $each: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $addToSet:{
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
async function mapOneProcedureToManyProject(procedureId:string,projects:string,uId: string):Promise<myResponse> {
    var session = await procedureModel.startSession();
    try {
        // assert
        session.startTransaction()
        await procedureModel.updateOne(
            {_id: procedureId},
            {
                $addToSet:{
                    projects: {
                        $each: projects
                    }
                }
            },
            {session}
        )
        
        await projectModel.updateOne(
            {_id: projects},
            {
                $addToSet:{
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

async function mapOneRiskToManyControls(riskId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await riskModel.updateOne(
            {_id: riskId},
            {
                $addToSet:{
                    controls: {
                        $each: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $addToSet:{
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
async function mapOneRiskToManyProject(riskId:string,projects:string,uId: string):Promise<myResponse> {
    var session = await riskModel.startSession();
    try {
        // assert
        session.startTransaction()
        await riskModel.updateOne(
            {_id: riskId},
            {
                $addToSet:{
                    projects: {
                        $each: projects
                    }
                }
            },
            {session}
        )
        
        await projectModel.updateOne(
            {_id: projects},
            {
                $addToSet:{
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
async function mapOneControlToManyPolicies(controlId:string,policies:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await controlsModel.updateOne(
            {_id: controlId},
            {
                $addToSet:{
                    policies: {
                        $each: policies
                    }
                }
            },
            {session}
        )
        
        await policyModel.updateMany(
            {_id: policies},
            {
                $addToSet:{
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
async function mapOneControlToManyProcedures(controlId:string,procedures:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await controlsModel.updateOne(
            {_id: controlId},
            {
                $addToSet:{
                    procedures: {
                        $each: procedures
                    }
                }
            },
            {session}
        )
        
        await procedureModel.updateMany(
            {_id: procedures},
            {
                $addToSet:{
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
async function mapOneControlToManyRisks(controlId:string,risks:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await controlsModel.updateOne(
            {_id: controlId},
            {
                $addToSet:{
                    risks: {
                        $each: risks
                    }
                }
            },
            {session}
        )
        
        await riskModel.updateMany(
            {_id: risks},
            {
                $addToSet:{
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
async function mapOneControlToManyProject(controlId:string,projects:string[],uId: string):Promise<myResponse> {
    var session = await controlsModel.startSession();
    try {
        // assert
        session.startTransaction()
        var control = await controlsModel.findById(controlId).select({custom:1,projects:1})
        assert(control,"Control not found")
        if(control?.custom == false){
            assert(!(control.projects.length > 1),"Only one projects can be mapped")
            assert(!(projects.length > 1),"Only one projects can be mapped")
        }

        await controlsModel.updateOne(
            {_id: controlId},
            {
                $addToSet:{
                    projects: {
                        $each: projects
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



// TAGS
async function mapOneTagToManyPolicies(tagId:string,policies:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await tagsModel.updateOne(
            {_id: tagId},
            {
                $addToSet:{
                    policies: {
                        $each: policies
                    }
                }
            },
            {session}
        )
        
        await policyModel.updateMany(
            {_id: policies},
            {
                $addToSet:{
                    tags: tagId
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
async function mapOneTagToManyProcedures(tagId:string,procedures:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await tagsModel.updateOne(
            {_id: tagId},
            {
                $addToSet:{
                    procedures: {
                        $each: procedures
                    }
                }
            },
            {session}
        )
        
        await procedureModel.updateMany(
            {_id: procedures},
            {
                $addToSet:{
                    tags: tagId
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
async function mapOneTagToManyRisks(tagId:string,risks:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await tagsModel.updateOne(
            {_id: tagId},
            {
                $addToSet:{
                    risks: {
                        $each: risks
                    }
                }
            },
            {session}
        )
        
        await riskModel.updateMany(
            {_id: risks},
            {
                $addToSet:{
                    tags: tagId
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
async function mapOneTagToManyControls(tagId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await tagsModel.updateOne(
            {_id: tagId},
            {
                $addToSet:{
                    controls: {
                        $each: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $addToSet:{
                    tags: tagId
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

// PROJECT
async function mapOneProjectToManyPolicies(projectId:string,policies:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await projectModel.updateOne(
            {_id: projectId},
            {
                $addToSet:{
                    policies: {
                        $each: policies
                    }
                }
            },
            {session}
        )
        
        await policyModel.updateMany(
            {_id: policies},
            {
                $addToSet:{
                    projects: projectId
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
async function mapOneProjectToManyProcedures(projectId:string,procedures:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await projectModel.updateOne(
            {_id: projectId},
            {
                $addToSet:{
                    procedures: {
                        $each: procedures
                    }
                }
            },
            {session}
        )
        
        await procedureModel.updateMany(
            {_id: procedures},
            {
                $addToSet:{
                    projects: projectId
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
async function mapOneProjectToManyRisks(projectId:string,risks:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await projectModel.updateOne(
            {_id: projectId},
            {
                $addToSet:{
                    risks: {
                        $each: risks
                    }
                }
            },
            {session}
        )
        
        await riskModel.updateMany(
            {_id: risks},
            {
                $addToSet:{
                    projects: projectId
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
async function mapOneProjectToManyControls(projectId:string,controls:string[],uId: string):Promise<myResponse> {
    var session = await policyModel.startSession();
    try {
        // assert
        session.startTransaction()
        await projectModel.updateOne(
            {_id: projectId},
            {
                $addToSet:{
                    controls: {
                        $each: controls
                    }
                }
            },
            {session}
        )
        
        await controlsModel.updateMany(
            {_id: controls},
            {
                $addToSet:{
                    projects: projectId
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
    mapOnePolicyToManyControls,
    mapOnePolicyToManyProcedures,
    mapOnePolicyToManyProject,

    mapOneProcedureToManyControls,
    mapOneProcedureToManyPolicies,
    mapOneProcedureToManyProject,

    mapOneRiskToManyControls,
    mapOneRiskToManyProject,

    mapOneControlToManyRisks,
    mapOneControlToManyProcedures,
    mapOneControlToManyPolicies,
    mapOneControlToManyProject,

    mapOneTagToManyPolicies,
    mapOneTagToManyProcedures,
    mapOneTagToManyRisks,
    mapOneTagToManyControls,

    mapOneProjectToManyPolicies,
    mapOneProjectToManyProcedures,
    mapOneProjectToManyRisks,
    mapOneProjectToManyControls
}
