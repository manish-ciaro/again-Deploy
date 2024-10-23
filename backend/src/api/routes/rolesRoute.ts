import { Router } from "express";
import * as rolesController from '../controllers/rolesController.js' 
import isEmpty from "../../utils/functions.js";
const rolesRoutes = Router();

// CREATE
rolesRoutes.post("/",async (req,res)=>{
    var body = req.body
    var data = await rolesController.create(body,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})

// RETRIVE
rolesRoutes.get('/',async (req,res)=>{
    var page = parseInt(req.query.page?.toString()!)
    var count = parseInt(req.query.count?.toString()!)
    var name = req.query.name
    
    if(isEmpty(page,count)){
        res.sendStatus(404)
    }else{
        var data = await rolesController.getAllRoles(page,count,name?.toString(),req.uId)
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
})


rolesRoutes.get('/count',async (req,res)=>{
    var data = await rolesController.getTotalRolesCount(req.uId)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

rolesRoutes.get('/:roleId',async (req,res)=>{
    var roleId = req.params.roleId
    var data = await rolesController.getRole(roleId,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})


// UPDATE
rolesRoutes.put('/:roleId',async (req,res)=>{
    var body = req.body
    var roleId = req.params.roleId
    if(isEmpty(body)){
        res.sendStatus(404)
    }else{
        var data = await rolesController.updateRole(roleId,body,req.uId)
        data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
})


// LINK
// DELETE
rolesRoutes.delete("/:id",async (req,res)=>{
    var id = req.params.id
    var data = await rolesController.deleteById(id,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})


export default rolesRoutes ;
