import { Router } from "express";
import * as questionnaireController from "../controllers/questionnaireController.js"
import { StringDictionary } from "../../@types/dicts.js";
import isEmpty from "../../utils/functions.js";
const questionnaireRouter = Router()

// ADD
questionnaireRouter.post("/",async (req,res)=>{
    var body = req.body
    var data = await questionnaireController.create(body,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})
// DELETE
questionnaireRouter.delete("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await questionnaireController.deleteById(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})
// RETRIVE
questionnaireRouter.get("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await questionnaireController.getById(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
    
})

questionnaireRouter.get("/",async (req,res)=>{
    var {page:_page,count:_count} = req.query as StringDictionary
    try {
        if(isEmpty(_page,_count)) return res.sendStatus(404)
        
        var page = parseInt(_page)
        var count = parseInt(_count)
        var data = await questionnaireController.getAll(page,count,req.uId)
        data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
    } catch (error) {
        console.log(error)
        res.sendStatus(404)
    }
})
// UPDATE
questionnaireRouter.put("/:id",async (req,res)=>{
    var id = req.params.id
    var body = req.body
    var data = await questionnaireController.update(id,body,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})

export default questionnaireRouter


