import assert from "assert";
import myResponse from "../../@types/response.js";
import { Response } from 'express';
import { checkRolePermissions } from "../../utils/roles.js";
import masterRecordModel, { masterRecordInterface } from "../models/masterRecordModel.js";
import { AssertionError } from "assert";
import initMailServer from "./mailController.js";
import { updatePassportConfig } from "./samlController.js";
import ssoModel, { ssoModelInterface } from "../models/ssoModel.js";
import filesModel from "../models/filesModel.js";
import xml2js from 'xml2js'


export interface fileMetaData {
    filename: string,
    encoding: string,
    mimeType: string
}

export interface samlXmlInterface {
    EntityDescriptor: {
        $: {
            xmlns: string
            entityID: string
        }
        IDPSSODescriptor: Array<{
            $: {
                "xmlns:ds": string
                protocolSupportEnumeration: string
            }
            KeyDescriptor: Array<{
                $: {
                    use: string
                }
                "ds:KeyInfo": Array<{
                    $: {
                        "xmlns:ds": string
                    }
                    "ds:X509Data": Array<{
                        "ds:X509Certificate": Array<string>
                    }>
                }>
            }>
            SingleLogoutService: Array<{
                $: {
                    Binding: string
                    Location: string
                }
            }>
            NameIDFormat: Array<string>
            SingleSignOnService: Array<{
                $: {
                    Binding: string
                    Location: string
                }
            }>
        }>
    }
}

interface incomingDataInterface {
    master: masterRecordInterface,
    sso: ssoModelInterface
}


// CREATE
async function create(data: incomingDataInterface, uId: string): Promise<myResponse> {
    try {
        // var auth = await checkRolePermissions(uId, [
        //     {onboarding:{fullAccess: true}}
        // ])
        // assert(auth, "Auth Failed")
        
        // @ts-ignore
        var _t = Object.keys(data.master.export.header).filter(_k=> data.master.export.header[_k] === true).length
        assert( (_t <= 2) && (_t >= 1),"select max of 2 for header"  )

        // @ts-ignore
        var _t = Object.keys(data.master.export.footer).filter(_k=> data.master.export.header[_k] === true).length
        assert( (_t <= 2) && (_t >= 1),"select max of 2 for footer"  )

        
        var _tmp = await masterRecordModel.findOne({})
        assert(_tmp==null,"Onboarding is already compeleted")

        // const { licenseDetail, ...masterDataWithoutLicenseDetail } = data.master
        // await masterRecordModel.create(masterDataWithoutLicenseDetail)
        
        await masterRecordModel.create(data.master) 

        if (data.master.authSetup.sso.samlFile) {
            var _sso = await readSamlFile(data.master.authSetup.sso.samlFile)
            if (_sso) data.sso = _sso
        }

        if (data.sso) await ssoModel.create(data.sso)

        await setGLobal()

        return {
            status: true
        }

    } catch (error) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }
        console.log(error)
        return {
            status: false,
            msg: "Error"
        }
    }
}

async function update(data: incomingDataInterface, uId: string): Promise<myResponse> {
    try {
        // var auth = await checkRolePermissions(uId, [
        //     {onboarding:{fullAccess: true}}
        // ])
        // assert(auth, "Auth Failed")
        
        const {licenseDetail,OrgDetails, ...masterDataWithoutLicenseDetail } = data.master

        // @ts-ignore
        var _tmpHeader = Object.keys(masterDataWithoutLicenseDetail.export.header).filter(_k => masterDataWithoutLicenseDetail.export.header[_k] === true).length;
        assert((_tmpHeader <= 2) && (_tmpHeader >= 1), "select max of 2 for header");

        // @ts-ignore
        var _tmpFooter = Object.keys(masterDataWithoutLicenseDetail.export.footer).filter(_k => masterDataWithoutLicenseDetail.export.footer[_k] === true).length;
        assert((_tmpFooter <= 2) && (_tmpFooter >= 1), "select max of 2 for footer");


        var updateQuery_1 = await masterRecordModel.updateOne({}, masterDataWithoutLicenseDetail, { runValidators: true });

        if (global.masterData.authSetup.sso.enabled) {
            if (masterDataWithoutLicenseDetail.authSetup.sso.samlFile) {
                var _sso = await readSamlFile(masterDataWithoutLicenseDetail.authSetup.sso.samlFile);
                if (_sso) data.sso = _sso;
            }
            
            if (data.sso) {
                var updateQuery_2 = await masterRecordModel.updateOne({}, data.sso, { runValidators: true });
                if (updateQuery_1.modifiedCount || updateQuery_2.modifiedCount) await setGLobal();
            }
        } else if (updateQuery_1.modifiedCount) {
            await setGLobal();
        }

        return {
            status: true,
            data: global.masterData
        };
    } catch (error: any) {
        console.log(error.message)
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            };
        }
        return {
            status: false,
            msg: "Error"
        };
    }
}

async function readSamlFile(fileId: string, prevFileId: string | undefined = undefined): Promise<ssoModelInterface | null> {
    try {
        // remove previous file
        if (prevFileId) await filesModel.deleteOne({ _id: prevFileId })

        // read file
        var fileData = await filesModel.findById(fileId)
        assert(fileData,"saml Not found")

        const parser = new xml2js.Parser();
        var data:Partial<ssoModelInterface> = await new Promise((resolve, reject) => {
            parser.parseString(fileData!.data!.toString(), (err, metadata: samlXmlInterface) => {
                if (err) {
                    console.error('Error parsing SAML metadata:', err);
                    reject(err)
                    return;
                }
                resolve({
                    issuer: metadata.EntityDescriptor.$.entityID,
                    ssoUrl: metadata.EntityDescriptor.IDPSSODescriptor[0].SingleSignOnService[1].$.Location,
                    cert: `-----BEGIN CERTIFICATE-----\n${metadata.EntityDescriptor.IDPSSODescriptor[0].KeyDescriptor[0]['ds:KeyInfo'][0]['ds:X509Data'][0]['ds:X509Certificate'][0]}\n-----END CERTIFICATE-----\n`,
                })
            });
        })
        assert(data)
        
        return{
            idP_Name: fileData.name!.replace(".xml",""),
            issuer: data.issuer!,
            ssoUrl: data.ssoUrl!,
            cert: data.cert!
        }


    } catch (error) {
        return null
    }
}


async function setGLobal() {
    global.masterData = await masterRecordModel.findOne({}).lean() as masterRecordInterface
    // if (global.masterData) initMailServer()

    // setup sso configs
    // read file 
    if (global.masterData?.authSetup.sso.enabled) await updatePassportConfig()

    console.log("MASTER DATA UPDATED")
}

async function view(uId:string ,res: Response):Promise<myResponse> {
    try {
        // var auth = await checkRolePermissions(uId,[
        //     {admin: true}
        // ])
        // assert(auth,"Auth Failed")
        var masterData = await masterRecordModel.findOne({}) 
        var ssoData = await ssoModel.findOne({})
    
            
        const { apiKey,OrgDetails,  ...masterWithoutApiKey } = masterData?.toObject() || {}
        const { date, ...orgDetailsWithoutDate } = OrgDetails || {}
        // const { retentionPeriod, ...orgDetailsWithoutLogRtn} = log || {}
       
        const finalMasterData = {
            OrgDetails: orgDetailsWithoutDate,
            ...masterWithoutApiKey,
            // ...orgDetailsWithoutLogRtn
          }

          if(!masterData?.authSetup.sso.enabled){
            return {
                status:true,
                data:{
                    master: finalMasterData
                }
            }
          }

        return {
            status:true,
            data:{
                master: finalMasterData,
                sso: ssoData
            }
        }

    } catch (error) {
        if(error instanceof AssertionError) return{
            status: false,
            msg:error.message
        }
        return {
            status:false,
            msg: "Error"
        }
    }
}


export {
    create,
    update,
    setGLobal,
    view
}
