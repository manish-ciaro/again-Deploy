import linksModel from '../models/linksModel.js';
import userModel from '../models/userModel.js';
import bcrypt, { compareSync, hash } from 'bcrypt'
import crypto from 'crypto';
import { makeToken, getTokenData,setPasswordToken} from './sessionController.js';
import logsModel from '../models/logsModel.js'
import { LogType } from "../models/logsModel.js";
import roleModel from '../models/rolesModel.js' 
import masterRecordModel, { masterRecordInterface } from "../models/masterRecordModel.js";

import { sendMail } from './mailController.js';
import userStoredData from '../../@types/userStoredData.js';
import myResponse from '../../@types/response.js';
import { checkRolePermissions, isSuperAdmin } from '../../utils/roles.js';
import assert, { AssertionError } from 'assert';
import { trusted, Types } from 'mongoose';
import { generateRandomNumber } from '../../utils/functions.js';
import { exportPdfFromString } from '../../utils/pdfExport.js';
import qrcode from 'qrcode';
import { authenticator } from '@otplib/preset-default';
import mfaModel from '../models/mfaModel.js';
import optModel from '../models/optModel.js';
import superAdminModel from '../models/SuperAdminModel.js';
import superAdminToken from '../models/superAdminTokenModel.js';
import tokensModel from '../models/tokenLinksModel.js';
import userTokenModel from '../models/userTokenModel.js';


const _errorCode=500
const saltRounds = 10
const passwordExpiryDays = 60
const linkExpiryDays = 7
const refTokenExpiryDays = 7
const tokenExpiryDays = 2
const serverUrl = process.env.WEB_URL
const clientUrl = process.env.CLIENT_URL




interface ssoOutgoingDataInterface {
    password?: string,
    firstname: string,
    lastname: string,
    id: string,
    passExpiry?: boolean,
    role?: Types.ObjectId,
    access?:{}
}

interface updateUserDataInterface {
    firstname: string,
    lastname: string,
    jobTitle: string,
    phone: string,
    mobilePhone: string,
    country: string,
    locale: string,
    image: string,
    lastLogin?: Date,
    active?: boolean,
    ssoUser?: boolean,
}

async function addLog({objectType,objectId,userId,action,description}:LogType): Promise<Types.ObjectId|null> {
    try {
        // if(!masterData.log.category[objectType]) return null;
        const log = await logsModel.create({
            objectType,
            objectId: objectId ?? null, 
            userId:userId ?? null,
            action,
            description
        })
        return log.id
    } catch (error) {
        console.error("Error creating log:", error);
        return null
    }
}

const getUserRoleByEmail = async (email:string) => {
    try {
        const user = await userModel.findOne({ email });
        
        if (!user) {
            throw new Error("User not found");
        }

        const roleId = user.role;
    
        const role = await roleModel.findById(roleId);
        
        if (!role) {
            throw new Error("Role not found");
        }

        return role.name;
    } catch (error) {
        return null; 
    }
}


// CREATE
async function saveUser(email: string, firstname: string, lastname: string, password: string): Promise<myResponse> {
    try {
        var salt = bcrypt.genSaltSync(saltRounds);
        var hashedPassword = bcrypt.hashSync(password, salt);
        var passExpiry = new Date()
        passExpiry.setDate(passExpiry.getDate() + passwordExpiryDays)

        var user = await userModel.create({
            email,
            username: `${firstname.trim()} ${lastname.trim()}`,
            firstname,
            lastname,
            hashedPassword,
            passExpiry
        })
        return {
            status: true,
            msg: user.id
        }
    } catch (error) {
        return {
            status: false,
            msg: 'Bad'
        }
    }


}

async function ssoCheckNSaveUser(nameId: string | undefined): Promise<myResponse> {
    try {
        assert(nameId, "Name id not found in session")
        var user = await userModel.findOne({ username: nameId })
        if (!user) {
            // create new user
            // @ts-ignore
            var user = await userModel.create({
                email: nameId,
                firstname: nameId,
                lastname: nameId,
                ssoUser: true
            })
        }
        const roleId = user.role

        const role = await roleModel.findById(roleId)
        assert(role, 'Role not found')

        var userName = `${user.firstname} ${user.lastname}`
        var token = makeToken({ uId: user._id, name: userName })
        var data: ssoOutgoingDataInterface = {
            firstname: user.firstname,
            lastname: user.lastname,
            id: user.id,
            role: user.role,
            access:role,
        }

        return {
            status: true,
            accessToken: token,
            data
        }
    } catch (error) {
        console.log(error)
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }

    // check user
}

async function inviteUser(email: string, uId: string) {
    try {
        var auth = await checkRolePermissions(uId, [
            { userControl: { fullAccess: true } }
        ])
        assert(auth, "Auth Failed")

        var expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + linkExpiryDays)
        const link = await linksModel.create({
            email,
            created_by: uId,
            expiryDate
        })

        assert(link, "Can't create the link. Invaild data")


        const tok = makeToken({ id: link.id }, linkExpiryDays)
        await sendMail({
            to: email,
            subject: 'Mail for Invitation',
            text: `${serverUrl}/saveUserByLink/${tok}`
        })
        return {
            status: true,
            msg: 'Mail Send'
        }
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: 'Error'
        }
    }
}


async function getMfaSetupQrcode(email: string, password: string) {
    try {
        assert(global.masterData.authSetup.normalLogin.mfa._3dParty, "3rd Party MFA not allowed")

        var UserLog = global.masterData.log.category.userAuth

        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']

        var tmpUser = await checkUser(email, password)
        assert(tmpUser, "Auth failed")

        var mfa = await mfaModel.findOne({ userId: tmpUser.id })
        assert(mfa == null,"MFA is already setup")

        assert(!tmpUser.passExpiry, "Password expired")

        var secret = authenticator.generateSecret()
        var user = await userModel.findById(tmpUser.id);
        assert(user, "User not found");

        var email = user.email
        const role = await getUserRoleByEmail(email)
        assert(role, "role not found")


        const otpauth = authenticator.keyuri(user.email, global.masterData.OrgDetails.name, secret);
        var imageUrl = await qrcode.toDataURL(otpauth)


        var mfa = await mfaModel.findOne({ userId: user._id })
        if (mfa) {
            mfa.secret = secret
            await mfa.save()

            if(role==='admin'){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: user.id,
                    userId: user.id,
                    action: "verify",
                    description: "Multi-factor authentication has been successfully set up."
                })
            }
            
    
            if(UserLog && allowedRoles.includes(role)){
                await addLog({
                    objectType: "UserAuthentication",
                    objectId: user.id,
                    userId: user.id,
                    action: "verify",
                    description: "Multi-factor authentication has been successfully set up."
                })
            }

        } else {
            await mfaModel.create({ secret, userId: user._id })
        }
        
        return {
            status: true,
            data: imageUrl
        }
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: 'Error'
        }
    }
}

async function verifyMfa(token: string, email: string) {
    try {
        assert(global.masterData.authSetup.normalLogin.mfa._3dParty, "3rd Party MFA not allowed")
        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']
        var AdminLog = global.masterData.log.category.saAdminAct
        var UserLog = global.masterData.log.category.userAuth

        var user = await userModel.findOne({email})
        assert(user, "Auth failed")

        const roleId = user.role

        const role = await roleModel.findById(roleId)

        assert(role, 'Role not found')


        assert(user.passExpiry > Date.now(), "Password expired")


        var mfa = await mfaModel.findOne({ userId: user._id })
        assert(mfa, "MFA not setup")                  

        var valid = authenticator.verify({
            token,
            secret: mfa.secret!
        })

        console.log(mfa.secret!)

        if(!valid){
            if(role.name==='admin'){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: user.id,
                    userId: user.id,
                    action: "verify",
                    description: "Authenticator app OTP entered is incorrect."
                })
            }

            if(UserLog && allowedRoles.includes(role.name)){
                await addLog({
                    objectType: "UserAuthentication",
                    objectId:user.id,
                    userId:user.id,
                    action: "verify",
                    description: "Authenticator app OTP entered is incorrect."
                })
            }
        }

        assert(valid, "Invaild Auth")

        user.lastLogin = Date.now()
        await user.save()

        var accessToken = makeToken({ uId: user._id, name: `${user.firstname} ${user.lastname}` })

        if(role.name==='admin'){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: user.id,
                userId: user.id,
                action: "verify",
                description: "Authenticator app OTP verified successfully."
            })
        }

        if(UserLog && allowedRoles.includes(role.name)){
            await addLog({
                objectType: "UserAuthentication",
                objectId:user.id,
                userId:user.id,
                action: "verify",
                description: "Authenticator app OTP verified successfully."
            })
        }

        return {
            status: true,
            accessToken,
            data: {
                firstname: user.firstname,
                lastname: user.lastname,
                id: user.id,
                role: user.role,
                access:role,
            }
        }

    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: 'Error'
        }
    }
}

async function verifyEmailMfa(token: string, email: string) {
    try {
        // assert(global.masterData,"Global data is not loaded")
        assert(global.masterData.authSetup.normalLogin.mfa.email, "Email MFA not allowed")
        var UserLog = global.masterData.log.category.userAuth

        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']

        var user = await userModel.findOne({email})

        assert(user, "Auth failed")

        const roleId = user.role

        const role = await roleModel.findById(roleId)
        assert(role, 'Role not found')

        assert(user.passExpiry > Date.now(), "Password expired")


        var mfa = await optModel.findOne({ userId: user._id })
        assert(mfa, "MFA not setup")

        if (mfa.tries > 4) {
            await mfa.deleteOne({ _id: mfa._id })

            if(role.name==='admin'){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: mfa.id,
                    userId: user.id,
                    action: "verify",
                    description: "OTP expired due to too many failed attempts"
                })
            }

            if(UserLog && allowedRoles.includes(role.name)){
                await addLog({
                    objectType: "UserAuthentication",
                    objectId:mfa.id,
                    userId:user.id,
                    action: "verify",
                    description: "OTP expired due to too many failed attempts"
                })
            }

            return {
                status: false,
                msg: "OTP expired due to too many failed attempts",
            };
        }

         var valid = mfa.token === token.trim()
        if (valid) {
            await mfa.deleteOne({ _id: mfa._id })
            var datatoken = makeToken({ uId: user._id, name: `${user.firstname} ${user.lastname}` })

            user.lastLogin = Date.now()
            await user.save()

            if(role.name==='admin'){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: mfa.id,
                    userId: user.id,
                    action: "verify",
                    description: "Email MFA OTP verified successfully."
                })
            }
    
            if(UserLog && allowedRoles.includes(role.name)){
                await addLog({
                    objectType: "UserAuthentication",
                    objectId:mfa.id,
                    userId:user.id,
                    action: "verify",
                    description: "Email MFA OTP verified successfully."
                })
            }

            return {
                status: true,
                accessToken: datatoken,
                data: {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    id: user.id,
                    role: user.role,
                    access:role,
                }
            }

        } else {
            mfa.tries += 1
            await mfa.save()

            if(role.name==='admin'){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: mfa.id,
                    userId: user.id,
                    action: "verify",
                    description: "Email MFA OTP entered is incorrect."
                })
            }

            if(UserLog && allowedRoles.includes(role.name)){
                await addLog({
                    objectType: "UserAuthentication",
                    objectId:mfa.id,
                    userId:user.id,
                    action: "verify",
                    description: "Email MFA OTP entered is incorrect."
                })
            }
            
        }


        return {
            status: false,
            msg: "Invaild Auth"
        }
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: 'Error'
        }
    }
}

async function sendEmailOtp(email: string) {
    try {
        // assert(global.masterData,"Global data is not loaded")
        assert(global.masterData.authSetup.normalLogin.mfa.email, "Email MFA not allowed")
        assert(global.masterData.authSetup.normalLogin.enabled, "Login through password not enabled")

        var UserLog = global.masterData.log.category.userAuth

        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']

        var user = await userModel.findOne({ email })
        assert(user, "User not found")

        const role = await getUserRoleByEmail(email)
        assert(role, "role not found")

        var randNum = generateRandomNumber()
        console.log(randNum)

        await optModel.deleteMany({ userId: user._id })
       var otp= await optModel.create({ token: randNum, userId: user._id, tries: 0 })

        // var a = await sendMail({
        //     to: user.email,
        //     subject: 'Mail for OTP',
        //     text: `OTP: ${randNum}`
        // })


        var firstThreeLetter = user.email.slice(0,3)

        var Email = firstThreeLetter + '*'.repeat(user.email.length-3)

        if(role==='admin'){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: otp.id,
                userId: user.id,
                action: "create",
                description: "OTP has been sent to user's email."
            })
        }

        if(UserLog && allowedRoles.includes(role)){
            await addLog({
                objectType: "UserAuthentication",
                objectId:otp.id,
                userId:user.id,
                action: "create",
                description: "OTP has been sent to user's email."
            })
        }

        return {
            status: true,
            msg: "mail send",
            data:{
                email:Email
            }
        }
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        console.log(error)
        return {
            status: false,
            msg: 'Error'
        }
    }
}





// RETRIVE
async function getUsers(page = 1, count = 10, username: string = "", uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { userControl: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var users = await userModel.aggregate([
            { $match: { username: { $regex: username, $options: "i" } } },
            { $project: { email: 1, firstname: 1, lastname: 1, role: 1, active: 1, lastLogin: 1, jobTitle: 1 } },
            { $skip: (page - 1) * count },
            { $limit: count },
        ])
        var count = await userModel.countDocuments({})
        await userModel.populate(users, { path: "role", select: { name: 1 } })
        return {
            status: true,
            users,
            count
        }
    } catch (error) {
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error"
        }
    }
}

async function getUser(userId: string, uId: string): Promise<myResponse> {
    try {
        var user = await userModel.findById(userId).select({ prevPassword: 0, hashedPassword: 0 }).exec()
        assert(user, "User not found")

        var auth = await checkRolePermissions(uId, [
            { admin: true }
        ])
        if (!auth) var auth = uId === user._id.toString()

        assert(auth, "Auth failed")
        await user.populate("role", "name")

        return {
            status: true,
            user
        }

    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }
}

async function exportUsers(type: string, uId: string): Promise<myResponse> {
    try {
        // auth
        var auth = await checkRolePermissions(uId, [
            { userControl: { view: true } }
        ])
        assert(auth, "Auth failed")

        var users = await userModel.find({}).populate("role", "name")
        var data = "email,firstname,lastname,jobTitle,country,locale,lastLogin,role,active";
        users.forEach(user => {
            var roleName = user.role as unknown as { [key: string]: number }
            data += `\n${user.email},${user.firstname},${user.lastname},${user.jobTitle},${user.country},${user.locale},${user.lastLogin || ""},${roleName ? roleName.name : ""},${user.active}`
        })

        switch (type) {
            case "csv":
                return {
                    status: true,
                    data,
                    contentType: "text/csv",
                    filename: "users.csv"
                }
            case "pdf":
                var data2 = await exportPdfFromString(data)
                assert(data2, "Can't convert to pdf")
                return {
                    status: true,
                    data: Buffer.from(data2),
                    contentType: "application/pdf",
                    filename: "users.pdf"
                }
            default:
                return {
                    status: false,
                    msg: "Unsupported format"
                }
        }

    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        console.log(error)
        return {
            status: false,
            msg: "Error"
        }
    }
}

async function getTotalUsersCount(uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { userControl: { view: true } }
        ])
        assert(auth, "Auth Failed")

        var count = await userModel.countDocuments({})
        return {
            status: true,
            count
        }
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }
}



// UPDATE
async function changePasswordByEmail(email: string, oldPassword: string, newPassword: string) {
    var user = await userModel.findOne({ email })
    if (user?.ssoUser) return null
    if (user != null) {
        var verify = bcrypt.compareSync(oldPassword, user.hashedPassword!)
        if (verify) {
            if (user.prevPassword.includes(newPassword)) {
                return {
                    name: null,
                    msg: "This is a prev pass"
                }
            }
            if (user.prevPassword.length >= 3) {
                user.prevPassword.shift()
            }
            user.prevPassword.push(oldPassword)

            var salt = bcrypt.genSaltSync(saltRounds);
            var hashedPassword = bcrypt.hashSync(newPassword, salt);
            var passExpiry = new Date()
            passExpiry.setDate(passExpiry.getDate() + passwordExpiryDays)

            user.passExpiry = passExpiry.getTime()
            user.hashedPassword = hashedPassword

            await user.save()
            return {
                firstname: user.firstname,
                lastname: user.lastname,
                id: user.id,
                msg: "Password is changed",
                role: user.role
            }
        }
    }
    return null
}

async function update(userId: string, body: updateUserDataInterface, uId: string): Promise<myResponse> {
    try {
        var auth1 = await checkRolePermissions(uId, [
            { userControl: { fullAccess: true } }
        ])
        if (!auth1) {
            delete body.active
            delete body.ssoUser
        }
        var auth2 = uId === userId

        assert(auth1 || auth2, "Auth Failed")

        var isSsoUser = (await userModel.findById(userId).select({ ssoUser: 1 }))?.ssoUser
        assert(!isSsoUser, "SSO users are not allowed to change their profiles")


        var update = await userModel.updateOne(
            { _id: new Types.ObjectId(userId) },
            body,
            { runValidators: true }
        )
        assert(update.modifiedCount, "Nothing to update")
        return {
            status: true,
            msg: "User details changed",
        }


    } catch (error) {
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }

}

async function forgotPassword(email: string): Promise<myResponse> {
    try {
        assert(global.masterData.authSetup.normalLogin, "Password login is not allowed")
        var UserLog = global.masterData.log.category.userAuth

        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']

        var exists = await userModel.findOne({ email })
        
        assert(exists, "User not found")

        const role = await getUserRoleByEmail(email)
        assert(role, "role not found")

         await userTokenModel.deleteMany({email})
        
        var tokenExpiry = new  Date()
        tokenExpiry.setDate(tokenExpiry.getDate()+tokenExpiryDays) 


        const tok = crypto.randomBytes(30).toString('hex')

        await userTokenModel.create({
            email,
            token:tok,
            created_by:exists._id,
            tokenExpiry
        })

        console.log(tok)

       await sendMail({
            to: email,
            subject: 'Mail for forget password',
            text: `${clientUrl}/resetPassword?token=${tok}`
        })

        // console.log(a)

        if(role==='admin'){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: exists.id,
                userId: exists.id,
                action: "password_recovery",
                description: "A password reset link has been sent to the user's email."
            })
        }

        if(UserLog && allowedRoles.includes(role)){
            await addLog({
                objectType: "UserAuthentication",
                objectId:exists.id,
                userId:exists.id,
                action: "password_recovery",
                description: "A password reset link has been sent to the user's email."
            })
        }

       
        return {
            status: true,
            msg: "A password reset link has been sent to your email."
        }

    } catch (error) {
    
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error",
            _errorCode

        }
    }
}

async function updateRefToken(tok: string): Promise<myResponse> {
    try {
        var data = await getTokenData(tok) as userStoredData
        assert(data,"Invaild token")
        var user = await userModel.findById(data.uId)
        assert(user,"User not found")
        var accessToken = makeToken({ uId: user.id, name: `${user.firstname} ${user.lastname}` })
        var refToken = makeToken({ uId: user.id },refTokenExpiryDays)

        return{
            status: true,
            refToken,
            accessToken
        }
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error",
            _errorCode
        }
    }
}

// ******************************************************************************



// create a new user super admin
async function createSuperAdmin(username: string, email: string){
    try {
        var userExists = await superAdminModel.findOne({username})

        assert(!userExists,'super Admin with this name already exists')
        
        const role = await roleModel.create({
            name: username,
            userControl: { fullAccess: true, view: true },
            onboarding: { fullAccess: true, view: true },
            control: { fullAccess: true, view: true },
            policy: { edit: true, fullAccess: true, view: true },
            procedure: { edit: true, fullAccess: true, view: true },
            risk: { edit: true, fullAccess: true, view: true },
            training: { edit: true, fullAccess: true, view: true },
            TPRA: { edit: true, fullAccess: true, view: true },
            evidences: { edit: true, fullAccess: true, view: true },
            audit: { edit: true, fullAccess: true, view: true },
            superAdmin: true,
            admin: true
        })
        

        var data = await superAdminModel.create({
            username,
            email,
            role: role._id
        })

 
        var tokenExpiry = new  Date()
        tokenExpiry.setDate(tokenExpiry.getDate()+tokenExpiryDays) 

        const tok = crypto.randomBytes(30).toString('hex')

         await tokensModel.create({
            username,
            token:tok,
            created_by:data._id,
            expiryDate:tokenExpiry
        })

        console.log(tok)   //console is here


        await sendMail({
            to: email,
            subject: 'user created',
            text: `username:${username} ${clientUrl}/login/sa${tok}`
        })

        return {
            status: true,
            msg: 'User created successfully',
        }
    } catch (error:any) {
        return {
            status: false,
            msg: 'Error creating super admin',
        };
    }
  }

  async function verifyLink(username: string, token: string){
    try{
        var user = await tokensModel.findOne({username })

        assert(user,"Invalid username")

        var data = await superAdminModel.findOne({username})

        assert(data,"Invalid username")

        const now = new Date();
        if (now > user.expiryDate) {
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId:user.id,
                    userId: data.id,
                    action: "login",
                    description: "Password setting link has expired for the super admin."
                })
            return { status: false, msg: 'link has expired. Please contact to the CIARO team' };
        }

        var valid = user.token === token

        if(!valid){
            return {
                status:false,
                msg:"Invalid link"
            }
        }
        
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId:user.id,
                userId: data.id,
                action: "login",
                description: "Password setting link has been successfully verified for the super admin."
            })


        return {
            status: true,
            msg: "link and username verified",
        }
    }catch(error){
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }

        return {
            status: false,
            msg: "Error link not found ",
            _errorCode
        }
    }
  }

  async function sendOTPMail(username: string){
    try{  
            var user = await superAdminModel.findOne({username})
      
            assert(user,"user not found")

            if(!user.email){
                return {
                    status:false,
                    msg:"email not found"
                }
            }

            var randNum = generateRandomNumber()

            await optModel.deleteMany({ userId: user._id })

            var otp = await optModel.create({ token: randNum, userId: user._id, tries: 0 })  

            var firstThreeLetter = user.email.slice(0,3)

            var Email = firstThreeLetter + '*'.repeat(user.email.length-3)


            console.log(randNum)  

             await sendMail({
                to: user.email,
                subject: 'Mail for OTP',
                text: `OTP: ${randNum}`
            }) 


                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: otp.id,
                    userId: user.id,
                    action: "login",
                    description: "One-Time Password (OTP) has been sent to the user's email address."
                })

            
          return {
            status: true,
            msg: "OTP is send on your email",
            data:{
                email:Email
            }
        }
    }catch(error){
        if (error instanceof assert.AssertionError) {
            return {
                status: false,
                msg: error.message,
                
            }
        }

        return {
            status: false,
            msg: "Error",
            _errorCode:500
        } 
    }
}

async function verifyMailOTP(username: string,token:string){
    try{
        var user = await superAdminModel.findOne({username})

        var AdminLog = global.masterData.log.category.saAdminAct
      
        if(!user){
         return {status:false, msg:"Invalid username"}
        }

        var data = await optModel.findOne({ userId: user._id })

        if(!data){
            return {status:false, msg:"OTP not found"}
        }
    
        if(data.tries>=3){
            await optModel.deleteOne({ _id: data._id })
            if(AdminLog){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: data.id,
                    userId: user.id,
                    action: "login",
                    description: "One-Time Password (OTP) has expired due to too many failed verification attempts."
                })
            }
            return {
                status: false,
                msg: "OTP expired due to too many failed attempts",
            }
        }

        var valid = token === data.token

        if(valid){
            await optModel.deleteOne({ _id: data._id })

            if(AdminLog){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: data.id,
                    userId: user.id,
                    action: "login",
                    description: "One-Time Password (OTP) has been successfully verified."
                })
            }

            return {
                status: true,
                msg: "OTP verified"
            }
        }else{
           var OTPtry= data.tries += 1
            await optModel.findByIdAndUpdate({_id:data.id},{tries:OTPtry})     
        }

        return {
            status: false,
            msg: "Invalid OTP"
        }

    }catch(error){
        if (error instanceof assert.AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }

        return {
            status: false,
            msg: "Error",
            _errorCode
        } 
    }
}


function validatePassword(password:string) {
    const errors = [];
    if (password.length <12 ) errors.push("Password must be at least 12 characters long.");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter.");
    if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter.");
    if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number.");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must contain at least one special character.");
    if (/\s/.test(password)) errors.push("Password must not contain spaces.");

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

//   setup the password 
 async function setPassword(username:string, password:string) {
    try{

        var data = await superAdminModel.findOne({username})

        if (!data) {
            return { status: false, msg: 'Invalid username' }
        }

        const { valid, errors } = validatePassword(password)

        if (!valid) {
        return {
        status: false,
        msg: errors.join('\n')
        }
        }

        var pass = await bcrypt.hash(password, saltRounds)

        await superAdminModel.findByIdAndUpdate(data._id,{hashedPassword:pass})

        await tokensModel.findOneAndDelete({ username })

        
         await sendMail({
            to: data.email,
            subject: 'Your first time password has been set',
            text: `Now you can proceed to login with the new password`
        })

        
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: data.id,
                userId: data.id,
                action: "create",
                description: "First-time password has been successfully set"
            })

        return{
            status:true,
            msg:"First-time password has been successfully set"
           }

    }catch (error) {
        console.log(error)
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            };
        }

        return {
            status: false,
            msg: "Error",
            _errorCode
        }
    }  
 }

// send token
async function sendToken(username: string, email:string) {
    try{
     var data = await superAdminToken.findOne({username})

     if(!data){
        return {status:false, msg:'user not found'};
     }

    var token = setPasswordToken({ uId: data._id.toString() }) 

     var Expiry = new Date();
        Expiry.setDate(Expiry.getDate() + tokenExpiryDays);

     await superAdminToken.findByIdAndUpdate(data._id,{token,tokenExpiry:Expiry})


     // await sendMail({
        //     to: email,
        //     subject: 'New url for set password',
        //     text: `${serverUrl}/superAdminLogin/${resetToken}`
        // })

     return {
        status: true,
        msg: "New token send on the users mail"
    };

    }catch(error){
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            };
        }

        return {
            status: false,
            msg: "Error",
            _errorCode
        };
    }
}




// reset superadmin password 

async function superAdminResetPassword(username: string, password: string): Promise<myResponse>  {
    try {
        var superAdmin = await superAdminModel.findOne({ username})

        var AdminLog = global.masterData.log.category.saAdminAct
      

        if (!superAdmin) {
            return { status: false, msg: "username not found" };
        }

        const { valid, errors } = validatePassword(password)

        if (!valid) {
        return {
        status: false,
        msg: errors.join('\n')
        }
        }

        var isMatchCurrent = await bcrypt.compare(password, superAdmin.hashedPassword);
        if (isMatchCurrent) {

            if(AdminLog){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: superAdmin.id,
                    userId: superAdmin.id,
                    action: "update",
                    description: "New password cannot be the same as the current password"
                })
            }
            return { status: false, msg: "New password cannot be the same as the current password" };
        }

        for (const prevPassword of superAdmin.prevPassword) {
            const isMatchPrev = await bcrypt.compare(password, prevPassword);
            if (isMatchPrev) {

                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: superAdmin.id,
                    userId: superAdmin.id,
                    action: "update",
                    description: "You have used this password previously. Please use a different password."
                })

                return { status: false, msg: "You have used this password previously. Please use a different password." };
            }
        }
         
        var hashedPassword = await bcrypt.hash(password, saltRounds);

        var  passwordExpires = new  Date();
        passwordExpires.setDate( passwordExpires.getDate()+passwordExpiryDays)

       await superAdminModel.updateOne(
            { _id: superAdmin._id },
            {
                $set: { hashedPassword: hashedPassword, passExpiry: passwordExpires },
                $push: { prevPassword: superAdmin.hashedPassword }
            }
        )


      await sendMail({
            to: superAdmin.email,
            subject:`password changed`,
            text: `your password has been changed`
        })

        await addLog({
            objectType: "superAdmin_Admin_Activity",
            objectId: superAdmin.id,
            userId: superAdmin.id,
            action: "update",
            description: "Password has been changed successfully."
        })

        await tokensModel.findOneAndDelete({ username })
        
        return {
            status: true,
            msg: "Password reset successfully"
        }
        
    } catch (error) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            };
        }

        return {
            status: false,
            msg: "Error",
        }
    }
}

// forgot password
async function superAdminForgotPassword(username:string) {
    try {
        var AdminLog = global.masterData.log.category.saAdminAct
        var data = await superAdminModel.findOne({ username })
       
        if(!data){
        return {status:false, msg:'Incorrect username'}
       }

        if(data.isFirstLogin){
            return {
                status: false,
                msg: "Contact to the CIARO team for password recovery"
            }  
        }

        await tokensModel.deleteMany({username})

        if(!data.email){
            return {status:false, msg:"email not found"}
        }

        var tokenExpiry = new  Date()
        tokenExpiry.setDate(tokenExpiry.getDate()+tokenExpiryDays) 

        const tok = crypto.randomBytes(30).toString('hex')

       var link=  await tokensModel.create({
            username,
            token:tok,
            created_by:data._id,
            expiryDate:tokenExpiry
        })


        await sendMail({
            to: data.email,
            subject: 'Mail for forgot password',
            text: `${clientUrl}/verify_otp/sa${tok}`
        })

        if(AdminLog){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: link.id,
                userId:data.id,
                action: "password_recovery",
                description: "Password recovery link has been sent to the user's email address."
            })
        }
       
          return {
              status: true,
              msg: "Password recovery link send on your email"
          }
           
    } catch (error) {
        
        if (error instanceof assert.AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }

        return {
            status: false,
            msg: "Error",
            _errorCode
        }
    }
}

async function verifyResetPasswordLink(token: string){
    try{

        var AdminLog = global.masterData.log.category.saAdminAct
      
        var data = await tokensModel.findOne({token})
        assert(data,"Invalid Link")

            if ((data.expiryDate && Date.now() > data.expiryDate.getTime())) {
                await tokensModel.deleteMany({ _id: data._id })
                return { status: false, msg: 'link expired'}
            }
        
        var user = await superAdminModel.findOne({username:data.username})
        assert(user,"user not found")
        
        var firstThreeLetter = user.email.slice(0,3)

        var Email = firstThreeLetter + '*'.repeat(user.email.length-3)
        

            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: data.id,
                userId: user.id,
                action: "password_recovery",
                description: "Password recovery link has been successfully verified."
            })
       

        return {
            status: true,
            msg: "Link verified and OTP send on your email",
            data:{
                username:user.username,
                email:Email
            }
        }

    }catch(error){
        if (error instanceof assert.AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }

        return {
            status: false,
            msg: "Error",
            _errorCode
        }
    }
}



// create user
async function createUser(orgId:string,email:string) {
    try {
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return { status: false, msg: "User with this email already exists" }
        }

        const data= await userModel.create({email, organization: new Types.ObjectId(orgId)})

        var tokenExpiry = new  Date()
        tokenExpiry.setDate(tokenExpiry.getDate()+tokenExpiryDays) 

        const tok = crypto.randomBytes(30).toString('hex')

         await userTokenModel.create({
            email,
            token:tok,
            created_by:data._id,
            tokenExpiry
        })

        console.log(tok)

        await sendMail({
            to: email,
            subject: 'user created',
            text: `email:${email} ${clientUrl}/login?token=${tok}`
        })

        return {
            status: true,
            msg: 'User created successfully'
        }
    } catch (error:any) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }
        console.log(error)
        return {
            status: false,
            msg: 'Error',
            _errorCode
        };
    } 
}

async function validateAccessLink(token:string,email:string){
   try{
      
    var UserLog = global.masterData.log.category.saAdminAct

    const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']

    var user = await userModel.findOne({email})
    assert(user,"user not found")

    const role = await getUserRoleByEmail(email)
    assert(role, "role not found")

    var data = await userTokenModel.findOne({email})
    assert(data,"link not found")

    var orgId = user.organization;
        assert(orgId, "Organization not associated with the user")
   
    var valid = token===data.token

    if(!valid){
        return {
            status:false,
            msg:"Invalid link"
        }
    }

    const now = new Date();
    if (now > data.tokenExpiry) {
        return { status: false, msg: 'Link expired. Please contact the CIARO team' };
    }

    if(UserLog && allowedRoles.includes(role)){
        await addLog({
            objectType: "UserAuthentication",
            objectId:data.id,
            userId:user.id,
            action: "verify",
            description: "Email and verification link have been successfully verified."
        })
    }

    if(role==='admin'){
        await addLog({
            objectType: "superAdmin_Admin_Activity",
            objectId: data.id,
            userId:user.id,
            action: "verify",
            description: "Email and verification link have been successfully verified."
        })
    }

    return {
        status: true,
        msg: "Email and verification link have been successfully verified.",
        organizationId: orgId.toString() 
    }
   }catch (error) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }

        return {
            status: false,
            msg: "Error ",
            _errorCode
        }
    }  
}

function validatePasswordComplexity(password:string, complexitySettings:any) {
    const messages: any = {};

    if (password.length < complexitySettings.passwordMinLenght) {
        messages.passwordMinLength = `Password must be at least ${complexitySettings.passwordMinLenght} characters long.`;
    }

    if (password.length > complexitySettings.passwordMaxLenght) {
        messages.passwordMaxLength = `Password must not exceed ${complexitySettings.passwordMaxLenght} characters.`;
    }

    if (complexitySettings.includeUppercase && !/[A-Z]/.test(password)) {
        messages.includeUppercase = "Password must include at least one uppercase letter.";
    }

    if (complexitySettings.includeLowercase && !/[a-z]/.test(password)) {
        messages.includeLowercase = "Password must include at least one lowercase letter.";
    }

    if (complexitySettings.includeNumber && !/\d/.test(password)) {
        messages.includeNumber = "Password must include at least one number.";
    }

    if (complexitySettings.includeSpecialCharacter && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        messages.includeSpecialCharacter = "Password must include at least one special character.";
    }
  
    return messages
  }

//   create api for the fetch the password policy 

async function passwordComplexity(orgId:string) {
    try{
        var orgExists = await masterRecordModel.findById(orgId)
        assert(orgExists,"organization not found")

        if(orgExists)
        {
        var passwordComplexity = orgExists.authSetup.normalLogin.complexity

        return {
            status: true,
            msg: "password policy retrieved",
            passwordComplexity 
        }
       }
        return {
            status:false,
            msg: "organization not found",
        }

    }catch(error){
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            };
        }

        return {
            status: false,
            msg: "Error",
        }
    }
    
}

async function getPassComplexity(tokenInput:string) {
    try{
        var data = await userTokenModel.findOne({token:tokenInput})

        assert(data,"token not found")

        var user = await userModel.findOne({email:data.email})

        assert(user,"user not found")


        var orgId = user.organization?.toString()

        var orgExists = await masterRecordModel.findById(orgId)

        assert(orgExists,"organization not found")

        if(orgExists)
            {
            var passwordComplexity = orgExists.authSetup.normalLogin.complexity
    
            return {
                status: true,
                msg: "password policy retrieved",
                passwordComplexity 
            }
           }

        return {
            status:false,
            msg: "organization not found",
        }
    }catch(error){
        console.log(error)
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            };
        }

        return {
            status: false,
            msg: "Error",
        }
    }
}

async function setUserPassword(email:string, password:string) {
    try{
        var user = await userModel.findOne({email})

        var AdminLog = global.masterData.log.category.saAdminAct
      
        var UserLog = global.masterData.log.category.userAuth

        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']
     
        const role = await getUserRoleByEmail(email)
        assert(role, "role not found")

        assert(user,"user not found")   
        
        var orgId = user.organization?.toString()
        assert(orgId, "Organization not associated with the user")


        var orgExists = await masterRecordModel.findById(orgId)
        assert(orgExists,"Organization not found")

        const messages: any = {}

        var complexityCheck = orgExists.authSetup.normalLogin.complexity

        if (password.length < complexityCheck.passwordMinLength) {
            messages.passwordMinLength = complexityCheck.passwordMinLength
        }

        if (password.length > complexityCheck.passwordMaxLength) {
            messages.passwordMaxLength = complexityCheck.passwordMaxLength
        }
        
        if (complexityCheck.includeUppercase && !/[A-Z]/.test(password)) {
            messages.includeUppercase = complexityCheck.includeUppercase 
        }

         if (complexityCheck.includeLowercase && !/[a-z]/.test(password)) {
            messages.includeLowercase = complexityCheck.includeLowercase
        }

         if (complexityCheck.includeNumber && !/\d/.test(password)) {
            messages.includeNumber = complexityCheck.includeNumber
        }

        
        if (complexityCheck.includeSpecialCharacter && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            messages.includeSpecialCharacter = complexityCheck.includeSpecialCharacter
        }

        if(Object.keys(messages).length> 0){
            return {
                status: false,
                msg: 'Password validation failed',
                messages 
            }
        }

        var pass = await bcrypt.hash(password, saltRounds);
    
     
        var PasswordExpires = new Date(Date.now() + passwordExpiryDays * 24 * 60 * 60 * 1000).getTime();


        await userModel.findByIdAndUpdate(user._id,{hashedPassword:pass,passExpiry:PasswordExpires,isFirstLogin:false})

        var data = await userTokenModel.findOne({email})

        assert(data,"email not matched") 

        await userTokenModel.deleteOne({ _id: data._id })

           await sendMail({
            to: email,
            subject: 'set password',
            text: `Your first time password has been set Now you can proceed to login with the new password`
        })

        if(role==='admin'){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: user.id,
                userId: user.id,
                action: "create",
                description: "The first-time password has been successfully set."
            })
        }
        

        if(UserLog && allowedRoles.includes(role)){
            await addLog({
                objectType: "UserAuthentication",
                objectId: user.id,
                userId: user.id,
                action: "create",
                description: "The first-time password has been successfully set."
            })
        }

           return{
            status:true,
            msg:"first time password has been set"
           }

       
    }catch (error) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            };
        }

        return {
            status: false,
            msg: "Error",
        };
    }  
 }




// **********************************************************************  //



// DELETE

// CHECK

async function checkUsername(username:string):Promise<myResponse> {
    try{
        var data = await superAdminModel.findOne({username})
       

        assert(data,"Username does not exists")

            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: data.id,
                userId:data.id,
                action: "login",
                description: "The username has been successfully verified."
            })

        return {
            status: true,
            msg: "username verified",
            data:{
                name: data.firstname,
                isSuperAdmin:true
            } 
        }

    }catch(error){
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error"
        }
    }
}

async function checkEmail(email:string):Promise<myResponse> {
    try{
        assert(global.masterData.authSetup.normalLogin.enabled, "Login through password not enabled")

        var AdminLog = global.masterData.log.category.saAdminAct
        var UserLog = global.masterData.log.category.userAuth

        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']

        var userExists = await userModel.findOne({email})
        assert(userExists,"user not found")

        const roleExists = await getUserRoleByEmail(email)
        assert(roleExists, "role not found")
         

        const roleId = userExists.role
        const role = await roleModel.findById(roleId)
        if(role?.superAdmin){
           return {status:false, msg:"Email login not allowed enter your valid username"}
        }

        if(AdminLog && roleExists==='admin'){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: userExists.id,
                userId: userExists.id,
                action: "login",
                description: "The email has been successfully verified."
            })
        }
        

        if(UserLog && allowedRoles.includes(roleExists)){
            await addLog({
                objectType: "UserAuthentication",
                objectId: userExists.id,
                userId: userExists.id,
                action: "login",
                description: "The email has been successfully verified."
            })
        }

        return {
            status: true,
            msg: "email verified",
            data:{
                name:userExists.firstname,
                isSuperAdmin:false
            }
        }
    }catch(error){
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error",
            _errorCode
        }
    }
}

async function superAdminLogin(email: string, password: string){
    try{
        var username = email
       
        var user = await superAdminModel.findOne({username})
      
        assert(user, 'User not found')

        var isMatch=  await bcrypt.compare(password, user.hashedPassword)
        if(!isMatch){
            await addLog({
                objectType: "user",
                objectId: user.id,
                userId: user.id,
                action: "login",
                description: "The password entered is incorrect."
            })
            assert(isMatch,"Incorrect password.")
        }
        

        var accessToken = makeToken({ uId: user.id, name: `${user.firstname} ${user.lastname}` })

        const roleId = user.role

        const role = await roleModel.findById(roleId)
        assert(role, 'Role not found')

        if(role?.superAdmin){
            if(user.isFirstLogin)
                {
                    await userModel.updateOne(
                        { _id: user.id },
                        {
                            $set: {
                                lastLogin: Date.now()
                            }
                        }
                    )
                    await addLog({
                        objectType: "superAdmin_Admin_Activity",
                        objectId: user.id,
                        userId: user.id,
                        action: "login",
                        description: "Super Admin has successfully logged in for the first time."
                    })

                    return {
                        status:true,
                         msg:'login successfull',
                         accessToken,isFirstLogin:true,
                        data:{
                            firstname: user.firstname,
                            lastname: user.lastname,
                            id: user.id,
                            image: user.image,
                            role: user.role,
                            access:role,
                        }
                    }
                }
                else{
                    await userModel.updateOne(
                        { _id: user.id },
                        {
                            $set: {
                                lastLogin: Date.now()
                            }
                        }
                    )
        
                    await addLog({
                        objectType: "superAdmin_Admin_Activity",
                        objectId: user.id,
                        userId: user.id,
                        action: "login",
                        description: "Super Admin has successfully logged in"
                    })
                    return {
                        status: true,
                        msg: 'User login successfull',
                        accessToken ,isFirstLogin:false,
                        data:{
                            firstname: user.firstname,
                            lastname: user.lastname,
                            id: user.id,
                            role: user.role,
                            access:role,
                            image: user.image
                        }
                    }
                }
        }else{
            return {
                status:false,
                msg:"Not a super admin"
            }
        }
    }catch(error){
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error",
            _errorCode
        }
    }
    
}


async function login(email: string, password: string): Promise<myResponse> {
    try {
        assert(global.masterData.authSetup.normalLogin.enabled, "Login through password not enabled")

        var AdminLog = global.masterData.log.category.saAdminAct
      
        var UserLog = global.masterData.log.category.userAuth

        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']

        var userExists = await userModel.findOne({email})
        assert(userExists,"user not found")

        const role = await getUserRoleByEmail(email)
        assert(role, "role not found")


        var data = await checkUser(email, password)

        if(!data){
            if(AdminLog && role==='admin'){
                console.log("log")
                  await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: userExists.id,
                    userId: userExists.id,
                    action: "login",
                    description: "The password entered is incorrect."
                })

            }

            if(UserLog && allowedRoles.includes(role)){
                await addLog({
                    objectType: "UserAuthentication",
                    objectId:userExists.id,
                    userId:userExists.id,
                    action: "login",
                    description: "The password entered is incorrect."
                })
            }
        }

        assert(data, "Password incorrect")

        assert(!data.passExpiry, "Password expired")

    
        var token = makeToken({ uId: data.id, name: `${data.firstname} ${data.lastname}` })
        var refToken = makeToken({ uId: data.id },refTokenExpiryDays)

        if(global.masterData.authSetup.normalLogin.mfa.enabled){
            var emailMfa = true
            const authMfa= global.masterData.authSetup.normalLogin.mfa._3dParty

            if(AdminLog && role==='admin'){
                    await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: data.id,
                    userId: data.id,
                    action: "login",
                    description: "The email and password have been successfully verified."
                })
            }
            

            if(UserLog && allowedRoles.includes(role)){
                    await addLog({
                    objectType: "UserAuthentication",
                    objectId: data.id,
                    userId: data.id,
                    action: "login",
                    description: "The email and password have been successfully verified."
                })
            }

            if(userExists.isFirstLogin && !userExists.is3rdPartyMFAConfigured && authMfa){
                return{
                    status:true,
                    msg:"MFA also required",
                    uId:data.id,
                    req3rdPartyMFA:true,
                    data:{
                        emailMfa,
                        _3dParty: authMfa
                    }
                }
            }
            
            return{
                status:true,
                msg:"MFA also required",
                uId:data.id,
                data:{
                    emailMfa,
                    _3dParty: authMfa
                }
            }
        }


        await userModel.updateOne(
            { _id: new Types.ObjectId(data.id) },
            {
                $set: {
                    lastLogin: Date.now()
                }
            }
        )

        if(AdminLog && role==='admin'){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: data.id,
                userId: data.id,
                action: "login",
                description: "Admin has logged in successfully."
            })
        }
        

        if(UserLog && allowedRoles.includes(role)){
            await addLog({
                objectType: "UserAuthentication",
                objectId: data.id,
                userId: data.id,
                action: "login",
                description: "User has logged in successfully."
            })
        }
    

        return {
            status: true,
            accessToken: token,
            refToken,
            data
        }

    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error"
        }
    }
}


async function checkUser(email: string, password: string) {
    try {
        var user = await userModel.findOne({ email })
        await user?.populate("role","name")
        assert(user)

        const roleId = user.role

        const role = await roleModel.findById(roleId)
        assert(role, 'Role not found')
        
        var verify = bcrypt.compareSync(password, user.hashedPassword!)
        if (verify) {
            if (user.passExpiry < Date.now()) return {
                passExpiry: true
            }

            return {
                firstname: user.firstname,
                lastname: user.lastname,
                id: user.id,
                passExpiry: false,
                role: user.role,
                access:role,
                image: user.image
            }
        }
    } catch (error) {
        return null
    }
}

async function saveUserByLink(tok: string, firstname: string, lastname: string, password: string) {
    try {
        var data = await getTokenData(tok) as userStoredData

        var linkData = await linksModel.findById(data.id)
        assert(linkData, 'Link Expired')


        if (linkData.expiryDate.getTime() < Date.now()) {
            await linksModel.deleteOne({ _id: linkData._id })
            assert(false, 'Link Expired')
        }

        var userData = await saveUser(linkData.email, firstname, lastname, password)
        if (userData.status) {
            await linksModel.deleteOne({ _id: linkData._id })
            return userData
        }

        return {
            status: false,
            msg: 'Invalid Data'
        }
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') return {
            status: false,
            msg: 'Invalid Token'
        }
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: 'Error'
        }
    }

}


async function resetPassword(tok: string, password: string){
    try {
        var token = await userTokenModel.findOne({token:tok})
     
        assert(token,"link not found")

        var UserLog = global.masterData.log.category.userAuth

        const allowedRoles = ['GRC Manager', 'GRC Custodian', 'Auditor', 'Employee']

        const now = new Date();
        if (now > token.tokenExpiry) {
            return { status: false, msg: 'Link expired' };
        }

        var user = await userModel.findOne({email:token.email})
        assert(user,"user not found")

        
        if(user.ssoUser){
            assert(user,"SSO users cannot change their password from here.")
         }


         var email = user.email
        const role = await getUserRoleByEmail(email)
        assert(role, "role not found")

        var orgId = user.organization?.toString()
        assert(orgId, "Organization not associated with the user")


        var orgExists = await masterRecordModel.findById(orgId)
        assert(orgExists,"Organization not found")

        const messages: any = {};

        var complexityCheck = orgExists.authSetup.normalLogin.complexity

        if (password.length < complexityCheck.passwordMinLength) {
            messages.passwordMinLength = complexityCheck.passwordMinLength
        }

        if (password.length > complexityCheck.passwordMaxLength) {
            messages.passwordMaxLength = complexityCheck.passwordMaxLength
        }
        
        if (complexityCheck.includeUppercase && !/[A-Z]/.test(password)) {
            messages.includeUppercase = complexityCheck.includeUppercase 
        }

         if (complexityCheck.includeLowercase && !/[a-z]/.test(password)) {
            messages.includeLowercase = complexityCheck.includeLowercase
        }

         if (complexityCheck.includeNumber && !/\d/.test(password)) {
            messages.includeNumber = complexityCheck.includeNumber
        }

        
        if (complexityCheck.includeSpecialCharacter && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            messages.includeSpecialCharacter = complexityCheck.includeSpecialCharacter
        }

        if(Object.keys(messages).length> 0){
            return {
                status: false,
                msg: 'Password validation failed',
                messages  
            }
        }

        var isMatchCurrent = await bcrypt.compare(password, user.hashedPassword);
        if (isMatchCurrent) {
            return { status: false, msg: "New password cannot be the same as the current password" };
        }

        for (const prevPassword of user.prevPassword) {
            const isMatchPrev = await bcrypt.compare(password, prevPassword);
            if (isMatchPrev) {
                return { status: false, msg: "You have used this password previously. Please use a different password." };
            }
        }

        var hashedPassword = await bcrypt.hash(password, saltRounds);
    
        var PasswordExpires = new Date(Date.now() + passwordExpiryDays * 24 * 60 * 60 * 1000).getTime();
    
        await userModel.updateOne(
            { _id: user._id },
            {
                $set: { hashedPassword: hashedPassword, passExpiry: PasswordExpires },
                $push: { prevPassword: user.hashedPassword }
            }
        )


        await sendMail({
            to: user.email,
            subject:`password changed`,
            text: `your password has been changed`
        })


        if(role==='admin'){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: user.id,
                userId: user.id,
                action: "update",
                description: "Password has been changed successfully."
            })
        }
        

        if(UserLog && allowedRoles.includes(role)){
            await addLog({
                objectType: "UserAuthentication",
                objectId: user.id,
                userId: user.id,
                action: "update",
                description: "Password has been changed successfully."
            })
        }

        await userTokenModel.findByIdAndDelete({_id:token.id})

        return {
            status: true,
            msg: 'Password reset successfully'
        }
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') return {
            status: false,
            msg: 'Invalid Token'
        }
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: 'Error',
            _errorCode
        }
    }

}

// LINK
async function linkRolesToUser(userId: string, role: string, uId: string): Promise<myResponse> {
    try {
        // Do auth
        var auth = await checkRolePermissions(uId, [
            { userControl: { fullAccess: true } }
        ])
        assert(auth, "Auth Failed")

        // Check if user exists
        var exists = await userModel.exists({ _id: uId })
        assert(exists)

        await userModel.updateOne(
            { _id: userId },
            {
                $set: {
                    role
                }
            }
        )
        return {
            status: true,
            msg: "ok"
        }

    } catch (error) {
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error"
        }
    }
}


async function deleteUser(id: string, uId: string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId, [
            { userControl: { fullAccess: true } }
        ])
        assert(auth, "Auth Failed")

    
        var user = await userModel.findByIdAndDelete(id)
        assert(user, "User not found")

        await addLog({
            objectType: "superAdmin_Admin_Activity",
            objectId:user.id,
            userId: uId,
            action: "delete",
            description: "User account deleted successfully."
        })

        return {
            status: true,
            msg: `User: ${user._id} Deleted`
        }

    } catch (error) {
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }
}

async function inactiveBulkUser(ids:string[], uId:string) {
   try{
    var auth = await checkRolePermissions(uId, [
        {userControl: {fullAccess:true}}
     ])
     assert(auth,"Auth Failed") 
     
     if(!Array.isArray(ids) || ids.length ===0){
        return {
            status:false,
            msg:"Invalid request"
        }
    }
   
    const userInActive=[]
    const userNotfound=[]

    for(const id of ids){
        const result = await userModel.findByIdAndUpdate(
            {_id:id},
            {active:true}
        )
        if(result){
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId:id,
                userId: uId,
                action: "update",
                description: "User marked as inactive."
            })
            userInActive.push(id)
        }else{
            userNotfound.push(id)
        }
    }

    if(userInActive.length===0){
        return{
            status:false,
            msg:"No user inactivated"
        }
    }

     return {
        status:true
     }

   }catch (error) {
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }

}


async function activeBulkUser(ids:string[], uId:string){
    try{
        var auth = await checkRolePermissions(uId, [
            {userControl: {fullAccess:true}}
         ])
         assert(auth,"Auth Failed")

         if(!Array.isArray(ids) || ids.length ===0){
            return {
                status:false,
                msg:"Invalid request"
            }
        }

         const userActive=[]
         const userNotfound=[]

         for(const id of ids){
            const result = await userModel.findByIdAndUpdate(
                {_id:id},
                {active:true}
            )
            if(result){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId:id,
                    userId: uId,
                    action: "update",
                    description: "User marked as active."
                })
                userActive.push(id)
            }else{
                userNotfound.push(id)
            }
         }

         if(userActive.length===0){
            return {
                status:false,
                msg:'users not found '
            }
         }

         return {
            status:true,
            msg:"user activated successfully",
            userActived:userActive,
            userNotfound
         }
    }catch (error) {
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }
   

}


async function inactiveUser(id:string, uId:string):Promise<myResponse>{
  try{
     var auth = await checkRolePermissions(uId, [
        {userControl: {fullAccess:true}}
     ])
     assert(auth,"Auth Failed")

     await userModel.findByIdAndUpdate(
        {_id:id},
        {active:false}
     )
    
     
     await addLog({
        objectType: "superAdmin_Admin_Activity",
        objectId:id,
        userId: uId,
        action: "update",
        description: "User marked as inactive."
    })

     return{
        status:true,
        msg:'user inactive successfully'
     }

  }catch(error){
    if (error instanceof assert.AssertionError) return {
        status: false,
        msg: error.message
    }
    return {
        status: false,
        msg: "Error"
    }
  }
}

async function activeUser(id:string, uId:string):Promise<myResponse>{
    try{
       var auth = await checkRolePermissions(uId, [
          {userControl: {fullAccess:true}}
       ])
       assert(auth,"Auth Failed")
  
      var user =  await userModel.findByIdAndUpdate(
          {_id:id},
          {active:true}
       )
       assert(user,"user not exists")

       await addLog({
        objectType: "superAdmin_Admin_Activity",
        objectId:id,
        userId: uId,
        action: "update",
        description: "User marked as active."
    })
  
       return{
          status:true,
          msg:'user active successfully'
       }
  
    }catch(error){
      if (error instanceof assert.AssertionError) return {
          status: false,
          msg: error.message
      }
      return {
          status: false,
          msg: "Error"
      }
    }
  }
  

async function deleteBulkUser(ids:string[],uId:string){
    try{
        var auth = await checkRolePermissions(uId, [
            { userControl: { fullAccess: true } }
        ])
        assert(auth, "Auth Failed")

        
        if(!Array.isArray(ids) || ids.length ===0){
            return {
                status:false,
                msg:"Invalid request"
            }
        }

        const deletedId =[]
        const notFound = []

        for(const id of ids)
        {
            const result = await userModel.findByIdAndDelete(id)
            if(result){
                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId:id,
                    userId: uId,
                    action: "delete",
                    description: "User account deleted successfully."
                })
                deletedId.push(id)
            }else{
                notFound.push(id)
            }
        }
        
        if(deletedId.length===0){
            return {
                status:false,
                msg:'No user IDs found to delete'
            }
         }

         return{
            status:true,
            msg:"user deleted successfully",
           deletedUser: deletedId,
            notFound
         }

    }catch(error){
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }
    }
}


async function changeEmailOTP(uId: string){
    try{  
        // var auth = await checkRolePermissions(uId, [
        //     { userControl: { fullAccess: true } }
        // ])

        // assert(auth, "Auth Failed")

        var isSuperAdminuser = await isSuperAdmin(uId)

        assert(isSuperAdminuser, "Auth Failed")
        
        var user = await superAdminModel.findOne({_id:uId})
        assert(user,"user not found")

            if(!user.email){
                return {
                    status:false,
                    msg:"email not found"
                }
            }

            var randNum = generateRandomNumber()

            await optModel.deleteMany({ userId: user._id })

            var otp = await optModel.create({ token: randNum, userId: user._id, tries: 0 })  

            var firstThreeLetter = user.email.slice(0,3)

            var Email = firstThreeLetter + '*'.repeat(user.email.length-3)
            console.log(randNum)

            //  await sendMail({
            //     to: user.email,
            //     subject: 'Mail for OTP',
            //     text: `OTP: ${randNum}`
            // }) 

                await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: otp.id,
                    userId: user.id,
                    action: "create",
                    description: "otp send on email"
                })
            
          return {
            status: true,
            msg: "OTP is send on your email",
            data:{
                email:Email
            }
        }
    }catch(error){
        if (error instanceof assert.AssertionError) {
            return {
                status: false,
                msg: error.message,
                
            }
        }

        return {
            status: false,
            msg: "Error",
        } 
    }
}


async function updateEmail(email:string, otp:string,uId:string):Promise<myResponse>{
    try{
        // var auth = await checkRolePermissions(uId, [
        //             { userControl: { fullAccess: true } }
        //         ])
        //         assert(auth, "Auth Failed")

        
        var isSuperAdminuser = await isSuperAdmin(uId)

        assert(isSuperAdminuser, "Auth Failed")

        var verify = await optModel.findOne({ userId: uId})
        assert(verify,"OTP not found")

        if(verify.tries>=3){
            await optModel.deleteMany({userId:uId})
            
            await addLog({
                objectType: "superAdmin_Admin_Activity",
                objectId: verify.id,
                userId: uId,
                action: "verify",
                description: "OTP expired due to too many failed attempts"
            })

                return {
                        status: false,
                        msg: "OTP expired due to too many failed attempts",
                }
        }

        var valid = otp ===verify.token

        if(valid){
            await optModel.deleteOne({ _id: verify._id })
                    await addLog({
                    objectType: "superAdmin_Admin_Activity",
                    objectId: verify.id,
                    userId: uId,
                    action: "verify",
                    description: "OTP verified"
                })
        }

      var emailSet=  await userModel.findByIdAndUpdate(uId, { email: email })
      if(emailSet){
        await optModel.deleteOne({ _id: verify._id })
        await addLog({
        objectType: "superAdmin_Admin_Activity",
        objectId: emailSet.id,
        userId: uId,
        action: "update",
        description: "Super Admin email updated."
        })
      }
        return{
            status:true,
            msg:"email updated successfully"
        }

    }catch(error){
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }  
    }
}

async function SADetails(uId:string){
    try{
        var auth = await checkRolePermissions(uId,[
            {userControl:{fullAccess:true}}
        ])
        assert(auth,"Auth Failed")
        
    
        return{
            status:true,
            msg:"successfully"
        }
    }
    catch(error){
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }  
    }
}

async function changeUserPassword(uId:string,email:string, password:string){
    try{
        var auth = await checkRolePermissions(uId,[
            {userControl:{fullAccess:true}}
        ])
        assert(auth,"Auth Failed")
        
         
        var userExists = await userModel.findOne({email})
        assert(userExists,'user not found')

        if(userExists.ssoUser){
           assert(userExists,"SSO users cannot change their password from here.")
        }

        const roleId = userExists.role

        const role = await roleModel.findById(roleId)
        assert(role, 'Role not found')


        var orgExists = await masterRecordModel.findOne({})
        assert(orgExists,"Organization not found")

        const messages:any={};

        var complexityCheck = orgExists.authSetup.normalLogin.complexity
        
        if(password.length<complexityCheck.passwordMinLength){
            messages.passwordMinLength = complexityCheck.passwordMinLength
        }
        if(password.length>complexityCheck.passwordMaxLength){
            messages.passwordMaxLength = complexityCheck.passwordMaxLength
        }
        if(complexityCheck.includeUppercase && !/[A-Z]/.test(password)){
            messages.includeUppercase = complexityCheck.includeUppercase
        }

        if(complexityCheck.includeLowercase && !/[a-z]/.test(password)){
             messages.includeLowercase = complexityCheck.includeLowercase
        }

        if(complexityCheck.includeNumber && !/\d/.test(password)){
            messages.includeNumber = complexityCheck.includeNumber
        }

        if(complexityCheck.includeSpecialCharacter && !/[!@#$%^&*(),.?":{}|<>]/.test(password)){
            messages.includeSpecialCharacter = complexityCheck.includeSpecialCharacter
        }

        if(Object.keys(messages).length> 0){
            return {
                status: false,
                msg: 'Password validation failed',
                messages  
            }
        }

        var isMatchCurrent = await bcrypt.compare(password, userExists.hashedPassword)
        {
            if(isMatchCurrent){
                return {status:false, msg:"New password cannot be the same as the current password"}
            }
        }

        for (const prevPassword of userExists.prevPassword){
            const isMatchPrev = await bcrypt.compare(password,prevPassword)
            if(isMatchPrev){
                return {status:false, msg:"You have used this password previously, please use a different password"}
            }
        }
        
        var hashedPassword = await bcrypt.hash(password,saltRounds)
        var PasswordExpires = new Date(Date.now()+passwordExpiryDays*24*60*60*1000).getTime();
        
        await userModel.updateOne(
            {_id:userExists._id},
            {
                $set:{hashedPassword:hashedPassword, passExpiry:PasswordExpires},
                $push:{prevPassword:userExists.hashedPassword}
            }
        )

        // await sendMail({
        //     to: userExists.email,
        //     subject:`password changed`,
        //     text: `your password has been changed`
        // })
      
        
            await addLog({
                objectType:"superAdmin_Admin_Activity",
                objectId:userExists.id,
                userId:userExists.id,
                action:'update',
                description:"Password changed successfully."
            })
        

        return{
            status:true,
            msg:'password change successfully'
        }
    }catch(error){
        if (error instanceof assert.AssertionError) return {
            status: false,
            msg: error.message
        }
        return {
            status: false,
            msg: "Error"
        }  
    }
}

async function saveUserDEMO(body: {}) {
    var user = await userModel.create(body)
    return {
        status: true,
        user
    }
}

export {
    saveUser,
    createSuperAdmin,//added
    superAdminResetPassword,//added
    superAdminForgotPassword,//added
    sendToken,//added
    createUser,//added
    setPassword,//added
    setUserPassword,//added
    verifyResetPasswordLink,//added
    verifyLink,//added
    sendOTPMail,//added
    verifyMailOTP,//added
    checkUsername,//added
    validateAccessLink,//added
    passwordComplexity,
    deleteBulkUser,
    updateEmail,
    changeEmailOTP,
    inactiveUser,
    activeUser,
    activeBulkUser,
    inactiveBulkUser,
    SADetails,
    changeUserPassword,

    checkEmail,//added
    superAdminLogin,//added
    getPassComplexity,
    login,
    changePasswordByEmail,
    checkUser,
    getUsers,
    getTotalUsersCount,
    getUser,
    inviteUser,
    saveUserByLink,
    forgotPassword,
    exportUsers,
    resetPassword,
    linkRolesToUser,
    ssoCheckNSaveUser,
    update,
    deleteUser,
    getMfaSetupQrcode,
    verifyMfa,
    verifyEmailMfa,
    sendEmailOtp,
    updateRefToken,

    saveUserDEMO
}

