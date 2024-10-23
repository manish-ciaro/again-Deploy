import { Router } from "express";
import * as evidencesController from "../controllers/evidencesController.js"
const evidencesRoutes = Router()

// CREATE
evidencesRoutes.post("/",async (req,res)=>{
    var data = await evidencesController.createEvidence(req.body,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

// RETRIVE
evidencesRoutes.get("/",async (req,res)=>{
    var page = parseInt(req.query.page?.toString()!)
    var count = parseInt(req.query.count?.toString()!)
    var name = req.query.evidenceName?.toString()
    var data = await evidencesController.getAllEvidences({page,count,name},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})
evidencesRoutes.get("/:id",async (req,res)=>{
    var evidenceId = req.params.id
    var data = await evidencesController.getEvidence(evidenceId,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})


// UPDATE
evidencesRoutes.put("/:id",async (req,res)=>{
    var evidenceId = req.params.id
    var {name,frequency,url} = req.body
    var data = await evidencesController.updateBasicEvidence({name,frequency,url,evidenceId},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})

// LINK
evidencesRoutes.put("/:id/risks",async (req,res)=>{
    var evidenceId = req.params.id
    var {risks} = req.body
    var data = await evidencesController.addOneEvidenceToManyRisk({evidenceId,risks},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})
evidencesRoutes.put("/:id/controls",async (req,res)=>{
    var evidenceId = req.params.id
    var {controls} = req.body
    var data = await evidencesController.addOneEvidenceToManyControls({evidenceId,controls},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})
evidencesRoutes.put("/:id/assignee",async (req,res)=>{
    var evidenceId = req.params.id
    var {assignee} = req.body
    var data = await evidencesController.addEvidenceAssignee({evidenceId,assignee},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})
evidencesRoutes.put("/:id/files",async (req,res)=>{
    var evidenceId = req.params.id
    var {files} = req.body
    var data = await evidencesController.addEvidenceFiles({evidenceId,files},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})



// DELETE
evidencesRoutes.delete("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await evidencesController.deleteEvidence(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})
evidencesRoutes.delete("/:id/risks",async (req,res)=>{
    var evidenceId = req.params.id
    var risks = req.body.risks
    var data = await evidencesController.rmOneEvidenceFromManyRisks({evidenceId,risks},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})
evidencesRoutes.delete("/:id/controls",async (req,res)=>{
    var evidenceId = req.params.id
    var controls = req.body.controls
    var data = await evidencesController.rmOneEvidenceFromManyControls({evidenceId,controls},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})
evidencesRoutes.delete("/:id/assignee",async (req,res)=>{
    var evidenceId = req.params.id
    var assignee = req.body.assignee
    var data = await evidencesController.rmEvidenceAssignee({evidenceId,assignee},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})
evidencesRoutes.delete("/:id/files",async (req,res)=>{
    var evidenceId = req.params.id
    var {files} = req.body
    var data = await evidencesController.rmEvidenceFiles({evidenceId,files},req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

export default evidencesRoutes


