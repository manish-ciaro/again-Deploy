import myResponse from "../../@types/response.js";
import assert, { AssertionError } from "assert";
import { checkRolePermissions, isAdmin, isPolicyApprover, isPolicyAssignee, isPolicyReviewer, isPolicyVersionAssignee, isSuperAdmin } from "../../utils/roles.js";
import complianceModel from "../models/frameworksModel.js";
import controlGroupModel from "../models/controlGroupsModel.js";
import controlStatusModel from "../models/controlStatusModel.js";
import controlsModel from "../models/controlsModel.js";
import evidencesModel from "../models/evidencesModel.js";
import { PipelineStage, Types } from "mongoose";
import userModel from "../models/userModel.js";
import filesModel from "../models/filesModel.js";
import riskModel from "../models/riskModel.js";
import predefinedEvidencesModel from "../models/predefinedEvidences.js";
import projectModel from "../models/projectModel.js";
import policyModel from "../models/policyModel.js";

async function createFramework(framework:string){
    try{

        const result = await complianceModel.insertMany(framework)
        // var data = await complianceModel.create({
        //     frameworkname, description
        // })
        return {
            status: true,
            msg: "frameworks created",
            result
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
            msg: "Error",
        }
    }
}

async function getAllFrameworks(uId: string, _page: string, _count: string, sort = { field: "updated_at", order: "asc" }, search = "") {
    try {
        // Permission check here

        var page = parseInt(_page) || 1;
        var count = parseInt(_count) || 10;

        const pipeline: PipelineStage[] = [];

        const startTime = performance.now();
        if (!!search) {
            pipeline.push({
                $match: {
                    $or: [
                        { 
                         frameworkname: { $regex: search, $options: "i" } },
                        { ID: { $regex: search, $options: "i" } }
                    ]
                }
            });
        }


        if (sort.field) {
            pipeline.push({
                $sort: { [sort.field]: sort.order === "asc" ? 1 : -1 }
            });
        }

      
        pipeline.push(
            { $skip: (page - 1) * count },
            { $limit: count }
        );

   
        const compliance = await complianceModel.aggregate(pipeline).explain("executionStats");
        const endTime = performance.now();
        const timeTaken = endTime - startTime;
   
       
        console.log(`Time Taken: ${timeTaken.toFixed(2)} ms`);

       
        const totalCount = await complianceModel.countDocuments();

        return {
            status: true,
            data: {
                framework: compliance,
                count: totalCount
            }
        }
    } catch (error) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message,
            };
        }
        return {
            status: false,
            msg: "Error",
        };
    }
}


async function getAllControls(uId: string,frameworkId:string, _page: string, _count: string, sort = { field: "updated_at", order: "asc" }, search = "") {
    try{
        var data = await complianceModel.findById({frameworkId}).populate('controls')
        assert(data,"framework not found")

        var group = await controlGroupModel.find({})

        console.log(group)

        return {
            status: true
        } 

    }catch(error){
        if (error instanceof AssertionError) {
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
async function getControl(uId:string,frameworkId:string,controlId:string ) {
    try{
        var data = await complianceModel.findById({frameworkId})
        assert(data,"framework not found")

        var control = await complianceModel.findById({controlId})
        assert(data,"control not found")


        return {
            status:true,
            data:{
                control
            }
        }



    }catch(error){
        if (error instanceof AssertionError) {
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

async function createControlStaus(controlId:string,scope:string, justification:string) {
    try{
        const controlExists = await controlsModel.findById(controlId)
        if (!controlExists) {
            return {
                status: false,
                msg: "Control not found",
            };
        }

        const newControlStatus = await controlStatusModel.create({
            controlId,
            scope,
            justification
        })


        return {
            status: true,
            msg: "Control status created successfully",
            data: newControlStatus
        }
    }catch(error){
        if (error instanceof AssertionError) {
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

async function getAllControlStatus(uId:string) {
    try{
        console.log("hello")
        var control = await controlStatusModel.find({})

        // if(!data){
        //     console.log(data)
        //     return {
        //         status:false,
        //         msg:"control not find"
        //     }
        // }

        return{
            status:true,
            msg:"control status found",
            data:{
                control
            }
        }


    }catch(error){
        console.log(error)
        if (error instanceof AssertionError) {
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



async function getControlStatus(controlId:string) {
    try {
        const control = await controlsModel.findById(controlId)
        if (!control) {
            return {
                status: false,
                msg: "Control not found"
            };
        }

        const data = await controlStatusModel.findOne({ controlId: control._id })
        if (!data) {
            return {
                status: false,
                msg: "Control status not found"
            };
        }

        return {
            status: true,
            msg: "Control status retrieved successfully",
            data
        };
        
    }catch(error){
        if (error instanceof AssertionError) {
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


async function  addProjectToControlStatus(conStatusId:string, projects=[]){
    try{
        console.log(projects)
        var data = await controlStatusModel.exists({_id:conStatusId})
        assert(data,"control status not found")

    
        await Promise.all(projects.map(async project=>{
            assert(await projectModel.exists({_id:project}),"Project not found")
        }))
       

     var update=   await controlStatusModel.updateOne(
            {_id:conStatusId},
            {
                $set:{
                    updatedAt: Date.now()
                },
            $addToSet:{
              projects
            }
        }
        )

        console.log(update)
        
        return{
            status:true,
            msge:"Project added to the control status"
        }
    }
    catch(error){
        if (error instanceof AssertionError) {
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

async function  addPolicyToControlStatus(controlId:string, policy=[]){
    try{
        var data = await controlStatusModel.findById({_id:controlId})
        assert(data,"evidence not found")

    
        await Promise.all(policy.map(async policy=>{
            assert(await policyModel.exists({_id:policy}),"Policy not found")
        }))
       

        await controlStatusModel.updateOne(
            {_id:controlId},
            {
                $set:{
                    updatedAt: Date.now()
                },
            $addToSet:{
                policy
            }
        }
        )
        
        return{
            status:true,
            msge:"policy added to the control status"
        }
    }
    catch(error){
        if (error instanceof AssertionError) {
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

async function  addRisksToControlStatus(controlId:string, risks=[]){
    try{
        var data = await controlStatusModel.findById({_id:controlId})
        assert(data,"evidence not found")

    
        await Promise.all(risks.map(async risk=>{
            assert(await riskModel.exists({_id:risk}),"Risks not found")
        }))
       

        await controlStatusModel.updateOne(
            {_id:controlId},
            {
                $set:{
                    updatedAt: Date.now()
                },
            $addToSet:{
                risks
            }
        }
        )
        
        return{
            status:true,
            msge:"Risk added to the control status"
        }
    }
    catch(error){
        if (error instanceof AssertionError) {
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

async function  addEvidenceToControlStatus(controlId:string,  evidence=[]){
    try{
        var data = await controlStatusModel.findById({_id:controlId})
        assert(data,"evidence not found")

    
        await Promise.all( evidence.map(async  evidence=>{
            assert(await evidencesModel.exists({_id: evidence})," evidence not found")
        }))
       

        await controlStatusModel.updateOne(
            {_id:controlId},
            {
                $set:{
                    updatedAt: Date.now()
                },
            $addToSet:{
                evidence
            }
        }
        )
        
        return{
            status:true,
            msge:" evidence added to the control status"
        }
    }
    catch(error){
        if (error instanceof AssertionError) {
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

// delete

async function remControlStatusProject(controlId:string, projects=[]){
    try{
        var control = await controlStatusModel.exists({_id:controlId})
        assert(control,"control not found")

            await controlStatusModel.updateOne(
            {_id:controlId},
            {
                $set:{updatedAt:Date.now()},
                $pullAll:{
                    projects
                }
            }
        )

        return {
            status:true,
            msg:"projects remove from control status"
        }
    }catch(error){
        if(error instanceof AssertionError){
          return {
            status:false,
            msg:error.message
          }
        }
        return {
            status:false,
            msg:"Error"
        }
    }
}

async function remControlStatusPolicy(controlId:string,policy=[]){
    try{ 
        var control = await controlStatusModel.exists({_id:controlId})
        assert(control,"control not found")

        await controlStatusModel.updateOne(
            {_id:controlId},
            {
                $set:{updatedAt:Date.now()},
                $pullAll:{
                    policy
                }
            }
        )
        return {
            status:true,
            msg: "Policy removed from control status"
        }

    }catch(error){
        if(error instanceof AssertionError)
        {
            return {
               status:false,
               msg:error.message
        }
    }
    return {
        status :false,
        msg:"Error"
    }

    }
}

async function remControlStatusRisk(controlId:string, risks=[]){
    try{
        var control = await controlStatusModel.exists({_id:controlId})
        assert(control,"control not found")

        await controlStatusModel.updateOne(
            {_id:controlId},
            {
                $set:{updatedAt:Date.now()},
                $pullAll:{
                   risks
                }
            }
        )
        return {
            status :true,
            msg:"risk remove from control status"
        }
    }catch(error){
        if(error instanceof AssertionError){
            return {
                status:false,
                msg:error.message
            }
        }
        return {
            status:false,
            msg:"Error"
        }
    }
}

async function remControlStatusEvidence(controlId:string,evidence=[]){
    try{
        var control = await controlStatusModel.exists({_id:controlId})

        assert(control,"control not found")

        await controlStatusModel.updateOne(
            {_id:controlId},
            {
                $set:{updatedAt:Date.now()},
                $pullAll :{
                    evidence
                }
            }
        )

        return {
            status:true,
            msg:"evidence added to the control status"
        }
        
    }catch(error){
        if(error instanceof AssertionError){
            return {
                status:false,
                msg:error.message
            }
        }
        return {
            status:false,
            msg:"Error"
        }
    }
}

async function updateControlStatus(controlId:string,scope:string,justification:string ) {
    try{
        var control = await controlsModel.findById(controlId)
  
        if (!control) {
            console.log(control)
            return {
                status: false,
                msg: "Control not found"
            }
        }

        const contstatus = await controlStatusModel.findOne({ controlId: control._id })
        if(!contstatus){
            return{
                status:false,
                msg:"id not found"
            }
        }
        

        await controlStatusModel.findByIdAndUpdate({_id: contstatus._id} ,{scope,justification})

        return{
            status:true,
            msg:"control updated successfully"
        }
    }catch(error){
        if (error instanceof AssertionError) {
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


async function createEvidence(uId:string,evidenceName:string,frequency:string, assignees:string ) {
    try{
        var data = await complianceModel.create({
            evidenceName,
            frequency,
            assignees
        })

        return {
            status: true,
            msg: "Evidence created successfully",
        } 
      }
    catch(error){
        if (error instanceof AssertionError) {
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


async function attachFile(uId:string,evidenceId:string,files:string) {
    try{
        var data = await complianceModel.findById({evidenceId})

        assert(data,"evidence not found")

        return {
            status: true,
            msg: "file attached successfully",
        } 

    }catch(error){
        if (error instanceof AssertionError) {
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



async function createPredefinedEvidence(name:string,description:string){
    try{
        var data = await predefinedEvidencesModel.create({
            name, description
        })
        return {
            status: true,
            msg: "frameworks created",
        }
    }catch(error){
        console.log(error)
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message
            }
        }
        return {
            status: false,
            msg: "Error",
        }
    }
}

async function getAllPredefinedEvidence(uId: string, _page: string, _count: string, sort = { field: "updated_at", order: "asc" }, search = "") {
    try {
        // Permission check here
        var page = parseInt(_page) || 1;
        var count = parseInt(_count) || 10;

        const pipeline: PipelineStage[] = [];

      
        if (!!search) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: search, $options: "i" } },
                        { ID: { $regex: search, $options: "i" } }
                    ]
                }
            });
        }


        if (sort.field) {
            pipeline.push({
                $sort: { [sort.field]: sort.order === "asc" ? 1 : -1 }
            });
        }

      
        pipeline.push(
            { $skip: (page - 1) * count },
            { $limit: count }
        );

   
        const evidence = await predefinedEvidencesModel.aggregate(pipeline);

       
        const totalCount = await predefinedEvidencesModel.countDocuments();

        return {
            status: true,
            data: {
                evidence: evidence,
                count: totalCount
            }
        }
    } catch (error) {
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message,
            };
        }
        return {
            status: false,
            msg: "Error",
        };
    }
}

async function enablePredefinedEvidence(evidenceId:string){
    try{
        var evidence = await predefinedEvidencesModel.findById(evidenceId)
        assert(evidence,"evidence not found")

        if(evidence?.enabled)
        {
            return{
                status:false,
                msg:"evidence already enable"
            }
        }

       await predefinedEvidencesModel.findByIdAndUpdate(evidenceId,  {$set: { enabled: true, updatedAt: Date.now() } } )

        return {
            status: true,
            msg:"evidence enabled successfully"
        }

    }
      catch (error) {
        console.log(error)
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message,
            };
        }
        return {
            status: false,
            msg: "Error",
        };
    }
}

async function disablePredefinedEvidence(evidenceId:string){
    try{
        var evidence = await predefinedEvidencesModel.findById(evidenceId)
        assert(evidence,"evidence not found")

        if(!evidence?.enabled)
            {
                return{
                    status:false,
                    msg:"evidence already disable"
                }
            }

       await predefinedEvidencesModel.findByIdAndUpdate(evidenceId,  {$set: { enabled: false, updatedAt: Date.now()  } })

        return {
            status: true,
            msg:"evidence disabled successfully"
        }

    }
      catch (error) {
        console.log(error)
        if (error instanceof AssertionError) {
            return {
                status: false,
                msg: error.message,
            };
        }
        return {
            status: false,
            msg: "Error",
        };
    }
}


async function getPredefinedEvidence(evidenceId:string ) {
    try{
        var data = await predefinedEvidencesModel.findById(evidenceId)
        assert(data,"evidence not found")

        if(data?.enabled){
            return{
                status:true,
                data
            }
        }

        return {
            status:false,
            msg:"evidence is not enabled"
        }

    }catch(error){
        if (error instanceof AssertionError) {
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


async function  assignUserToPredefinedEvidence(evidenceId:string, assignee=[]){
    try{
        var data = await predefinedEvidencesModel.findById(evidenceId)
        assert(data,"evidence not found")

        if(!data.enabled){
            return {
                status:false,
                msg:"cannot assign user to disabled evidence"
            }
        }

        await Promise.all(assignee.map(async assignee=>{
            assert(await userModel.exists({_id:assignee}),"Assignee not found")
        }))

        await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
            $set:{updatedAt: Date.now() },
            $addToSet:{
                assignee
            }
        }
        )
        
        return{
            status:true,
            msge:"Added evidence files"
        }
    }
    catch(error){
        console.log(error)
        if (error instanceof AssertionError) {
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

async function  addEvidenceFile(evidenceId:string, files=[]){
    try{
    
        var data = await predefinedEvidencesModel.findById({_id:evidenceId})
        assert(data,"evidence not found")

        if(!data.enabled)
        {
            return {
                status:false,
                msg:"evidence not enabled"
            }
        }

    
        await Promise.all(files.map(async file=>{
            assert(await filesModel.exists({_id:file}),"Attachment not found")
        }))
       

        await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
                $set:{
                    updatedAt: Date.now()
                },
            $addToSet:{
              files
            }
        }
        )
        
        return{
            status:true,
            msge:"Files added to the evidence"
        }
    }
    catch(error){
        console.log(error)
        if (error instanceof AssertionError) {
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

async function  addControl(evidenceId:string, controls=[]){
    try{
        var data = await predefinedEvidencesModel.findById(evidenceId)
        assert(data,"evidence not found")

        if(!data.enabled)
            {
                return {
                    status:false,
                    msg:"evidence not enabled"
                }
            }

            console.log(controls)

        await Promise.all(controls.map(async control=>{
            assert(await controlsModel.exists({_id:control}),"Control not found")
        }))

        await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
                $set:{updatedAt: Date.now() },
                $addToSet:{
                controls
            }
        }
        )
        
        return{
            status:true,
            msge:"controls added to the evidence"
        }
    }
    catch(error){
        console.log(error)
        if (error instanceof AssertionError) {
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

async function  addRisk(evidenceId:string, risks=[]){
    try{
        var data = await predefinedEvidencesModel.findById(evidenceId)
        assert(data,"evidence not found")

        if(!data.enabled)
            {
                return {
                    status:false,
                    msg:"evidence not enabled"
                }
            }

        await Promise.all(risks.map(async Risk=>{
            assert(await riskModel.exists({_id:Risk}),"Risk not found")
        }))

        await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
            $set:{updatedAt: Date.now() },
            $addToSet:{
                risks
            }
        }
        )
        
        return{
            status:true,
            msge:"Risk added to the evidence"
        }
    }
    catch(error){
        console.log(error)
        if (error instanceof AssertionError) {
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

async function  addURL(evidenceId:string, url=[]){
    try{
        var data = await predefinedEvidencesModel.findById(evidenceId)
        assert(data,"evidence not found")

        if(!data.enabled)
            {
                return {
                    status:false,
                    msg:"evidence not enabled"
                }
            }


        await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
            $set:{updatedAt: Date.now() },
            $addToSet:{
                url
            }
        }
        )
        
        return{
            status:true,
            msge:"URL added to the evidence"
        }
    }
    catch(error){
        if (error instanceof AssertionError) {
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

async function remEvidenceFiles(evidenceId:string,files=[]){
    try{
        var evidence = await predefinedEvidencesModel.exists({_id:evidenceId})
        assert(evidence,"evidence not found")

           await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
                $set:{
                    updatedAt:Date.now()
                },
                $pullAll:{
                    files
                }
            }
        )
        return {
            status:true,
            msg:"files remove successfully"
        }

    }catch(error){
        if(error instanceof AssertionError){
            return {
                status:false,
                msg:error.message
            }
        }
        return{
            status:false,
            msg:'Error'
        }

    }
}

async function remEvidenceControl(evidenceId:string, controls=[]){
    try{
        var evidence = await predefinedEvidencesModel.exists({_id:evidenceId})
        assert(evidence,"evidence not found")

            await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
                $set:{updateAt:Date.now()},
                $pullAll:{
                    controls
                }
            }
        )

        return {
            status:true,
            msg:"controls remove from evidence"
        }
    }catch(error){
        console.log(error)
        if(error instanceof AssertionError){
          return {
            status:false,
            msg:error.message
          }
        }
        return {
            status:false,
            msg:"Error"
        }
    }
}

async function remEvidenceAssignee(evidenceId:string, assignee=[]) {
    try{
        var evidence = await predefinedEvidencesModel.exists({_id:evidenceId})
        assert(evidence,"evidence not found")

         await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
                $set:{updatedAt:Date.now()},
                $pullAll:{assignee}
            }
        )
        
    return {
        status:true,
        msg:"Assigee remove from evidence"
    }
    }catch(error){
        console.log(error)
        if(error instanceof AssertionError){
            return {
                status:false,
                msg:error.message
            }
          }
          return {
            status:false,
            msg:"Error"
          }
    }
    
}

async function remEvidenceRisk(evidenceId:string, risks=[]){
    try{
        var evidence = await predefinedEvidencesModel.exists({_id:evidenceId})
        assert(evidence,"evidence not found")
        
           await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
                $set:{updatedAt:Date.now()},
                $pullAll:{risks} 
            }   
        )
        return {
            status:true,
            msg:"risk remove from evidence"
        }

    }catch(error){
      if(error instanceof AssertionError){
        return {
            status:false,
            msg:error.message
        }
      }
      return {
        status:false,
        msg:"Error"
      }
    }
}



async function remEvidenceURL(evidenceId:string, url=[]){
    try{
          var data = await predefinedEvidencesModel.exists({_id:evidenceId})
          assert(data,"Evidence not found")
          
            await predefinedEvidencesModel.updateOne(
            {_id:evidenceId},
            {
                $set:{
                    updatedAt:Date.now()
                },
                $pullAll:{
                    url
                }
            }
          )


        return{
            status:true,
            msge:"URL remove to the evidence"
        }
    }catch(error){
        if (error instanceof AssertionError) {
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



export {
    createFramework,
    getAllFrameworks,
    getAllControls,
    getControl,
    updateControlStatus,
    addProjectToControlStatus,
    addPolicyToControlStatus,
    addRisksToControlStatus,
    addEvidenceToControlStatus,
    remControlStatusProject,
    remControlStatusPolicy,
    remControlStatusRisk,

    createEvidence,
    attachFile,
    createControlStaus,
    getAllControlStatus,
    getControlStatus,
    createPredefinedEvidence,
    getAllPredefinedEvidence,
    enablePredefinedEvidence,
    disablePredefinedEvidence,
    getPredefinedEvidence,
    assignUserToPredefinedEvidence,
    addEvidenceFile,
    addControl,
    addRisk,
    addURL,
    remEvidenceFiles,
    remEvidenceRisk,
    remEvidenceControl,
    remEvidenceURL,
    remEvidenceAssignee,


};