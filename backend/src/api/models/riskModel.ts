import { Schema, model } from "mongoose";


export var riskStatusEnum = {
  draft: "draft",
  drafted: "drafted",
  reviewed: "reviewed",
  approved: "approved",
  rejected: "rejected",
  deleted: "deleted"
}




const riskSchema = new Schema({
  title: {
    type: String,
    require: [true, "Risk must have title"],
  },
  description: {
    type: String,
    required: [true, "Risk must have description"],
  },
  status: {
    type: String,
    enum: Object.values(riskStatusEnum),
    default: "draft"
  },
  content: {
    type: String,
    required: true,
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  owner: {
    type: [Schema.Types.ObjectId],
    ref: "users",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    required: [true, "Category must be mentioned"],
  },
  likelihood: {
    val: Number,
    n: Number,
    level: String
  },
  impact: {
    val: Number,
    n: Number,
    level: String
  },
  risk: {
    val: {
      type: Number
    },
    level: String
  },
  treatment: String,
  evidence:{
    policies: {
      type: [Schema.Types.ObjectId],
      ref: "policies"
    },
    processDocs: {
      type: [Schema.Types.ObjectId],
      ref: "processDocs"
    }
  },
  controls: {
    type: [Schema.Types.ObjectId],
    ref: "controls"
  },
  versions: {
    type: [Schema.Types.ObjectId],
    ref: "versions"
  },
  evidences: {
    type: [Schema.Types.ObjectId],
    ref: "evidences"
  },
  tags: {
    type: [Schema.Types.ObjectId],
    ref: "tags",
  },
  comments: {
    type: [Schema.Types.ObjectId],
    ref: "comments"
  },
  logs: {
    type: [Schema.Types.ObjectId],
    ref: "logs"
  },
  
  projects: {
    type: [Schema.Types.ObjectId],
    ref: "projects"
  },
});


// riskSchema.pre("save", async function (next) {
//   try {
//     var formula =  riskFormulas[global.masterData.risk.formula]
//     if ( formula && this.likelihood && this.impact) {
//       this.risk!.val = Parser.evaluate(global.masterData.risk.formula, {
//         likelihood: this.likelihood.val!,
//         impact: this.impact.val!
//       });
//       next();
//     } else {
//       next(new Error("Missing formulaOBJ or likelihood or impact properties"));
//     }
//   } catch (error) {
//     next(new Error("Error"));
//   }
// });


const riskModel = model("risks", riskSchema);
export default riskModel;
