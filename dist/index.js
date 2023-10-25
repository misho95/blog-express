"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../db");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use("/static", express_1.default.static(__dirname + "public"));
app.use(express_1.default.static("public"));
app.set("views", path_1.default.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.use(express_1.default.json());
const User = require("./models/user.model");
const Article = require("./models/article.model");
const port = 3000;
const authMiddleWear = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(403);
        res.redirect("/signin");
        return;
    }
    req.token = token;
    next();
};
app.get("/", authMiddleWear, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const article = yield Article.find();
    res.render("index", { feed: article });
}));
app.get("/article/:id", authMiddleWear, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const article = yield Article.find({ _id: req.params.id });
    res.render("index", { feed: article });
}));
app.get("/addarticles", authMiddleWear, (req, res) => {
    res.render("addarticles");
});
app.post("/api/v1/article", authMiddleWear, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, des, tags } = req.body;
    const userId = req.token;
    const article = new Article();
    article.title = title;
    article.description = des;
    article.userId = userId;
    article.tags = tags.slice(",");
    yield article.save();
    res.status(201);
    res.redirect("/");
}));
app.put("/api/v1/article/:id", authMiddleWear, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const articleId = req.params.id;
    const action = req.query.action;
    const article = yield Article.findOne({ _id: articleId });
    switch (action) {
        case "upvote":
            const findUpvote = article.upvotes.includes(req.token);
            if (findUpvote) {
                article.upvotes.pop(req.token);
                yield Article.updateOne({ _id: articleId }, { upvotes: article.upvotes });
                res.status(200);
                res.json({ status: "ok" });
                return;
            }
            article.upvotes.push(req.token);
            yield Article.updateOne({ _id: articleId }, { upvotes: article.upvotes });
            res.status(200);
            res.json({ status: "ok" });
            break;
        case "downvote":
            const findDownVote = article.downvotes.includes(req.token);
            if (findDownVote) {
                article.downvotes.pop(req.token);
                yield Article.updateOne({ _id: articleId }, { downvotes: article.downvotes });
                res.status(200);
                res.json({ status: "ok" });
                return;
            }
            article.downvotes.push(req.token);
            yield Article.updateOne({ _id: articleId }, { downvotes: article.downvotes });
            res.status(200);
            res.json({ status: "ok" });
            break;
        default:
            res.status(400);
            res.json({ status: "error" });
    }
}));
app.get("/signin", (req, res) => {
    res.render("signin");
});
app.post("/api/v1/auth/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield User.findOne({ email: email });
    if (!user || user.password !== password) {
        res.status(400);
        res.json({ error: "Wrong Credentials!" });
        return;
    }
    res.status(201);
    res.cookie("token", user._id);
    res.redirect("/");
}));
app.get("/signup", (req, res) => {
    res.render("signup");
});
app.post("/api/v1/auth/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, firstname, lastname, email, password, sex } = req.body;
    const checkEmail = yield User.findOne({ email: email });
    if (checkEmail) {
        res.status(400);
        res.json({ error: "user exists" });
        return;
    }
    const user = new User();
    user.username = username;
    user.firstname = firstname;
    user.lastname = lastname;
    user.email = email;
    user.password = password;
    user.sex = sex;
    yield user.save();
    res.status(201);
    res.cookie("token", user._id);
    res.redirect("/");
}));
app.get("/profile", authMiddleWear, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield User.findOne({ _id: req.token });
    const userArticle = yield Article.find({ userId: req.token });
    res.render("profile", { userData, userArticle });
}));
app.get("/reset", authMiddleWear, (req, res) => {
    res.render("reset");
});
app.post("/api/v1/auth/reset", authMiddleWear, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { oldpassword, newpassword } = req.body;
    const user = yield User.findOne({ _id: req.token });
    if (user.password !== oldpassword) {
        res.status(400);
        res.json({ error: "wrong password" });
        return;
    }
    yield User.updateOne({ _id: req.token }, { password: newpassword });
    res.status(200);
    res.redirect("/");
}));
app.get("/signout", authMiddleWear, (req, res) => {
    res.cookie("token", "");
    res.status(200);
    res.redirect("/signin");
});
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
