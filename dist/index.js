"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
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
app.get("/", authMiddleWear, (req, res) => {
    res.render("index");
});
app.get("/signin", (req, res) => {
    res.render("signin");
});
app.get("/signup", (req, res) => {
    res.render("signup");
});
app.get("/reset", authMiddleWear, (req, res) => {
    res.render("reset");
});
app.post("/api/v1/auth/signin", (req, res) => {
    const { email, password } = req.body;
    (0, fs_1.readFile)("users.json", (err, data) => {
        if (err) {
            res.status(400).send("no data");
            return;
        }
        const parsedUserData = JSON.parse(data.toString());
        const checkUser = parsedUserData.find((u) => {
            if (u.email === email && u.password === password)
                return u;
        });
        if (!checkUser) {
            res.status(400).send("Wrong Credentials!");
            return;
        }
        res.status(200);
        res.cookie("token", checkUser.id);
        res.redirect("/");
    });
});
app.post("/api/v1/auth/signup", (req, res) => {
    const { username, firstname, lastname, email, password, sex } = req.body;
    const userForm = {
        id: new Date().getTime().toString(),
        username,
        firstname,
        lastname,
        email,
        password,
        sex,
        createdAt: new Date().toString(),
    };
    (0, fs_1.readFile)("users.json", (err, data) => {
        if (err) {
            // create new file
            (0, fs_1.writeFile)("users.json", JSON.stringify([userForm]), (err) => {
                if (err)
                    throw err;
                res.status(200);
                res.redirect("/signin");
                return;
            });
            return;
        }
        const parsedUserData = JSON.parse(data.toString());
        const checkEmail = parsedUserData.find((u) => {
            if (u.email === email)
                return u;
        });
        const checkUserName = parsedUserData.find((u) => {
            if (u.username === username)
                return u;
        });
        if (checkEmail) {
            res.status(400);
            res.send("email is used!");
            return;
        }
        if (checkUserName) {
            res.status(400);
            res.send("userName is used!");
            return;
        }
        (0, fs_1.writeFile)("users.json", JSON.stringify([...parsedUserData, userForm]), (err) => {
            if (err)
                throw err;
            res.status(200);
            res.redirect("/signin");
            return;
        });
    });
});
app.post("/api/v1/auth/reset", authMiddleWear, (req, res) => {
    const { oldpassword, newpassword } = req.body;
    (0, fs_1.readFile)("users.json", (err, data) => {
        if (err) {
            res.status(400).send("no data");
            return;
        }
        const parsedUserData = JSON.parse(data.toString());
        const findUser = parsedUserData.find((user) => {
            if (user.id === req.token)
                return user;
        });
        if (findUser.password !== oldpassword) {
            res.status(400).send("wrong password!");
            return;
        }
        findUser.password = newpassword;
        const update = parsedUserData.map((user) => {
            if (user.id === findUser.id) {
                return findUser;
            }
            else {
                return user;
            }
        });
        (0, fs_1.writeFile)("users.json", JSON.stringify(update), (err) => {
            if (err)
                throw new Error();
            res.status(200);
            res.redirect("/");
        });
    });
});
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
