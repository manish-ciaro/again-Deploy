import { Router, query } from "express";
import { getAllTemplates } from "../controllers/templatesController.js";
const templateRoutes = Router()

templateRoutes.get('/',async (req,res)=>{
    var page = parseInt(req.query.page?.toString()!)
    var count = parseInt(req.query.count?.toString()!)
    var data = await getAllTemplates(page,count)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})


export default templateRoutes
