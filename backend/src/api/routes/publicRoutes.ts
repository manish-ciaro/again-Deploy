import { Router } from "express";
import isEmpty from "../../utils/functions.js";
import passport from "../controllers/samlController.js";
import * as userController from "../controllers/userController.js";
import { Strategy as SamlStrategy } from 'passport-saml';
import assert from "assert";
import { compareSync } from "bcrypt";


const publicRouter = Router()
 
publicRouter.post('/createSuperAdmin', async(req,res)=>{
         var {username,email} = req.body
         assert(!(isEmpty(username,email)))
          var data = await userController.createSuperAdmin(username,email)
          data.status ? res.json(data) : res.status(404).json(data)
})

publicRouter.post('/sendToken',async(req,res)=>{
    var {username, email} = req.body 
    assert(!(isEmpty(username,email)))
    var data = await userController.sendToken(username,email)
    data.status ? res.json(data) : res.status(404).json(data)
 })


// for first time super Admin login api

function isEmail(email:string) {
    const Email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    return Email
}

publicRouter.post('/verifySuperAdminInitialCredentials',async(req,res)=>{
    var {username,token} = req.body 
    assert(!(isEmpty(username,token)))
    var data = await userController.verifyLink(username,token)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
 })

 publicRouter.post('/sendOTP',async(req,res)=>{
    var {username} = req.body 
    assert(!(isEmpty(username)))
    var data = await userController.sendOTPMail(username)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
 })

 publicRouter.post('/verifyOTP',async(req,res)=>{
    var {username, otp} = req.body 
    assert(!(isEmpty(username,otp)))
    var data = await userController.verifyMailOTP(username,otp);
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
 })

publicRouter.post('/setSuperAdminPassword',async(req,res)=>{ 
    var {username, password} = req.body
    assert(!(isEmpty(username, password)))
    var data = await userController.setPassword(username, password)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})


// super Admin forgot password process

publicRouter.post("/superAdminForgotPassword",async(req,res)=>{
    var {username} = req.body
    assert(!(isEmpty(username)))
    var data = await userController.superAdminForgotPassword(username)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})

publicRouter.post("/validatePasswordResetToken",async(req,res)=>{
    var {token} = req.body
    assert(!(isEmpty(token)))
    var data = await userController.verifyResetPasswordLink(token)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})

publicRouter.post("/superAdminResetPassword",async(req,res)=>{
    var {username, password}=req.body
    assert(!(isEmpty(username,password)))
    var data = await userController.superAdminResetPassword(username,password)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})

// for the employees

publicRouter.post('/createUser/:id',async(req,res)=>{
    var id = req.params.id
    const {email} = req.body
    const data = await userController.createUser(id,email)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})

publicRouter.post('/verifyUserInitialCredentials',async(req,res)=>{
    var {token, email}= req.body
    var data = await userController.validateAccessLink(token, email)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})

publicRouter.get('/getPasswordComplexity/:id',async(req,res)=>{
    var id =  req.params.id
    assert(!(isEmpty(id)))
    var data = await userController.passwordComplexity(id)
    data.status ? res.json(data) : res.status(404).json(data)
})

publicRouter.post('/setUserPassword',async(req,res)=>{
    var { email, password} = req.body
    assert(!(isEmpty(email, password)))
    var data = await userController.setUserPassword(email, password)
    data.status ? res.json(data) : res.status(404).json(data)
})

publicRouter.get('/getPassComplexity/:token',async(req,res)=>{
    var token = req.params.token
    console.log(token)
    assert(!(isEmpty(token)))
    var data = await userController.getPassComplexity(token)
    data.status ? res.json(data) : res.status(404).json(data)
})

// ******************************************************************************

publicRouter.post('/checkUsername',async(req,res)=>{
   var {username} = req.body
   assert(!(isEmpty(username))) 
   var data = await userController.checkUsername(username)
   data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})


publicRouter.post('/checkEmail',async(req,res)=>{
    var {email} = req.body
    assert(!(isEmpty(email)))
    var data = await userController.checkEmail(email)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)  
})


publicRouter.post('/login',async(req,res)=>{
    try{
        var {email,password,isSuperAdmin} = req.body
        if(!isSuperAdmin){
          var data = await userController.login(email, password)
          if (data.status) {
            if (!data.accessToken) {
                req.session.verified = true
                req.session.uId = data.uId

                // console.log(req)
                // console.log(req.session)
            }
            res.json(data)
        } else {
            res.status(404).json(data)
        }
        }else{
           var user = await userController.superAdminLogin(email, password)
           if(user.status){
            res.json(user)
           }else{
            res.status(user._errorCode || 404).json(user)
           }
           
        }
       
    }catch(error){
        res.sendStatus(404) 
    }
})


publicRouter.post('/forgotPassword', async (req, res) => {
    var email = req.body.email
    var data = await userController.forgotPassword(email)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})

publicRouter.post('/resetPassword', async (req, res) => {
    var { token,password } = req.body
    var data = await userController.resetPassword(token,password)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})

publicRouter.post('/refreshToken',async (req,res)=>{
    var {refToken} = req.body
    var data = await userController.updateRefToken(refToken)
    data.status ? res.json(data) : res.status(data._errorCode || 404).json(data)
})

publicRouter.post('/setupMfa', async (req, res) => {
    var { email, password } = req.body
    var data = await userController.getMfaSetupQrcode(email, password)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})


publicRouter.post('/verifyMfa', async (req, res) => {
    // res.header("Access-Control-Allow-Credentials", "true");
    // console.log(req)
    // console.log('Incoming headers:', req.headers);
    // console.log('Raw cookies:', req.headers.cookie);
    // console.log('Session ID from frontend:', req.cookies['connect.sid']);
    // console.log(req.session,"1")
    // console.log(req.session.verified)
    // console.log(req.session.uId)
    if(req.session.verified){  
        // console.log("hello") 
        var {token,email } = req.body
        console.log(token)
        var data = await userController.verifyMfa(token,email)
        if(data.status){
            req.session.verified = false
            res.json(data)
        }else{
            res.status(404).json(data)
        }
    }else{
   
        res.status(404).json({
            status: false,
            msg: "Not verified"
        })
    }
})

publicRouter.post('/verifyEmailMfa', async (req, res) => {
    if(req.session.verified){
        var { token,email} = req.body
        var data = await userController.verifyEmailMfa(token,email)
        if(data.status){
            req.session.verified = false
            res.json(data)
        }else{
            res.status(404).json(data)
        }
    }else{
        res.status(404).json({
            status: false,
            msg: "Not verified"
        })
    }
})

publicRouter.post('/sendEmailOtp', async (req, res) => {
    var { email } = req.body
    var data = await userController.sendEmailOtp(email)
    data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
})

publicRouter.get("/sso", (req, res, next) => {
    try {
        if (global.masterData.authSetup.sso) {
            next()
        } else {
            res.sendStatus(403)
        }
    } catch (error) {
        res.sendStatus(403)
    }
}, passport.authenticate('samlAuth'))

publicRouter.post("/sso/success",
    passport.authenticate('samlAuth', { failureRedirect: '/sso' }),
    async (req, res) => {
        const relayState = req.body.RelayState
        var data = await userController.ssoCheckNSaveUser(req.session.passport?.user.nameID)
        res.redirect(relayState)
        // res.redirect('http://192.168.0.170:3000/dashboard')
        // res.redirect('http://localhost:3000/dashboard')
        // data.status ? res.json(data) : res.status(404).json(data); // send status code acc. to data.status
    }
)

export default publicRouter



