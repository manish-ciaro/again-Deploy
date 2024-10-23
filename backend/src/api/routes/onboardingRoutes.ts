import { Router } from "express";
import * as onboardingController from '../controllers/onboardingController.js'
import masterRecordModel, { masterRecordInterface } from "../models/masterRecordModel.js";
import filesModel from "../models/filesModel.js";
import logoModel from "../models/logoModel.js";
import Busboy from 'busboy';
import { AssertionError } from "assert";
import assert from "assert";
import { checkRolePermissions } from "../../utils/roles.js";
const onboardingRoute = Router()

export interface fileMetaData {
    filename: string,
    encoding: string,
    mimeType: string
}

onboardingRoute.get("/",async(req,res)=>{
    var data = await onboardingController.view(req.uId,res)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})

onboardingRoute.put("/",async(req,res)=>{
    var body = req.body
    var data = await onboardingController.create(body,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})

onboardingRoute.post("/",async(req,res)=>{
    var body = req.body
    console.log(body,"jsljflsj")
    var data = await onboardingController.update(body,req.uId)
    data.status ? res.json(data) : res.status(404).json(data) // send status code acc. to data.status
})

onboardingRoute.get("/logo",async(req,res)=>{
    try {
        //  var auth = await checkRolePermissions(req.uId,[
        //     {admin: true}
        // ])
        // assert(auth,"Auth Failed")
        
        var masterData = await masterRecordModel.findOne({})
        assert(masterData,"organization not found")
        var file = await logoModel.findOne({})
        assert(file,"file not found")

        if(file!.private){
            var auth = await checkRolePermissions(req.uId,[
                {admin: true}
            ])
            assert(auth,"Auth Failed")
        }

        res.contentType(file!.mime!)
        res.send(file!.data)

    } catch (error) {
        console.log(error)
        if(error instanceof AssertionError) return res.json({
            status: false,
            msg: error.message
        })

        res.json({
            status: false,
            msg: "No File Found"
        })
    }
})

const MAX_FILE_SIZE = 3 * 1024 * 1024; 

onboardingRoute.post("/logo", async (req, res) => {
    try {
        //  var auth = await checkRolePermissions(req.uId,[
        //     {admin: true}
        // ])
        // assert(auth,"Auth Failed")

        var file = await logoModel.findOne({})

        if(file){
            await logoModel.findByIdAndDelete(file.id)
        }

        const busboy = Busboy({ headers: req.headers });
        let fileUploaded = false;
        let totalBytes = 0;

        const allowedMimeTypes = ["image/jpg", "image/png","image/jpeg"];

        busboy.on('file', (_: string, file: NodeJS.ReadableStream, metaData: fileMetaData) => {
            if (fileUploaded) return;
            fileUploaded = true;

        
            if (!allowedMimeTypes.includes(metaData.mimeType)) {
                file.resume(); 
                return res.status(400).json({
                    status: false,
                    msg: "Only image files (JPG,JPEG, PNG) are allowed."
                });
            }

            const _data: any[] = [];
            file.on('data', (data) => {
                totalBytes += data.length;

                if (totalBytes > MAX_FILE_SIZE) {
                    file.resume(); 
                    return res.status(400).json({
                        status: false,
                        msg: "File size exceeds the 3 MB limit."
                    });
                }
                _data.push(data);
            });

            file.on('end', async () => {
 
                const fileRecord = await logoModel.create({
                    name: metaData.filename,
                    data: Buffer.concat(_data),
                    mime: metaData.mimeType,
                    private: req.query.type === "private",
                });

                const fileId = fileRecord._id;

                res.json({
                    status: true,
                    msg: fileId
                });
            });
        });

        req.pipe(busboy);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            status: false,
            msg: "Error"
        });
    }
});

export default onboardingRoute

