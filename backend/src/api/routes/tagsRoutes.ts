import { Router } from "express";
import * as tagsController from "../controllers/tagsController.js"
const tagsRoutes = Router()

// RETRIVE
tagsRoutes.get("/",async (req,res)=>{
    var page = parseInt(req.query.page?.toString()!)
    var count = parseInt(req.query.count?.toString()!)
    var tagName = req.query.tagName?.toString()
    var data = await tagsController.getAllTags(page,count,tagName)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

tagsRoutes.get("/:id",async (req,res)=>{
    var id = req.params.id
    var page = parseInt(req.query.page?.toString()!)
    var count = parseInt(req.query.count?.toString()!)

    var data = await tagsController.getTagPolicies(id,page,count)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

// UPDATE
tagsRoutes.put("/:id/:name",async (req,res)=>{
    var id = req.params.id
    var name = req.params.name
    var data = await tagsController.updateTagName(id,req.uId,name)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})


// DELETE
tagsRoutes.delete("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await tagsController.deleteTag(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})
tagsRoutes.delete("/:id/policies",async (req,res)=>{
    var id = req.params.id
    var policies = req.body.policies
    var data = await tagsController.rmOneTagFromManyPolicy(id,policies,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

export default tagsRoutes


