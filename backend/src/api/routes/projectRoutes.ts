import { Router } from "express";
import * as projectController from "../controllers/projectController.js";
import isEmpty from "../../utils/functions.js";
import assert  from "assert";
import { StringDictionary } from "../../@types/dicts.js";
import { unMapOneProjectToManyControls, unMapOneProjectToManyPolicies, unMapOneProjectToManyProcedures, unMapOneProjectToManyRisks } from "../../utils/unMappingFuncs.js";
import { mapOneProjectToManyControls, mapOneProjectToManyPolicies, mapOneProjectToManyProcedures, mapOneProjectToManyRisks } from "../../utils/mappingFuncs.js";
import { addOneProjectToManyScopes } from "../controllers/scopesController.js";
const projectRouter = Router();

// CREATE
projectRouter.post("/", async (req, res) => {
    var { name,description } = req.body
    var data = await projectController.create(name,description, req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

projectRouter.post("/:id/procedures", async (req, res) => {
    var id = req.params.id;
    var procedures = req.body.procedures
    var data = await mapOneProjectToManyProcedures(id,procedures, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
projectRouter.post("/:id/policies", async (req, res) => {
    var id = req.params.id;
    var policies = req.body.policies
    var data = await mapOneProjectToManyPolicies(id,policies, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

projectRouter.post("/:id/controls", async (req, res) => {
    var id = req.params.id;
    var controls = req.body.controls
    var data = await mapOneProjectToManyControls(id,controls, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
projectRouter.post("/:id/risks", async (req, res) => {
    var id = req.params.id;
    var risks = req.body.risks
    var data = await mapOneProjectToManyRisks(id,risks, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

// RETRIVE
projectRouter.get("/", async (req, res) => {
    var { page, count, name } = req.query as StringDictionary
    try {
        assert(!isEmpty(page,count))
        var _page = parseInt(page)
        var _count = parseInt(count)
        var data = await projectController.getAll(_page,_count,name,req.uId)
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.status(404).json({})
    }

})

projectRouter.get("/:id/policies", async (req, res) => {
    var { page, count, policyTitle } = req.query as StringDictionary
    var { id } = req.params
    try {
        assert(!isEmpty(page,count))
        var _page = parseInt(page)
        var _count = parseInt(count)
        var data = await projectController.getProjectPolicies(id,_page,_count,policyTitle, req.uId)
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.status(404).json({})
    }
})

projectRouter.get("/:id", async (req, res) => {
    var { id } = req.params
    try {
        var data = await projectController.getProject(id, req.uId)
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.status(404).json({})
    }
})

// UPDATE
projectRouter.put("/:id", async (req, res) => {
    var { id } = req.params
    var name = req.body.name
    var data = await projectController.updateProject(id,name, req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

// DELETE
projectRouter.delete("/:id", async (req, res) => {
    var { id } = req.params
    var data = await projectController.deleteProject(id, req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

// unlink
projectRouter.delete("/:id/procedures", async (req, res) => {
    var id = req.params.id;
    var procedures = req.body.procedures
    var data = await unMapOneProjectToManyProcedures(id,procedures, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
projectRouter.delete("/:id/policies", async (req, res) => {
    var id = req.params.id;
    var policies = req.body.policies
    var data = await unMapOneProjectToManyPolicies(id,policies, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
projectRouter.delete("/:id/controls", async (req, res) => {
    var id = req.params.id;
    var controls = req.body.controls
    var data = await unMapOneProjectToManyControls(id,controls, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
projectRouter.delete("/:id/risks", async (req, res) => {
    var id = req.params.id;
    var risks = req.body.risks
    var data = await unMapOneProjectToManyRisks(id,risks, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


export default projectRouter;