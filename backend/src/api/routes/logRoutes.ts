import { Router } from "express";
import { logs, logs_policy } from "../controllers/logController.js";
import isEmpty from "../../utils/functions.js";
import { StringDictionary } from "../../@types/dicts.js";
const logRoutes = Router();

// CREATE

// RETRIVE
logRoutes.get("/",async (req,res)=>{
    var {page:_page,count:_count,sortByDate:_sortByDate} = req.query as StringDictionary
    try {
        if(isEmpty(_page,_count,_sortByDate)) return res.sendStatus(404)
        var page = parseInt(_page)
        var count = parseInt(_count)
        var sortByDate = parseInt(_sortByDate)
        var data = await logs(req.uId,page,count,sortByDate)
        data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
        
    } catch (error) {
        console.log(error)
        res.sendStatus(404)
    }
})

logRoutes.get("/policy/:id",async (req,res)=>{
    var id = req.params.id
    var data = await logs_policy(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})


// UPDATING


// DELETE

export default logRoutes ;
