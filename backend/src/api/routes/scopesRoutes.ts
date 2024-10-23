import { Router } from "express";
import * as scopesController from "../controllers/scopesController.js"
const scopesRoutes = Router()

// CREATE
scopesRoutes.post("/",async (req,res)=>{
    var {name,description} = req.body
    var data = await scopesController.createScope(name,description,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})



// RETRIVE
scopesRoutes.get("/",async (req,res)=>{
    var page = parseInt(req.query.page?.toString()!)
    var count = parseInt(req.query.count?.toString()!)
    var scopeName = req.query.scopeName?.toString()
    var data = await scopesController.getAllScopes(page,count,scopeName)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})


// UPDATE
scopesRoutes.put("/:id",async (req,res)=>{
    var scopeId = req.params.id
    var {name,description} = req.body
    var data = await scopesController.updateScope(scopeId,name,description,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})

// LINK
scopesRoutes.post("/:id/projects",async (req,res)=>{
    var scopeId = req.params.id
    var {projects} = req.body
    var data = await scopesController.addOneScopeToManyProjects(scopeId,projects,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status

})



// DELETE
scopesRoutes.delete("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await scopesController.deleteScope(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})
scopesRoutes.delete("/:id/projects",async (req,res)=>{
    var id = req.params.id
    var projects = req.body.projects
    var data = await scopesController.rmOneScopeFromManyProjects(id,projects,req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

export default scopesRoutes


