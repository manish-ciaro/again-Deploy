import { Router } from "express";
import * as procedureController from "../controllers/procedureController.js";
import isEmpty from "../../utils/functions.js";
import { StringDictionary } from "../../@types/dicts.js";
const procedureRouter = Router();
import { incomingTagsData } from "../controllers/tagsController.js";
import { unMapOneProcedureToManyControls, unMapOneProcedureToManyPolicies, unMapOneProcedureToManyProject } from "../../utils/unMappingFuncs.js";
import { mapOneProcedureToManyControls, mapOneProcedureToManyPolicies, mapOneProcedureToManyProject } from "../../utils/mappingFuncs.js";

export interface incomingProcedureCreateData{
    title:string,
    description:string,
    content:string,
    tags: incomingTagsData,
    policies: string[],
    projectId: string,
}

// CREATE
procedureRouter.post("/create", async (req, res) => {
    var {
        title,
        description,
        content,
        tags,
        policies,
        projectId
    }: incomingProcedureCreateData = req.body;
    if (
        isEmpty(
            title,
            description,
            content,
            tags,
            policies,
            projectId
        )
    ) {
        res.sendStatus(404);
    } else {
        var data = await procedureController.saveProcedure(
            req.uId,
            title,
            description,
            content,
            tags,
            policies,
            projectId
        );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

procedureRouter.post("/:id/comment", async (req, res) => {
    var {images,comment} = req.body
    const data = await procedureController.saveProcedureComments(
        req.params.id,
        req.uId,
        comment,
        images
    );
    data.status ? res.json(data) : res.status(404).json(data);
});

procedureRouter.post("/:id/version/:name", async (req, res) => {
    var {id,name} = req.params
    var data = await procedureController.saveVersion(id,name,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


procedureRouter.post("/:id/reminder", async (req, res) => {
    var id = req.params.id;
    var { next_reminder } = req.body;
    var data = await procedureController.setReminder(id, req.uId, next_reminder);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

procedureRouter.post("/:id/tags", async (req, res) => {
    var id = req.params.id;
    var tags = req.body.tags;

    try {
        var data = await procedureController.addProcedureTags(id, req.uId, tags);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});


// MAP
procedureRouter.post("/:id/policies", async (req, res) => {
    var id = req.params.id;
    var procedures = req.body.procedures
    var data = await mapOneProcedureToManyPolicies(id,procedures, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
procedureRouter.post("/:id/projects", async (req, res) => {
    var id = req.params.id;
    var projects = req.body.projects
    var data = await mapOneProcedureToManyProject(id,projects, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
procedureRouter.post("/:id/controls", async (req, res) => {
    var id = req.params.id;
    var controls = req.body.controls
    var data = await mapOneProcedureToManyControls(id,controls, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});



// RETRIVE
procedureRouter.get("/", async (req, res) => {
    var { page, count, field, order } = req.query as StringDictionary;
    if (isEmpty(page, count, field, order)) {
        res.sendStatus(404);
    } else {
        var data = await procedureController.getAllProcedure(req.uId,page, count, {
            field,
            order,
        });
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

procedureRouter.get("/count",async (req,res)=>{
    var data = await procedureController.getTotalCount(req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

procedureRouter.get("/:id/comments", async (req, res) => {
    var id = req.params.id
    var { page, count } = req.query as StringDictionary;
    if (isEmpty(page, count)) {
        res.sendStatus(404);
    } else {
        var data = await procedureController.getProcedureComments(id,page, count,req.uId);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

procedureRouter.get("/:id", async (req, res) => {
    var id = req.params.id;
    if (isEmpty(id)) {
        res.sendStatus(404);
    } else {
        var data = await procedureController.getProcedure(id,req.uId);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

procedureRouter.get("/version/:versionId", async (req, res) => {
    var {versionId} = req.params
    var data = await procedureController.getVersion(versionId,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


procedureRouter.get("/export/:id",async (req,res)=>{
    var id = req.params.id
    var data = await procedureController.exportProcedure(id,req.uId)
    if(data.status){
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${data.msg}.pdf`);
        res.send(Buffer.from(data.data.buffer))
    }else{
        res.status(404).json(data);
    }
})



// UPDATING
procedureRouter.put("/:id", async (req, res) => {
    var id = req.params.id;
    try {
        var {
            title,
            description,
            content,
            beingModified,
        } = req.body;
        var props = Object.fromEntries(
            Object.entries({
                title,
                description,
                content,
                beingModified,
            }).filter(([_, value]) => value !== undefined && value !== "" && typeof value !== "object")        
        );
        var data = await procedureController.updateProcedureDetails(
            id,
            req.uId,
            props
        );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});

procedureRouter.put("/:id/assignUser", async (req, res) => {
    var id = req.params.id;
    try {
        var body = req.body;
        var data = await procedureController.assignUserToProcedure(id,req.uId,body);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});



procedureRouter.put("/:id/status/:type", async (req, res) => {
    var {id,type} = req.params;
    try {
        var data = await procedureController.changeProcedureStatus(
            id,
            req.uId,
            type
        );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});


procedureRouter.put("/:id/reminder/", async (req, res) => {
    var id = req.params.id;
    var next_reminder = req.body.next_reminder
    try {
        var data = await procedureController.updateProcedureReminder(
            id,
            req.uId,
            next_reminder
        );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});

// DELETE
procedureRouter.delete("/:id", async (req, res) => {
    var id = req.params.id;
    var data = await procedureController.deleteProcedure(id, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


procedureRouter.delete("/:id/comment/:commentId", async (req, res) => {
    var id = req.params.id;
    var commentId = req.params.commentId;
    var data = await procedureController.deleteProcedureComment(
        id,
        commentId,
        req.uId
    );
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

procedureRouter.delete("/:id/tags/", async (req, res) => {
    var id = req.params.id
    var tags = req.body.tags;
    var data = await procedureController.deleteProcedureTags(id, req.uId, tags);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

procedureRouter.delete("/:id/version/:versionId", async (req, res) => {
    var {id,versionId} = req.params
    var data = await procedureController.deleteVersion(id,versionId,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

procedureRouter.delete("/:id/unAssignUser", async (req, res) => {
    var id = req.params.id;
    try {
        var body = req.body;
        var data = await procedureController.unAssignUserToProcedure(id,req.uId,body);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});

// unlink
procedureRouter.delete("/:id/policies", async (req, res) => {
    var id = req.params.id;
    var policies = req.body.policies
    var data = await unMapOneProcedureToManyPolicies(id,policies, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
procedureRouter.delete("/:id/projects", async (req, res) => {
    var id = req.params.id;
    var projects = req.body.projects
    var data = await unMapOneProcedureToManyProject(id,projects, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
procedureRouter.delete("/:id/controls", async (req, res) => {
    var id = req.params.id;
    var controls = req.body.controls
    var data = await unMapOneProcedureToManyControls(id,controls, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


export default procedureRouter
