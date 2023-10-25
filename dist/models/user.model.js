"use strict";
const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, require: true },
    sex: { type: String, require: true },
}, {
    timestamps: true,
});
module.exports = mongoose.model("User", UserSchema);