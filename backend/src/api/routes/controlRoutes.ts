import { Router } from "express";
import * as controlController from "../controllers/controlController.js";
import { mapOneControlToManyPolicies, mapOneControlToManyProcedures, mapOneControlToManyProject, mapOneControlToManyRisks } from "../../utils/mappingFuncs.js";
import { unMapOneControlToManyPolicies, unMapOneControlToManyProcedures, unMapOneControlToManyProject, unMapOneControlToManyRisks } from "../../utils/unMappingFuncs.js";
import isEmpty from "../../utils/functions.js";
import { StringDictionary } from "../../@types/dicts.js";
const controlRoutes = Router();

// CREATE
controlRoutes.post("/create",async (req,res)=>{
    var {content,name,group} = req.body
    var data = await controlController.saveControl(req.uId,name,group,content)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})



// RETRIVE

controlRoutes.get("/groups", async (req, res) => {
    var { page, count,search } = req.query as StringDictionary;
    if (isEmpty(page, count)) {
        res.sendStatus(404);
    } else {
        var data = await controlController.getAllGroups(page, count,search,req.uId);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

controlRoutes.get("/subControls", async (req, res) => {
    var { nameId, groupId } = req.body as StringDictionary;
    var data = await controlController.getSubControls(nameId, groupId,req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

controlRoutes.get("/", async (req, res) => {
    var { page, count,search,group } = req.query as StringDictionary;
    if (isEmpty(page, count)) {
        res.sendStatus(404);
    } else {
        var data = await controlController.getAllControlsFromGroup(page, count,search,group,req.uId);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});
controlRoutes.get("/:id", async (req, res) => {
    var { id } = req.params;
    var data = await controlController.getControl(id,req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


// MAP
controlRoutes.post("/:id/procedures", async (req, res) => {
    var id = req.params.id;
    var procedures = req.body.procedures
    var data = await mapOneControlToManyProcedures(id,procedures, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
controlRoutes.post("/:id/projects", async (req, res) => {
    var id = req.params.id;
    var projects = req.body.projects
    var data = await mapOneControlToManyProject(id,projects, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
controlRoutes.post("/:id/policies", async (req, res) => {
    var id = req.params.id;
    var policies = req.body.policies
    var data = await mapOneControlToManyPolicies(id,policies, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
controlRoutes.post("/:id/risks", async (req, res) => {
    var id = req.params.id;
    var risks = req.body.risks
    var data = await mapOneControlToManyRisks(id,risks, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

// UPDATING
controlRoutes.put("/:id",async (req,res)=>{
    var id = req.params.id
    var {content} = req.body
    var data = await controlController.updateControl(id,req.uId,content)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})


// DELETE
controlRoutes.delete("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await controlController.deleteControl(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})

// unlink
controlRoutes.delete("/:id/procedures", async (req, res) => {
    var id = req.params.id;
    var procedures = req.body.procedures
    var data = await unMapOneControlToManyProcedures(id,procedures, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
controlRoutes.delete("/:id/projects", async (req, res) => {
    var id = req.params.id;
    var projects = req.body.projects
    var data = await unMapOneControlToManyProject(id,projects, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
controlRoutes.delete("/:id/policies", async (req, res) => {
    var id = req.params.id;
    var policies = req.body.policies
    var data = await unMapOneControlToManyPolicies(id,policies, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
controlRoutes.delete("/:id/risks", async (req, res) => {
    var id = req.params.id;
    var risks = req.body.risks
    var data = await unMapOneControlToManyRisks(id,risks, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


export default controlRoutes 
