import mongoose, { Schema } from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    comment: { type: String, required: true },
    upvotes: { type: [String], require: false },
    downvotes: { type: [String], require: false },
    articleId: { type: Schema.Types.ObjectId, ref: "Article" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", CommentSchema);
