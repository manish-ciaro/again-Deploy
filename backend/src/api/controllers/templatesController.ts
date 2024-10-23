import templatesModel from "../models/templatesModel.js";
import myResponse from "../../@types/response.js";
// CREATE
// RETRIVE
async function getAllTemplates(page:number,count:number): Promise<myResponse> {
    var data = await templatesModel.find({})
        .skip((page - 1) * count)
        .limit(count)
    return {
        status: true,
        templates: data
    }
}
// UPDATE
// DELETE



export{
    getAllTemplates
}
