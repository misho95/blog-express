const mongoose = require("mongoose");

const Schema = require("mongoose").Schema;

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: [String], require: false },
    upvotes: { type: [String], require: false },
    downvotes: { type: [String], require: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Article", ArticleSchema);
