import { Schema, model, Document, Model } from "mongoose";

export interface TPRModelInterface extends Document {
  title: string;
  author: Schema.Types.ObjectId[];
  TPRUsers: Schema.Types.ObjectId[];
  qna: TPR_QNAModelInterface[];
  approved: boolean;
}

export interface TPR_QNAModelInterface extends Document {
  questionId: Schema.Types.ObjectId[];
  question: string;
  ans: string;
  type: "Boolean" | "String";
}

interface TPRModel extends Model<TPRModelInterface> {
  isAuthor(tprId: string, userId: string): Promise<boolean>;
  isTPRUser(tprId: string, userId: string): Promise<boolean>;
  isValidUser(trpId: string, userId: string): Promise<boolean>;
}


const qnaSchema = new Schema({
  question: {
    type: String,
  },
  ans: {
    type: String,
  },
  type: {
    type: String,
    enum: ["Boolean", "String"],
  },
})


const TPRSchema = new Schema<TPRModelInterface, TPRModel>({
  title: {
    type: String,
    unique: true,
    required: true,
  },
  author: {
    type: [{ type: Schema.Types.ObjectId, ref: "users" }],
    ref: "users",
    required: true,
  },
  TPRUsers: {
    type: [{ type: Schema.Types.ObjectId, ref: "users" }],
    ref: "users",
    required: true,
  },
  qna: {
    type: [qnaSchema],
    required: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
});

TPRSchema.statics.isAuthor = async function (tprId: string, userId: string) {
  const exists = await this.exists({
    _id: tprId,
    author: userId,
  });

  return exists !== null;
};

TPRSchema.statics.isTPRUser = async function (tprId: string, userId: string) {
  console.log(userId)
  const exists = await this.exists({
    _id: tprId,
    TPRUsers: userId,
  });

  return exists !== null;
};

TPRSchema.statics.isValidUser = async function (trpId: string, userId: string) {
  const exists = await this.exists({
    _id: trpId,
    $or: [{ author: userId }, { TPRUsers: userId }],
  });

  return exists !== null;
};

const TPRModel = model<TPRModelInterface, TPRModel>("TPR", TPRSchema);

export default TPRModel;
