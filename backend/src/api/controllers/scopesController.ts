import assert, { AssertionError } from "assert";
import policyModel from "../models/policyModel.js";
import scopesModel from "../models/scopes.js";
import projectModel from "../models/projectModel.js";
import myResponse from "../../@types/response.js";



export interface incomingScopesData {
    listed?: string[],
    unlisted?: string[]
}


// CREATE
async function createScope(scopeName: string, description: string, uId: string): Promise<myResponse> {
    try {
        // TODO: auth code
        var scope = await scopesModel.create({ name: scopeName, description });
        return{
            status: true,
            msg: scope.id
        }
    } catch (error:any) {
        if (error.name === "MongoServerError" && error.code === 11000) return {
            status: false,
            msg: "Name is dublicate",
        };
        return{
            status: false,
            msg:"Error"
        }
    }
}


async function addOneProjectToManyScopes(projectId: string, scopes: string[], uId: string): Promise<myResponse> {

    try {
        // TODO: Auth check
        var projectCheck = await projectModel.exists({ _id: projectId })
        assert(projectCheck, "Project not found")

        await Promise.all(scopes.map(async scope => {
            assert(await scopesModel.exists({ _id: scope }), "Scope not found")
        }))
        

        var update = await projectModel.updateOne(
            {_id: projectId},
            {
                $addToSet:{
                    scopes: scopes
                }
            }
        )

        var update = await scopesModel.updateMany(
            {_id: scopes},
            {
                $addToSet:{
                    projects: projectId
                }
            }
        )

        return{
            status: true,
            msg: "Project linked to scopes"
        }

    } catch (error) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }
        return {
            status: false,
            msg: "Error"
        }
    }

    
}



async function addOneScopeToManyProjects(scopeId: string,projects: string[], uId: string): Promise<myResponse> {

    try {
        // TODO: Auth check
        var scopeCheck = await scopesModel.exists({ _id: scopeId })
        assert(scopeCheck, "Scope not found")

        // TODO: check if projects exists
        await Promise.all(projects.map(async project => {
            assert(await projectModel.exists({ _id: project }), "Project not found")
        }))

        var update = await scopesModel.updateOne(
            {_id: scopeId},
            {
                $addToSet:{
                    projects: projects
                }
            }
        )

        var update = await projectModel.updateMany(
            {_id: projects},
            {
                $addToSet:{
                    scopes: scopeId
                }
            }
        )

        return{
            status: true,
            msg: "Scope linked to projects"
        }

    } catch (error) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }
        return {
            status: false,
            msg: "Error"
        }
    }

    
}



// RETRIVE
async function getAllScopes(page = 1, count = 10, scopeName = "") {
    try {
        const scopes = await scopesModel.aggregate([
            { $match: { name: { $regex: scopeName, $options: "i" } } },
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);
        await projectModel.populate(scopes, { path: "projects", select: { name: 1 } })
        return {
            status: true,
            scopes: scopes,
        };
    } catch (error) {
        console.log(error);
        return {
            status: false,
            msg: "Error",
        };
    }
}

// UPDATE
async function updateScope(scopeId: string, name:string,description:string,uId:string) {
    try {
        // TODO: auth ?
        var scope = await scopesModel.exists({ _id: scopeId });
        assert(scope, "Scope not found")
        await scopesModel.updateOne({ _id: scopeId }, { 
            $set:{
                name,description
            }
         });

        return {
            status: true,
            msg: "Scope update",
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error",
        };
    }
}

// DELETE
async function deleteScope(scopeId: string, uId: string) {
    try {
        var scope = await scopesModel.findByIdAndDelete({ _id: scopeId });
        assert(scope, `No scope with id: ${scopeId}`)


        // remove scopes from the projects
        if (scope.projects) {
            await projectModel.updateMany(
                { _id: scope.projects },
                { $pull: { scopes: scopeId } }
            )
        }

        return {
            status: true,
            msg: "Deleted the scope",
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error",
        };
    }
}

async function rmOneScopeFromManyProjects(scopeId: string, projects = [], uId: string) {
    try {
        var scope = await scopesModel.exists({ _id: scopeId });
        assert(scope, `No scope with id: ${scopeId}`)

        await Promise.all(projects.map(async project => {
            assert(await projectModel.exists({ _id: project }), "Project not found")
        }))
        await scopesModel.updateOne(
            { _id: scopeId },
            {
                $pull: {
                    projects: {
                        $in: projects
                    }
                }
            },
        );

        return {
            status: true,
            msg: "removed projects from scope",
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error",
        };
    }
}


export {
    createScope,
    addOneProjectToManyScopes,
    addOneScopeToManyProjects,
    getAllScopes,
    updateScope,
    deleteScope,
    rmOneScopeFromManyProjects
};
