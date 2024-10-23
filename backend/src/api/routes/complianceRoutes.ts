import { Router } from "express";
import isEmpty from "../../utils/functions.js";
import * as complianceController from "../controllers/complianceController.js";
import assert from "assert";
import { StringDictionary } from "../../@types/dicts.js";


const complianceRouter = Router()


complianceRouter.post('/createFramework', async(req,res)=>{
    var framework = req.body
    assert(!(isEmpty(framework)))
     var data = await complianceController.createFramework(framework)
     data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.get("/frame", async (req, res) => {
    var { page, count,field, order, search } = req.query as StringDictionary;
    if (isEmpty(page, count)) {
        res.sendStatus(404)
    } else {
        var data = await complianceController.getAllFrameworks(req.uId, page, count, {
            field,
            order,
        }, search);
        data.status ? res.json(data) : res.status(404).json(data); 
    }
})

complianceRouter.get('/framework/:id/controls',async(req,res)=>{
    var id = req.params.id
    var {page, count ,field,order,search}= req.query as StringDictionary
    if(isEmpty(page,count)){
        res.sendStatus(404) 
    }else{
        var data = await complianceController.getAllControls(req.uId,id,page,count,{
            field,
            order
        },search)
        data.status ? res.json(data) : res.status(404).json(data)
    }
})


complianceRouter.get('/framework/:id/controls/:controlId',async(req,res)=>{
 var id = req.params.id
 var controlId= req.params.id
 var data = await complianceController.getControl(req.uId,id,controlId)
 data.status ? res.json(data) : res.status(404).json(data)
})

// control status 
// for post
complianceRouter.post('/controlstatus/:id',async(req,res)=>{
    var controlId = req.params.id
    var {scope, justification} = req.body
    var data = await complianceController.createControlStaus(controlId,scope, justification)
    data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.put('/controls/:id/status',async(req,res)=>{
    var id = req.params.id
    var {scope,justification} = req.body
    var data = await complianceController.updateControlStatus( id,scope,justification)
    data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.get('/controls/controlStatus',async(req,res)=>{
     var data = await complianceController.getAllControlStatus(req.uId)
     data.status ? res.json(data) : res.status(404).json(data)
})



// get specific 

complianceRouter.get('/controls/:id/controlStatus',async(req,res)=>{
    var id = req.params.id
     var data = await complianceController.getControlStatus(id)
     data.status ? res.json(data) : res.status(404).json(data)
})

// update

complianceRouter.put('/:id/addProject',async(req,res)=>{
    var id = req.params.id
    var {projects} = req.body
    var data = await complianceController.addProjectToControlStatus(id,projects)
    data.status ? res.json(data) : res.status(404).json(data) 
})

complianceRouter.put('/controlStatus/:id/addPolicy',async(req,res)=>{
    var id = req.params.id
    var {policy} = req.body
    var data = await complianceController.addPolicyToControlStatus(id,policy)
    data.status ? res.json(data) : res.status(404).json(data) 
})

complianceRouter.put('/controlStatus/:id/addRisks',async(req,res)=>{
    var id = req.params.id
    var {Risks} = req.body
    var data = await complianceController.addRisksToControlStatus(id,Risks)
    data.status ? res.json(data) : res.status(404).json(data) 
})

complianceRouter.put('/controlStatus/:id/addEvidence',async(req,res)=>{
    var id = req.params.id
    var {evidence} = req.body
    var data = await complianceController.addEvidenceToControlStatus(id,evidence)
    data.status ? res.json(data) : res.status(404).json(data) 
})

// delete

complianceRouter.delete("/controlStatus/:id/Project",async(req, res)=>{
    var id = req.params.id
    var {Project} = req.body
    var data = await complianceController.remControlStatusProject(id,Project)
    data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.delete("/controlStatus/:id/Policy",async(req, res)=>{
    var id = req.params.id
    var {Policy} = req.body
    var data = await complianceController.remControlStatusPolicy(id,Policy)
    data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.delete("/controlStatus/:id/Risks",async(req, res)=>{
    var id = req.params.id
    var {Risks} = req.body
    var data = await complianceController.remControlStatusRisk(id,Risks)
    data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.delete("/controlStatus/:id/Evidence",async(req, res)=>{
    var id = req.params.id
    var {Evidence} = req.body
    var data = await complianceController.remControlStatusProject(id,Evidence)
    data.status ? res.json(data) : res.status(404).json(data)
})

// evidence addPolicyToControlStatus

complianceRouter.post('/evidence',async(req,res)=>{
    var {evidenceName, frequency,assignees} = req.body
    var data = await complianceController.createEvidence(req.uId,evidenceName, frequency,assignees)
    data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.put("/evidence/:id",async(req,res)=>{
    var id = req.params.id
    var {files} = req.body
    var data = await complianceController.attachFile(req.uId,id,files)
    data.status ? res.json(data) : res.status(404).json(data)
})


// predefined evidence

complianceRouter.post('/predefinedEvidence', async(req,res)=>{
    var {name,description} = req.body
    assert(!(isEmpty(name,description)))
     var data = await complianceController.createPredefinedEvidence(name,description)
     data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.get("/predefinedEvidence", async (req, res) => {
    var { page, count,field, order, search } = req.query as StringDictionary;
    if (isEmpty(page, count)) {
        res.sendStatus(404)
    } else {
        var data = await complianceController.getAllPredefinedEvidence(req.uId, page, count, {
            field,
            order,
        }, search);
        data.status ? res.json(data) : res.status(404).json(data); 
    }
})

complianceRouter.put("/enablePreEvidence/:id",async (req,res)=>{
    var evidenceId = req.params.id
    var data = await complianceController.enablePredefinedEvidence(evidenceId)
    data.status ? res.json(data) : res.status(404).json(data); 
})

complianceRouter.put("/disablePreEvidence/:id",async (req,res)=>{
    var evidenceId = req.params.id
    var data = await complianceController.disablePredefinedEvidence(evidenceId)
    data.status ? res.json(data) : res.status(404).json(data); 
})

complianceRouter.get('/getPredefinedEvidence/:id',async(req,res)=>{
    var id = req.params.id
    var data = await complianceController.getPredefinedEvidence(id)
    data.status ? res.json(data) : res.status(404).json(data)
})

// update 

complianceRouter.put("/:id/addAssignee", async (req, res) => {
    var id = req.params.id;
    try {
        var {assignee} = req.body;
        var data = await complianceController.assignUserToPredefinedEvidence(id, assignee);
        data.status ? res.json(data) : res.status(404).json(data); 
    } catch (error) {
        res.sendStatus(404);
    }
})

complianceRouter.put("/:id/addFiles",async(req,res)=>{
    var id = req.params.id
    var {files} = req.body
    var data = await complianceController.addEvidenceFile(id,files)
    data.status ? res.json(data) : res.status(404).json(data); 
})

complianceRouter.put("/:id/addControl",async(req,res)=>{
    var id = req.params.id
    var {controls} = req.body
    var data = await complianceController.addControl(id,controls)
    data.status ? res.json(data) : res.status(404).json(data); 
})

complianceRouter.put("/:id/addRisk",async(req,res)=>{
    var id = req.params.id
    var {risks} = req.body
    var data = await complianceController.addRisk(id,risks)
    data.status ? res.json(data) : res.status(404).json(data); 
})

complianceRouter.put("/:id/addURL",async(req,res)=>{
    var id = req.params.id
    const {url} = req.body
    var data = await complianceController.addURL(id,url)
    data.status ? res.json(data) : res.status(404).json(data); 
})

// delete
complianceRouter.delete("/:id/Control",async(req,res)=>{
    var id = req.params.id
    var {controls} = req.body
    var data = await complianceController.remEvidenceControl(id, controls)
    data.status ? res.json(data) : res.status(404).json(data);
})

complianceRouter.delete("/:id/Risk",async(req, res)=>{
    var id = req.params.id
    var {risks} = req.body
    var data = await complianceController.remEvidenceRisk(id,risks)
    data.status ? res.json(data) : res.status(404).json(data)
})

complianceRouter.delete("/:id/Files",async(req,res)=>{
    var id = req.params.id
    var {files} = req.body
    var data = await complianceController.remEvidenceFiles(id,files)
    data.status ? res.json(data):res.status(404).json(data);
})

complianceRouter.delete("/:id/URL",async(req,res)=>{
    var id = req.params.id
    var {url} = req.body
    var data = await complianceController.remEvidenceURL(id,url)
    data.status ? res.json(data):res.status(404).json(data);
})

complianceRouter.delete("/:id/assignee",async(req,res)=>{
    var id = req.params.id
    var {assignee}=req.body
    var data = await complianceController.remEvidenceAssignee(id,assignee)
    data.status ? res.json(data) : res.status(404).json(data)
})


export default complianceRouter

