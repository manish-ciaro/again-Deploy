import assert, { AssertionError } from "assert";
import myResponse from "../../@types/response.js";
import evidencesModel, { IEvidence, frequencies } from "../models/evidencesModel.js";
import controlsModel from "../models/controlsModel.js";
import riskModel from "../models/riskModel.js";
import filesModel from "../models/filesModel.js";
import { isAValidUrl } from "../../utils/functions.js";
import userModel from "../models/userModel.js";



export interface CreateEvidencesInterface {
    name: string,
    frequency: string,
    files: string[],
    url: string
}

export interface GetAllEvidencesInterface {
    name: string | undefined,
    page: number,
    count: number
}

export interface updateBasicDetailsEvidencesInterface {
    evidenceId: string,
    name: string,
    frequency: keyof typeof frequencies,
    url: string,
}


// CREATE
async function createEvidence(data:IEvidence, uId: string): Promise<myResponse> {
    try {
        // TODO: auth code
        if(data.url){
            assert(data.url instanceof Array,"URL should be an array")
            data.url.map(_u=>{
                return assert(isAValidUrl(_u),"Not a valid URL")
            })
        }

        if(data.assignee){
            assert(data.assignee instanceof Array,"Assignee should be an array")
            assert(data.assignee.length <= 3,"Assignees can't be more than 3")
            await Promise.all(data.assignee.map(async _user=>{
                return assert(await userModel.exists({_id:_user}),"Assignees not found")
            }))
        }else{
            data.assignee=[uId]
        }

        if(data.files){
            assert(data.files instanceof Array,"Files should be an array")
            await Promise.all(data.files.map(async file=>{
                assert(await filesModel.exists({_id:file}),"Attachment not found")
            }))
        }


        var evidence = await evidencesModel.create(data);

        if(data.controls){
            await controlsModel.updateMany(
                { _id: data.controls },
                {
                    $addToSet: {
                        evidences: evidence._id
                    }
                }
            )
        }

        if(data.risks){
            await riskModel.updateMany(
                { _id: data.risks },
                {
                    $addToSet: {
                        evidences: evidence._id
                    }
                }
            )
        }

        return {
            status: true,
            msg: evidence.id
        }
    } catch (error: any) {
        if (error.name === "MongoServerError" && error.code === 11000) return {
            status: false,
            msg: "Name is dublicate",
        };
        if(error instanceof AssertionError)return {
            status: false,
            msg: error.message,
        };
        console.log(error)
        return {
            status: false,
            msg: "Error"
        }
    }
}

// LINKING
async function addOneEvidenceToManyControls({ evidenceId, controls }: {
    evidenceId: string, controls: string[]
}, uId: string): Promise<myResponse> {

    try {
        // TODO: Auth check
        var evidence = await evidencesModel.exists({ _id: evidenceId })
        assert(evidence, "Evidence not found")

        // check if controls exists
        await Promise.all(controls.map(async controlId => {
            assert(await controlsModel.exists({ _id: controlId }), "Control not found")
        }))

        var update = await evidencesModel.updateOne(
            { _id: evidenceId },
            {
                $set: {
                    updatedAt: Date.now(), updatedBy: uId
                },
                $addToSet: {
                    controls: controls
                }
            }
        )

        var update = await controlsModel.updateMany(
            { _id: controls },
            {
                $addToSet: {
                    evidences: evidenceId
                }
            }
        )

        return {
            status: true,
            msg: "Evidence linked to Controls"
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

async function addOneEvidenceToManyRisk({ evidenceId, risks }: {
    evidenceId: string, risks: string[]
}, uId: string): Promise<myResponse> {

    try {
        // TODO: Auth check
        var evidence = await evidencesModel.exists({ _id: evidenceId })
        assert(evidence, "Evidence not found")

        // check if risks exists
        await Promise.all(risks.map(async controlId => {
            assert(await riskModel.exists({ _id: controlId }), "Risk not found")
        }))

        var update = await evidencesModel.updateOne(
            { _id: evidenceId },
            {
                $set: {
                    updatedAt: Date.now(), updatedBy: uId
                },
                $addToSet: {
                    risks: risks
                }
            }
        )

        var update = await riskModel.updateMany(
            { _id: risks },
            {
                $addToSet: {
                    evidences: evidenceId
                }
            }
        )

        return {
            status: true,
            msg: "Evidence linked to risk"
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

async function addEvidenceAssignee({ evidenceId = "", assignee = [] }, uId: string) {
    try {
        // TODO: auth ?
        var evidence = await evidencesModel.exists({ _id: evidenceId });
        assert(evidence, "Evidence not found")

        await Promise.all(assignee.map(async user=>{
            assert(await userModel.exists({_id:user}),"Users not found")
        }))

        await evidencesModel.updateOne({ _id: evidenceId }, {
            $set: {
                updatedAt: Date.now(), updatedBy: uId
            },
            $addToSet: {
                assignee
            }
        });

        return {
            status: true,
            msg: "Added evidence assignees",
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

async function addEvidenceFiles({ evidenceId = "", files = [] }, uId: string) {
    try {
        // TODO: auth ?
        var evidence = await evidencesModel.exists({ _id: evidenceId });
        assert(evidence, "Evidence not found")
       
        await Promise.all(files.map(async file=>{
            assert(await filesModel.exists({_id:file}),"Attachment not found")
        }))

        await evidencesModel.updateOne({ _id: evidenceId }, {
            $set: {
                updatedAt: Date.now(), updatedBy: uId
            },
            $addToSet: {
                files
            }
        });

        return {
            status: true,
            msg: "Added evidence files",
        };
    } catch (error) {
        console.log(error)
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



// RETRIVE
async function getAllEvidences({ name = "", page = 1, count = 5 }: GetAllEvidencesInterface, uId: String) {
    try {
        const evidences = await evidencesModel.aggregate([
            {$project:{name:1}},
            { $match: { name: { $regex: name, $options: "i" } } },
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);
        await evidencesModel.populate(evidences, { path: "risks", select: { name: 1 } })
        await evidencesModel.populate(evidences, { path: "controls", select: { name: 1 } })
        return {
            status: true,
            evidences: evidences,
        };
    } catch (error) {
        console.log(error);
        return {
            status: false,
            msg: "Error",
        };
    }
}
async function getEvidence(evidenceId:string, uId: string) {
    try {
        const evidence = await evidencesModel
                                .findById(evidenceId)
                                .populate("risks","title")
                                .populate("controls","nameId name")
                                .populate("assignee","email")
                                .populate("files","name")
        return {
            status: true,
            evidence
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
async function updateBasicEvidence({ evidenceId, name, frequency, url }: updateBasicDetailsEvidencesInterface, uId: string) {
    try {
        // TODO: auth ?

        var evidence = await evidencesModel.exists({ _id: evidenceId });
        assert(evidence, "Evidence not found")

        if(url) assert(isAValidUrl(url),"not a valid URL")
        
        assert(frequencies[frequency] ,"Undefined frequency")

        await evidencesModel.updateOne({ _id: evidenceId }, {
            $set: {
                name, frequency, url, updatedAt: Date.now(), updatedBy: uId
            }
        },{runValidators:true});

        return {
            status: true,
            msg: "Evidence update",
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        console.log(error)

        return {
            status: false,
            msg: "Error",
        };
    }
}




// DELETE
async function deleteEvidence(evidenceId: string, uId: string) {
    try {
        // TODO: auth check ?
        var evidence = await evidencesModel.findByIdAndDelete({ _id: evidenceId });
        assert(evidence, `No evidence with id: ${evidenceId}`)


        // remove evidences from the risk
        if (evidence.risks) {
            await riskModel.updateMany(
                { _id: evidence.risks },
                { $pullAll: { evidences: evidenceId } }
            )
        }

        // remove evidences from the risk
        if (evidence.controls) {
            await riskModel.updateMany(
                { _id: evidence.controls },
                { $pullAll: { evidences: evidenceId } }
            )
        }

        return {
            status: true,
            msg: "Deleted the evidence",
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

async function rmOneEvidenceFromManyControls({ evidenceId, controls }: {
    evidenceId: string, controls: string[]
}, uId: string): Promise<myResponse> {

    try {
        // TODO: Auth check
        var evidence = await evidencesModel.exists({ _id: evidenceId })
        assert(evidence, "Evidence not found")

        // check if controls exists
        await Promise.all(controls.map(async controlId => {
            assert(await controlsModel.exists({ _id: controlId }), "Control not found")
        }))

        var update = await evidencesModel.updateOne(
            { _id: evidenceId },
            {
                $set: {
                    updatedAt: Date.now(), updatedBy: uId
                },
                $pullAll: {
                    controls: controls
                }
            }
        )

        var update = await controlsModel.updateMany(
            { _id: controls },
            {
                $pull: {
                    evidences: evidenceId
                }
            }
        )

        return {
            status: true,
            msg: "Evidence unlinked to Controls"
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

async function rmOneEvidenceFromManyRisks({ evidenceId, risks }: {
    evidenceId: string, risks: string[]
}, uId: string): Promise<myResponse> {

    try {
        // TODO: Auth check
        var evidence = await evidencesModel.exists({ _id: evidenceId })
        assert(evidence, "Evidence not found")

        // check if risks exists
        await Promise.all(risks.map(async controlId => {
            assert(await riskModel.exists({ _id: controlId }), "Risk not found")
        }))

        var update = await evidencesModel.updateOne(
            { _id: evidenceId },
            {
                $set: {
                    updatedAt: Date.now(), updatedBy: uId
                },
                $pullAll: {
                    risks: risks
                }
            }
        )

        var update = await riskModel.updateMany(
            { _id: risks },
            {
                $pull: {
                    evidences: evidenceId
                }
            }
        )

        return {
            status: true,
            msg: "Evidence unlinked to risk"
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

async function rmEvidenceAssignee({ evidenceId, assignee = [] }: {
    evidenceId: string, assignee: string[]
}, uId: string): Promise<myResponse> {

    try {
        // TODO: Auth check
        var evidence = await evidencesModel.exists({ _id: evidenceId })
        assert(evidence, "Evidence not found")

        var update = await evidencesModel.updateOne(
            { _id: evidenceId },
            {
                $set: {
                    updatedAt: Date.now(), updatedBy: uId
                },
                $pullAll: {
                    assignee: assignee
                }
            }
        )


        return {
            status: true,
            msg: "Assignee removed from evidence"
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

async function rmEvidenceFiles({ evidenceId, files = [] }: {
    evidenceId: string, files: string[]
}, uId: string): Promise<myResponse> {

    try {
        // TODO: Auth check
        var evidence = await evidencesModel.exists({ _id: evidenceId })
        assert(evidence, "Evidence not found")

        var update = await evidencesModel.updateOne(
            { _id: evidenceId },
            {
                $set: {
                    updatedAt: Date.now(), updatedBy: uId
                },
                $pullAll: {
                    files
                }
            }
        )


        return {
            status: true,
            msg: "Files removed from evidence"
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


export {
    createEvidence,
    getEvidence,
    addEvidenceAssignee,
    addOneEvidenceToManyControls,
    addOneEvidenceToManyRisk,
    addEvidenceFiles,
    getAllEvidences,
    updateBasicEvidence,
    deleteEvidence,
    rmEvidenceAssignee,
    rmOneEvidenceFromManyControls,
    rmOneEvidenceFromManyRisks,
    rmEvidenceFiles
};
