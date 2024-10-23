import myResponse from "../../@types/response.js";
import TPRModel from "../models/TPRModel.js";
import { checkRolePermissions } from "../../utils/roles.js";
import assert, { AssertionError } from "assert";



interface TPRModelInterface extends Document {
    title: string;
    author: string[];
    TPRUsers: string[];
    qna: {
      questionId: string[];
      question: string;
      ans: string;
      type: "Boolean" | "String";
    }[];
    approved: boolean;
  }

interface AnswerInterface{
    id: string,
    answer: string
}
  
// ADD
async function create(body:TPRModelInterface,uId:string): Promise<myResponse> {
    try {
        var auth = await checkRolePermissions(uId,[
            {TPRA:{edit:true}}
        ])


        assert(auth,"You are not authorized")

        if(!body.author.includes(uId)) body.author.push(uId)
        assert(body.TPRUsers.length && Array.isArray(body.TPRUsers))

        var tpr = await TPRModel.create(body)
        return{
            status:true,
            msg: tpr._id
        }
    } catch (error) {
        // console.log(error)
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
        if(!await TPRModel.isAuthor(id,uId)){
            var auth = await checkRolePermissions(uId,[
                {TPRA:{fullAccess:true}}
            ])
            assert(auth,"You are not authorized")
        }

        await TPRModel.deleteOne({_id:id})
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
        if(!await TPRModel.isValidUser(id,uId)){
            var auth = await checkRolePermissions(uId,[
                {TPRA:{view:true}}
            ])
            assert(auth,"You are not authorized")
        }

        var trp = await TPRModel.findById(id)
        return{
            status:true,
            data: trp
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

        
        var trps = await TPRModel.aggregate([
            {$project:{name:1,author:1,TPRUsers:1,approved:1 }},
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);

        return{
            status:true,
            data: trps
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
async function setApprove(id:string,state:Boolean,uId:string): Promise<myResponse> {
    try {
        if(!await TPRModel.isAuthor(id,uId)){
            var auth = await checkRolePermissions(uId,[
                {TPRA:{fullAccess:true}},
            ])
            assert(auth,"You are not authorized")
        }
        await TPRModel.updateOne(
            {_id: id},
            {
                $set:{
                    approved: state
                }
            },
            {runValidators: true}
        )
        return{
            status:true,
            msg: "Changed State of TPR"
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

async function updateAns(id:string,qna:AnswerInterface[],uId:string): Promise<myResponse> {
    try {
        var auth = await TPRModel.isTPRUser(id,uId)
        assert(auth,"You are not authorized")

        var tprForm = await TPRModel.findById(id)
        assert(tprForm,"No TPR form found")

        var mapId:{[key:string]:number} = {}
        
        tprForm!.qna.forEach((item,index)=>{
            mapId[item._id as string] = index
        })
        
        qna.forEach( userAns =>{
            tprForm!.qna[mapId[userAns.id]].ans = userAns.answer.toString()
        })


        await tprForm.save()
        
        return{
            status:true,
            msg: "Answers updated"
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
    setApprove,
    updateAns
}




