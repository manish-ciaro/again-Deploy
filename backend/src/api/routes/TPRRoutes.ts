import { Router } from "express";
import * as TPRController from "../controllers/TPRController.js"
import { StringDictionary } from "../../@types/dicts.js";
import isEmpty from "../../utils/functions.js";
const TPRRouter = Router()

// ADD
TPRRouter.post("/",async (req,res)=>{
    var body = req.body
    var data = await TPRController.create(body,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})
// DELETE
TPRRouter.delete("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await TPRController.deleteById(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})
// RETRIVE
TPRRouter.get("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await TPRController.getById(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
    
})

TPRRouter.get("/",async (req,res)=>{
    var {page:_page,count:_count} = req.query as StringDictionary
    try {
        if(isEmpty(_page,_count)) return res.sendStatus(404)
        
        var page = parseInt(_page)
        var count = parseInt(_count)
        var data = await TPRController.getAll(page,count,req.uId)
        data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
    } catch (error) {
        console.log(error)
        res.sendStatus(404)
    }
})
// UPDATE
TPRRouter.put("/:id/ans",async (req,res)=>{
    var id = req.params.id
    var qna = req.body
    var data = await TPRController.updateAns(id,qna,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})

TPRRouter.put("/:id/approve",async (req,res)=>{
    var id = req.params.id
    var approve = req.body.approve
    var data = await TPRController.setApprove(id,approve,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})

export{
    TPRRouter
}


