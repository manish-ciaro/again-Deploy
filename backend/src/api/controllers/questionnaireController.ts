import myResponse from "../../@types/response.js";
import { checkRolePermissions } from "../../utils/roles.js";
import assert, { AssertionError } from "assert";
import questionnaireModel from "../models/questionnaireModel.js";



interface questionnaireInterface extends Document {
    content: string;
    type: string;
}
  
// ADD
async function create(body:questionnaireInterface,uId:string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId,[
            {TPRA:{edit:true}}
        ])

        assert(auth,"You are not authorized")

        var question = await questionnaireModel.create(body)
        return{
            status:true,
            msg: question._id
        }
    } catch (error) {
        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }
        
        return{
            status:false,
            msg: "Can't Save the form"
        }
    }
}
// DELETE
async function deleteById(id:string,uId:string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId,[
            {TPRA:{fullAccess:true}}
        ])
        assert(auth,"You are not authorized")

        await questionnaireModel.deleteOne({_id:id})

        return{
            status:true,
            msg: "Deleted"
        }
    } catch (error) {
        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }

        return{
            status:false,
            msg: "Can't Delete the form"
        }
    }
}
// RETRIVE
async function getById(id:string,uId:string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId,[
            {TPRA:{view:true}}
        ])
        assert(auth,"You are not authorized")

        var question = await questionnaireModel.findById(id)
        return{
            status:true,
            data: question
        }
    } catch (error) {
        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }

        return{
            status:false,
            msg: "No Form Found"
        }
    }
}

async function getAll(page:number,count:number,uId:string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId,[
            {TPRA:{view:true}}
        ])
        assert(auth,"You are not authorized")

        
        var question = await questionnaireModel.aggregate([
            {$project:{__v:0,_id:0}},
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);

        return{
            status:true,
            data: question
        }
    } catch (error) {
        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }

        return{
            status:false,
            msg: "Empty"
        }
    }
}

// UPDATE

async function update(id:string,body:questionnaireInterface,uId:string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId,[
            {TPRA:{edit:true}}
        ])
        assert(auth,"You are not authorized")
        
        var updated = await questionnaireModel.updateOne(
            {_id: id},
            body
        )

        assert(updated.modifiedCount > 0, "Nothing to modified" )
        return{
            status:true,
            msg: "Question updated"
        }
    } catch (error) {
        // console.log(error.message)
        if(error instanceof AssertionError) return{
            status: false,
            msg: error.message
        }

        return{
            status:false,
            msg: "Invaild Answers"
        }
    }
}


export{
    create,
    deleteById,
    getById,
    getAll,
    update
}




