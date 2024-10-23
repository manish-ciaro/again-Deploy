import { Router } from "express";
import filesModel from "../models/filesModel.js";
import Busboy from 'busboy';
import assert, { AssertionError } from "assert";
import { checkRolePermissions } from "../../utils/roles.js";
const filesRoutes = Router()


export interface fileMetaData {
    filename: string,
    encoding: string,
    mimeType: string
}

// CREATE
filesRoutes.post("/", async (req, res) => {
    try {
        const busboy = Busboy({ headers: req.headers });
        var fileUploaded = false
        busboy.on('file', (_: string, file: NodeJS.ReadableStream, metaData: fileMetaData) => {
            if (fileUploaded) return
            fileUploaded = true

            var _data: any[] = []
            file.on('data', (data) => {
                _data.push(data);
            });

            file.on('end', async () => {
                var file = await filesModel.create({
                    name: metaData.filename,
                    data: Buffer.concat(_data),
                    mime: metaData.mimeType,
                    private: req.query.type == "private" ? true : false
                })
                res.json({
                    status: true,
                    msg: file._id
                })
            });
        });

        req.pipe(busboy);
    } catch (error) {
        res.json({
            status: false,
            msg: "Error"
        })
    }
})


// RETRIVE
filesRoutes.get("/:id", async (req, res) => {
    try {
        var id = req.params.id

        var file = await filesModel.findById(id)
        assert(file)

        if(file!.private){
            // do auth
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

export default filesRoutes



