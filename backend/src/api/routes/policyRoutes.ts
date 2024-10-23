import { Router } from "express";
import * as policyController from "../controllers/policyController.js";
import isEmpty from "../../utils/functions.js";
import { StringDictionary } from "../../@types/dicts.js";
const policyRouter = Router();
import { incomingTagsData } from "../controllers/tagsController.js";
import { mapOnePolicyToManyControls, mapOnePolicyToManyProcedures, mapOnePolicyToManyProject } from "../../utils/mappingFuncs.js";
import { unMapOnePolicyToManyControls, unMapOnePolicyToManyProcedures, unMapOnePolicyToManyProject } from "../../utils/unMappingFuncs.js";
import Busboy from 'busboy';
import { NodeHtmlMarkdown } from "node-html-markdown";
import { fileMetaData } from "./filesRoutes.js";
import mammoth from "mammoth";


export interface incomingPolicyVersionCreateData {
    policyId: string,
    title: string,
    description: string,
    assignees:{author:[],reviewer:[],approver:[]}
}


// CREATE
policyRouter.post("/create", async (req, res) => {
    var {
        projectId,
        title
    } = req.body;
    if (
        isEmpty(
            projectId,
            title
        )
    ) {
        res.sendStatus(404);
    } else {
        var data = await policyController.createPolicy(
            req.uId,
            projectId,
            title
        );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

policyRouter.post("/fromTemplate", async (req, res) => {
    try {
        var {projectId,
            templateIds,
            assignees} = req.body;
        var data = await policyController.createPolicyFromTemplate(req.uId, projectId,templateIds,assignees );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});


policyRouter.post("/create/file", async (req, res) => {
    try {
        const busboy = Busboy({ headers: req.headers });
        var fileUploaded = false
        busboy.on('file', (_: string, file: NodeJS.ReadableStream, metaData: fileMetaData) => {
            if (fileUploaded) return
            fileUploaded = true

            var _data: any[] = []
            file.on('data', (data) => {
                _data.push(data);
            });

            file.on('end', async () => {
                var data = await mammoth.convertToHtml({buffer:Buffer.concat(_data)})
                var md = NodeHtmlMarkdown.translate(data.value)
                res.send(md)
            });
        });

        req.pipe(busboy);
    } catch (error) {
        console.log(error)
        res.json({
            status: false,
            msg: "Error"
        })
    }
})


policyRouter.post("/create/version", async (req, res) => {
    var {
        policyId,
        description,
        assignees
    }: incomingPolicyVersionCreateData = req.body;
    if (
        isEmpty(
            policyId,
            description,
            assignees
        )
    ) {
        res.sendStatus(404);
    } else {
        var data = await policyController.createPolicyVersion(
            req.uId,
            policyId,
            description,
            assignees
        );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

policyRouter.post("/:id/comment", async (req, res) => {
    var { images, comment } = req.body
    const data = await policyController.savePolicyVersionComments(
        req.params.id,
        req.uId,
        comment,
        images
    );
    data.status ? res.json(data) : res.status(404).json(data);
});


// MAP
policyRouter.post("/:id/procedures", async (req, res) => {
    var id = req.params.id;
    var procedures = req.body.procedures
    var data = await mapOnePolicyToManyProcedures(id, procedures, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
policyRouter.post("/:id/projects", async (req, res) => {
    var id = req.params.id;
    var projects = req.body.projects
    var data = await mapOnePolicyToManyProject(id, projects, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
policyRouter.post("/:id/controls", async (req, res) => {
    var id = req.params.id;
    var controls = req.body.controls
    var data = await mapOnePolicyToManyControls(id, controls, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

policyRouter.post("/:id/tags", async (req, res) => {
    var id = req.params.id;
    var tags = req.body.tags;
    try {
        var data = await policyController.addPolicyTags(id, req.uId, tags);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});





// RETRIVE

policyRouter.get("/", async (req, res) => {
    var { page, count, field, order, search } = req.query as StringDictionary;
    if (isEmpty(page, count)) {
        res.sendStatus(404);
    } else {
        var data = await policyController.getAllPolicy(req.uId, page, count, {
            field,
            order,
        }, search);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

policyRouter.get("/overview", async (req, res) => {
    var data = await policyController.overview(req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

// policyRouter.get("/count",async (req,res)=>{
//     var data = await policyController.getTotalCount(req.uId)
//     data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
// })

policyRouter.get("/:id/comments", async (req, res) => {
    var id = req.params.id
    var { page, count } = req.query as StringDictionary;
    if (isEmpty(page, count)) {
        res.sendStatus(404);
    } else {
        var data = await policyController.getPolicyVersionComments(id, page, count, req.uId);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

policyRouter.get("/:id", async (req, res) => {
    var id = req.params.id;
    if (isEmpty(id)) {
        res.sendStatus(404);
    } else {
        var data = await policyController.getPolicy(id, req.uId);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
});

policyRouter.get("/:policy/version/:versionId", async (req, res) => {
    var { versionId,policy } = req.params
    var data = await policyController.getPolicyVersion(policy,versionId, req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


policyRouter.get("/:policy/export/:versionId", async (req, res) => {
    var { versionId,policy } = req.params
    var data = await policyController.exportPolicyVersion(policy,versionId, req.uId)
    if (data.status) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${data.msg}.pdf`);
        res.send(Buffer.from(data.data))
    } else {
        res.status(404).json(data);
    }
})



// UPDATING
policyRouter.put("/:id", async (req, res) => {
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
        var data = await policyController.updatePolicyVersionDetails(
            id,
            req.uId,
            props
        );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});

policyRouter.put("/:id/assignUser", async (req, res) => {
    var id = req.params.id;
    try {
        var body = req.body;
        var data = await policyController.assignUserToPolicy(id, req.uId, body);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});



policyRouter.put("/:versionId/status/:type", async (req, res) => {
    var { versionId, type } = req.params;
    try {
        var data = await policyController.changePolicyVersionStatus(
            versionId,
            req.uId,
            type
        );
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});


policyRouter.put("/:id/reminder/", async (req, res) => {
    var id = req.params.id;
    var next_reminder = req.body.next_reminder
    try {
        var data = await policyController.updatePolicyReminder(
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
// TODO: what about deleting a policy
// policyRouter.delete("/:id", async (req, res) => {
//     var id = req.params.id;
//     var data = await policyController.deletePolicy(id, req.uId);
//     data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
// });


policyRouter.delete("/:id", async (req, res) => {
    var id = req.params.id;
    var data = await policyController.deletePolicy(
        id,
        req.uId
    );
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

policyRouter.delete("/:id/comment/:commentId", async (req, res) => {
    var id = req.params.id;
    var commentId = req.params.commentId;
    var data = await policyController.deletePolicyVersionComment(
        id,
        commentId,
        req.uId
    );
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

policyRouter.delete("/:id/tags/", async (req, res) => {
    var id = req.params.id
    var tags = req.body.tags;
    var data = await policyController.deletePolicyTags(id, req.uId, tags);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

policyRouter.delete("/:id/version/:versionId", async (req, res) => {
    var { id, versionId } = req.params
    var data = await policyController.deletePolicyVersion(id, versionId, req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

policyRouter.delete("/:id/unAssignUser", async (req, res) => {
    var id = req.params.id;
    try {
        var body = req.body;
        var data = await policyController.unAssignUserToPolicyVersion(id, req.uId, body);
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    } catch (error) {
        res.sendStatus(404);
    }
});

// unlink
policyRouter.delete("/:id/procedures", async (req, res) => {
    var id = req.params.id;
    var procedures = req.body.procedures
    var data = await unMapOnePolicyToManyProcedures(id, procedures, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
policyRouter.delete("/:id/projects", async (req, res) => {
    var id = req.params.id;
    var projects = req.body.projects
    var data = await unMapOnePolicyToManyProject(id, projects, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
policyRouter.delete("/:id/controls", async (req, res) => {
    var id = req.params.id;
    var controls = req.body.controls
    var data = await unMapOnePolicyToManyControls(id, controls, req.uId);
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


export default policyRouter
