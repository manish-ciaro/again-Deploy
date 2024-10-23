import { Router } from "express";
import * as riskController from "../controllers/riskController.js";
import isEmpty from "../../utils/functions.js";
import { StringDictionary } from "../../@types/dicts.js";
import { getTagRisks} from "../controllers/tagsController.js";
import riskFormulaModel from "../models/riskFormulaModel.js";
import { mapOneRiskToManyControls, mapOneRiskToManyProject } from "../../utils/mappingFuncs.js";
import { unMapOneRiskToManyControls, unMapOneRiskToManyProject } from "../../utils/unMappingFuncs.js";

const riskRouter = Router();

// CREATE
riskRouter.post('/', async (req, res) => {
  const {
    title, description, content,category,likelihood,impact,project,risk
  } = req.body;
  const data = await riskController.saveRisk(req.uId, {
    title, description, content,category,likelihood,impact,project,risk
  });
  data.status ? res.json(data) : res.status(404).json(data);
});




riskRouter.post('/comment/:riskId', async (req, res) => {
  var riskId = req.params.riskId
  const { content, images } = req.body;
  const data = await riskController.saveComment(riskId, req.uId, content, images);
  data.status ? res.json(data) : res.status(404).json(data);
});

riskRouter.post('/tags/:riskId', async (req, res) => {
  const riskId = req.params.riskId;
  const { tags } = req.body;
  const data = await riskController.addRiskTag(riskId, req.uId,tags);
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

riskRouter.post("/:id/version/:name", async (req, res) => {
  var {id,name} = req.params
  var data = await riskController.saveVersion(id,name,req.uId)
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


// MAP
riskRouter.post("/:id/projects", async (req, res) => {
  var id = req.params.id;
  var projects = req.body.projects
  var data = await mapOneRiskToManyProject(id,projects, req.uId);
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
riskRouter.post("/:id/controls", async (req, res) => {
  var id = req.params.id;
  var controls = req.body.controls
  var data = await mapOneRiskToManyControls(id,controls, req.uId);
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

// RETRIVE
riskRouter.get('/comment/:riskId', async (req, res) => {
  const { riskId } = req.params;
  var { page: _page, count: _count } = req.query as StringDictionary
  if (isEmpty(_page, _count)) return res.sendStatus(404)
  var page = parseInt(_page)
  var count = parseInt(_count)
  const data = await riskController.getRiskComments(riskId, page, count, req.uId);
  data.status ? res.json(data) : res.status(404).json(data);
});

riskRouter.get("/tags/:id", async (req, res) => {
  var id = req.params.id
  var { page: _page, count: _count } = req.query as StringDictionary
  if (isEmpty(_page, _count)) return res.sendStatus(404)
  var page = parseInt(_page)
  var count = parseInt(_count)

  var data = await getTagRisks(id, page, count)
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})

riskRouter.get("/metadata",(req, res)=>{
  res.json(global.masterData.risk)
})

riskRouter.get('/', async (req, res) => {
  var { page: _page, count: _count } = req.query as StringDictionary
  if (isEmpty(_page, _count)) return res.sendStatus(404)
  var page = parseInt(_page)
  var count = parseInt(_count)
  const data = await riskController.getAllRisks(page, count, req.uId);
  data.status ? res.json(data) : res.status(404).json(data);
});

riskRouter.get('/:riskId', async (req, res) => {
  var riskId = req.params.riskId
  const data = await riskController.getRisk(riskId,req.uId);
  data.status ? res.json(data) : res.status(404).json(data);
});

riskRouter.get("/export/:type", async (req, res) => {
  var type = req.params.type
  var data = await riskController.exportRisks(type, req.uId)
  if(data.status && data.contentType){
      res.setHeader('Content-Type', data.contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${data.filename}`);
      res.send(data.data)
  }else{
      res.status(404).json(data)
  }
})
riskRouter.get("/version/:versionId", async (req, res) => {
  var {versionId} = req.params
  var data = await riskController.getVersion(versionId,req.uId)
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});





// UPDATE
riskRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  const content = req.body;
  const data = await riskController.updateRisk(id, req.uId, content);
  data.status ? res.json(data) : res.status(404).json(data);
});

riskRouter.put("/:id/assignUser", async (req, res) => {
  var id = req.params.id;
  try {
      var body = req.body;
      var data = await riskController.assignUserToRisk(id,req.uId,body);
      data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
  } catch (error) {
      res.sendStatus(404);
  }
});



riskRouter.put("/:id/status/:type", async (req, res) => {
  var {id,type} = req.params;
  try {
      var data = await riskController.changeRiskStatus(
          id,
          req.uId,
          type
      );
      data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
  } catch (error) {
      res.sendStatus(404);
  }
});



// DELETE
riskRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const data = await riskController.deleteRisk(id, req.uId);
  data.status ? res.json(data) : res.status(404).json(data);
});

riskRouter.delete("/:id/unAssignUser", async (req, res) => {
  var id = req.params.id;
  try {
      var body = req.body;
      var data = await riskController.unAssignUserToRisk(id,req.uId,body);
      data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
  } catch (error) {
      res.sendStatus(404);
  }
});


riskRouter.delete('/:riskId/comments/:commentId', async (req, res) => {
  const {riskId,commentId} = req.params;
  const data = await riskController.deleteComment(riskId,commentId, req.uId);
  data.status ? res.json(data) : res.status(404).json(data);
});

riskRouter.delete("/tags/:riskId/", async (req, res) => {
  const {riskId} = req.params;
  const { tags } = req.body;
  var data = await riskController.deleteTagsFromRisk(riskId, tags, req.uId)
  // var data = await rmOneTagFromManyRisks(riskId, tags, req.uId)
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})


riskRouter.delete("/:id/projects", async (req, res) => {
  var id = req.params.id;
  var projects = req.body.projects
  var data = await unMapOneRiskToManyProject(id,projects, req.uId);
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});
riskRouter.delete("/:id/controls", async (req, res) => {
  var id = req.params.id;
  var controls = req.body.controls
  var data = await unMapOneRiskToManyControls(id,controls, req.uId);
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});

riskRouter.delete("/:id/version/:versionId", async (req, res) => {
  var {id,versionId} = req.params
  var data = await riskController.deleteVersion(id,versionId,req.uId)
  data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
});


export default riskRouter;