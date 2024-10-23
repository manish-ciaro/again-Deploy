import { Router } from "express";
import isEmpty from "../../utils/functions.js";
import * as userController from "../controllers/userController.js";
import { getAllNotifications } from "../controllers/notificationController.js";
const userRouter = Router()

// CREATE
userRouter.post('/invite', async (req, res) => {
    var { email } = req.body
    if (isEmpty(email)) {
        res.sendStatus(404)
    } else {
        var data = await userController.inviteUser(email, req.uId)
        data.status ? res.json(data) : res.status(404).json(data); 
    }
})


// RETRIVE
userRouter.get('/', async (req, res) => {
    var page = parseInt(req.query.page?.toString()!)
    var count = parseInt(req.query.count?.toString()!)
    var username = req.query.username
    if (isEmpty(page, count)) {
        res.sendStatus(404)
    } else {
        var data = await userController.getUsers(page, count, username?.toString(), req.uId)
        data.status ? res.json(data) : res.status(404).json(data); 
    }
})

userRouter.get("/profile", async (req, res) => {
    var data = await userController.getUser(req.uId, req.uId)
    data.status ? res.json(data) : res.status(404).json(data); 
})

userRouter.get("/notifications", async (req, res) => {
    var data = await getAllNotifications(req.uId)
    data.status ? res.json(data) : res.status(404).json(data); 
})

userRouter.get("/profile/:id", async (req, res) => {
    var data = await userController.getUser(req.params.id, req.uId)
    data.status ? res.json(data) : res.status(404).json(data); 
})

userRouter.get("/export/:type", async (req, res) => {
    var type = req.params.type
    var data = await userController.exportUsers(type, req.uId)
    if(data.status && data.contentType){
        res.setHeader('Content-Type', data.contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${data.filename}`);
        res.send(data.data)
    }else{
        res.status(404).json(data)
    }
})


// CHECK
userRouter.post('/acceptInvite', async (req, res) => {
    var { token, firstname, lastname, password } = req.body
    var data = await userController.saveUserByLink(token, firstname, lastname, password)
    data.status ? res.json(data) : res.status(404).json(data); 
})


// LINK
userRouter.put("/link/:userId/:roleId", async (req, res) => {
    var { userId, roleId } = req.params
    var data = await userController.linkRolesToUser(userId, roleId, req.uId)
    data.status ? res.json(data) : res.status(404).json(data); 
})

userRouter.get("/logout", async (req, res) => {
    res.send(req.uId)
})

// Update 
userRouter.put("/:userId", async (req, res) => {
    var userId = req.params.userId
    var { firstname,
        lastname,
        jobTitle,
        phone,
        mobilePhone,
        country,
        locale,
        active,
        image
     } = req.body

    var data = await userController.update(userId, {
        firstname,
        lastname,
        jobTitle,
        phone,
        mobilePhone,
        country,
        locale,
        active,
        image
    }, req.uId)

    data.status ? res.json(data) : res.status(404).json(data); 
})


// DELETE

userRouter.delete('/deleteBulk', async (req,res)=>{
    var {ids} = req.body
    var data = await userController.deleteBulkUser(ids,req.uId)
    data.status ? res.json(data) : res.status(404).json(data)
})

userRouter.delete('/:userId', async (req, res) => {
    var userId = req.params.userId
    var data = await userController.deleteUser(userId, req.uId)
    data.status ? res.json(data) : res.status(404).json(data) 
})


userRouter.put('/inactiveBulkUser',async(req,res)=>{
var {ids} = req.body
var data = await userController.inactiveBulkUser(ids, req.uId)
data.status ? res.json(data) : res.status(404).json(data)
})

userRouter.put('/activeBulkUser',async(req,res)=>{
var {ids} = req.body
var data = await userController.activeBulkUser(ids, req.uId)
data.status ? res.json(data) : res.status(404).json(data)
})

userRouter.put('/inactiveUser/:userId',async(req,res)=>{
    var userId = req.params.userId
    var data = await userController.inactiveUser(userId,req.uId)
    data.status ? res.json(data) : res.status(404).json(data)
})

userRouter.put('/activeUser/:userId',async(req,res)=>{
    var userId = req.params.userId
    var data = await userController.activeUser(userId, req.uId)
    data.status ? res.json(data) : res.status(404).json(data)
})

// CREATE DEMO
userRouter.post('/createUser', async (req, res) => {
    var data = await userController.saveUserDEMO(req.body)
    data.status ? res.json(data) : res.status(404).json(data); 
})


userRouter.post('/emailUpdateSA', async(req,res)=>{
    var {email, otp} = req.body
    var data = await userController.updateEmail(email, otp, req.uId)
    data.status ? res.json(data) : res.status(404).json(data)
})

userRouter.put('/updateSAEmailOTP',async(req,res)=>{
    var data = await userController.changeEmailOTP(req.uId)
    data.status ? res.json(data) : res.status(404).json(data)
})

userRouter.post('/SADetails',async(req, res)=>{
    var data = await userController.SADetails(req.uId)
    data.status ? res.json(data) : res.status(404).json(data)
})

userRouter.post('/changeUserPassword',async(req,res)=>{
    var {email, password} = req.body
    var data = await userController.changeUserPassword(req.uId,email,password)
    data.status ? res.json(data): res.status(404).json(data)
})



export default userRouter





