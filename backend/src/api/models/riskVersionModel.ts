import { Schema, model } from "mongoose";


const riskSchemaVersion = new Schema({
  title: {
    type: String,
    require: [true, "Risk must have title"],
  },
  description: {
    type: String,
    required: [true, "Risk must have description"],
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
  created_at: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
  },
  likelihood: {
    type: Number,
  },
  impact: {
    type: Number,
  },
  risk: {
    type: Number,
  },
  tags: {
    type: [Schema.Types.ObjectId],
    ref: "tags",
  },
  policies: {
    type: [Schema.Types.ObjectId],
    ref: "policies"
  },
  projects: {
    type: [Schema.Types.ObjectId],
    ref: "projects"
  },
  controls: {
    type: [Schema.Types.ObjectId],
    ref: "controls"
  },
  procedures: {
    type: [Schema.Types.ObjectId],
    ref: "procedures"
  }
});



const riskVersionModel = model("risksVersions", riskSchemaVersion);
export default riskVersionModel;
