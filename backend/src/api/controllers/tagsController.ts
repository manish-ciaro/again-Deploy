import assert, { AssertionError } from "assert";
import tagsModel from "../models/tagsModel.js";
import { Types } from "mongoose";
import { ClientSession } from "mongoose";
import policyModel from "../models/policyModel.js";
import myResponse from "../../@types/response.js";
import { checkRolePermissions } from "../../utils/roles.js";
import riskModel from "../models/riskModel.js";



export interface incomingTagsData {
    listed?: string[],
    unlisted?: string[]
}


// CREATE
async function createTag(tagName: string, uId: string) {
    try {
        var tag = await tagsModel.create({ name: tagName });
        return tag._id.toString()
    } catch (error) {
        // console.log(error)
        return false
    }
}


async function addOnePolicyToManyTags(pId: string, tags: incomingTagsData, uId: string, session: any = undefined): Promise<string[]> {
    // create unlisted tags in db
    var unlistedTags: string[] = []

    try {
        if (tags.unlisted) {
            await Promise.all(tags.unlisted.map(async (tagName) => {
                var _id = await createTag(tagName, uId)
                if (_id) unlistedTags.push(_id)
            }))
        }
        
        // add tags to db
        var allTags = [...unlistedTags]
        if(tags.listed) allTags.push(...tags.listed)
        var update = await tagsModel.updateMany(
            {_id: allTags},
            {$addToSet:{
                policies: pId
            }}
        )
        
        assert(update.modifiedCount)

        return allTags

    } catch (error) {
        return []
    }
}

async function addOneProcedureToManyTags(pId: string, tags: incomingTagsData, uId: string, session: any = undefined): Promise<string[]> {
    // create unlisted tags in db
    var unlistedTags: string[] = []

    try {
        if (tags.unlisted) {
            await Promise.all(tags.unlisted.map(async (tagName) => {
                var _id = await createTag(tagName, uId)
                if (_id) unlistedTags.push(_id)
            }))
        }
        
        // add tags to db
        var allTags = [...unlistedTags]
        if(tags.listed) allTags.push(...tags.listed)
        var update = await tagsModel.updateMany(
            {_id: allTags},
            {$addToSet:{
                procedures: pId
            }}
        )
        
        assert(update.modifiedCount)

        return allTags

    } catch (error) {
        return []
    }
}

async function addOneRiskToManyTags(riskId: string, tags: incomingTagsData, uId: string) {
    // create unlisted tags in db
    var unlistedTags: string[] = []

    try {
        if (tags.unlisted) {
            await Promise.all(tags.unlisted.map(async (tagName) => {
                var _id = await createTag(tagName, uId)
                if (_id) unlistedTags.push(_id)
            }))
        }
        
        // add tags to db
        var allTags = [...unlistedTags]
        if(tags.listed) allTags.push(...tags.listed)
        var update = await tagsModel.updateMany(
            {_id: allTags},
            {$addToSet:{
                risks: riskId
            }}
        )
        
        assert(update.modifiedCount)

        return allTags

    } catch (error) {
        console.log(error)
        return null
    }

}


async function addOneControlToManyTags(riskId: string, tags: incomingTagsData, uId: string) {
    // create unlisted tags in db
    var unlistedTags: string[] = []

    try {
        if (tags.unlisted) {
            await Promise.all(tags.unlisted.map(async (tagName) => {
                var _id = await createTag(tagName, uId)
                if (_id) unlistedTags.push(_id)
            }))
        }
        
        // add tags to db
        var allTags = [...unlistedTags]
        if(tags.listed) allTags.push(...tags.listed)
        var update = await tagsModel.updateMany(
            {_id: allTags},
            {$addToSet:{
                controls: riskId
            }}
        )
        
        assert(update.modifiedCount)

        return allTags

    } catch (error) {
        console.log(error)
        return null
    }

}



// RETRIVE
async function getAllTags(page = 1, count = 10, tagName = "") {
    try {
        const tags = await tagsModel.aggregate([
            { $match: { name: { $regex: tagName, $options: "i" } } },
            { $project: { name: 1 } },
            { $skip: (page - 1) * count },
            { $limit: count },
        ]);

        return {
            status: true,
            tags: tags,
        };
    } catch (error) {
        console.log(error);
        return {
            status: false,
            msg: "Error",
        };
    }
}

async function getTagPolicies(id: string, page = 1, count = 10) {
    try {
        const tag = await tagsModel.findById(id, {
            policies: { $slice: [(page - 1) * count, count] },
        });

        assert(tag, `No policies in tag with id: ${id}`)

        return {
            status: true,
            policies: tag?.policies,
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }


        return {
            status: false,
            msg: "Error",
        };
    }
}

async function getTagRisks(riskId: string, page = 1, count = 10): Promise<myResponse> {
    try {
        const tag = await riskModel.findById(riskId, {
            tags: { $slice: [(page - 1) * count, count] },
        }).populate("tags");

        assert(tag, `No risks in tag with id: ${riskId}`)

        return {
            status: true,
            tag: tag.tags,
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }


        return {
            status: false,
            msg: "Error",
        };
    }
}

// UPDATE
async function updateTagName(id: string, uId: string, tName: string) {
    try {
        var tag = await tagsModel.exists({ _id: id });
        assert(tag, `No tag with id: ${id}`)
        await tagsModel.updateOne({ _id: id }, { name: tName });

        return {
            status: true,
            msg: "Updated name of the tag",
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error",
        };
    }
}

// DELETE
async function deleteTag(tagId: string, uId: string) {
    try {
        var tag = await tagsModel.findByIdAndDelete({ _id: tagId });
        assert(tag, `No tag with id: ${tagId}`)


        // remove tags from the policies
        if (tag.policies) {
            await policyModel.updateMany(
                { _id: tag.policies },
                {$pull:{tags:tagId}}
            )
        }

        // remove tags from the risk
        if (tag.risks) {
            await riskModel.updateMany(
                { _id: tag.policies },
                {$pull:{tags:tagId}}
            )
        }

        return {
            status: true,
            msg: "Deleted the tag",
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error",
        };
    }
}

async function rmOneTagFromManyPolicy(id: string, policies = [], uId: string) {
    try {
        var tag = await tagsModel.exists({ _id: id });
        assert(tag, `No tag with id: ${id}`)

        
        await tagsModel.updateOne(
            { _id: id },
            { $pull: { policies:{
                $in: policies
            } } },
        );

        return {
            status: true,
            msg: "Deleted Policies in tag",
        };
    } catch (error) {
        if (error instanceof AssertionError) return {
            status: false,
            msg: error.message
        }

        return {
            status: false,
            msg: "Error",
        };
    } 
}

async function rmOnePolicyFromManyTags(pId: string, tagsId: any[], uId: string,) {
    try {
        await tagsModel.updateMany(
            {_id:tagsId},
            { $pull: { policies: pId } }
        )

        return true
    } catch (error) {
        return false
    }
}

async function rmOneProcedureFromManyTags(pId: string, tagsId: any[], uId: string,) {
    try {
        await tagsModel.updateMany(
            {_id:tagsId},
            { $pull: { procedures: pId } }
        )

        return true
    } catch (error) {
        return false
    }
}

async function rmOneRiskFromManyTags(riskId: string, tagsId: any[], uId: string,) {
    try {
        await tagsModel.updateMany(
            {_id:tagsId},
            { $pull: { risks: riskId } }
        )

        return true
    } catch (error) {
        return false
    }
}


async function rmOneControlFromManyTags(riskId: string, tagsId: any[], uId: string,) {
    try {
        await tagsModel.updateMany(
            {_id:tagsId},
            { $pull: { controls: riskId } }
        )

        return true
    } catch (error) {
        return false
    }
}



export {
    addOnePolicyToManyTags,
    addOneRiskToManyTags,
    addOneProcedureToManyTags,
    // addOneTagToManyRisks,
    getAllTags,
    getTagPolicies,
    updateTagName,
    deleteTag,
    rmOneTagFromManyPolicy,
    rmOnePolicyFromManyTags,
    rmOneProcedureFromManyTags,
    // rmOneTagFromManyRisks,
    getTagRisks
};
