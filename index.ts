require("../db");
import express, { Express, Request, Response, NextFunction } from "express";
import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
const app: Express = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/static", express.static(__dirname + "public"));
app.use(express.static("public"));
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.use(express.json());

const User = require("./models/user.model");
const Article = require("./models/article.model");

const port = 3000;

interface userType {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  sex: string;
  createdAt: string;
}

interface articleType {
  id: number;
  title: string;
  description: string;
  upvotes: [];
  downvotes: [];
  author: string;
}

interface customRequest extends Request {
  token?: string;
}

const authMiddleWear = (
  req: customRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;
  if (!token) {
    res.status(403);
    res.redirect("/signin");
    return;
  }

  req.token = token;
  next();
};

app.get("/", authMiddleWear, async (req: Request, res: Response) => {
  const article = await Article.find();
  res.render("index", { feed: article });
});

app.get("/article/:id", authMiddleWear, async (req: Request, res: Response) => {
  const article = await Article.find({ _id: req.params.id });
  res.render("index", { feed: article });
});

app.get("/addarticles", authMiddleWear, (req: customRequest, res: Response) => {
  res.render("addarticles");
});

app.post(
  "/api/v1/article",
  authMiddleWear,
  async (req: customRequest, res: Response) => {
    const { title, des, tags } = req.body;
    const userId = req.token;
    const article = new Article();
    article.title = title;
    article.description = des;
    article.userId = userId;
    article.tags = tags.slice(",");

    await article.save();
    res.status(201);
    res.redirect("/");
  }
);

app.put(
  "/api/v1/article/:id",
  authMiddleWear,
  async (req: customRequest, res: Response) => {
    const articleId = req.params.id;
    const action = req.query.action;

    const article = await Article.findOne({ _id: articleId });

    switch (action) {
      case "upvote":
        const findUpvote = article.upvotes.includes(req.token);
        if (findUpvote) {
          article.upvotes.pop(req.token);
          await Article.updateOne(
            { _id: articleId },
            { upvotes: article.upvotes }
          );
          res.status(200);
          res.json({ status: "ok" });
          return;
        }

        article.upvotes.push(req.token);
        await Article.updateOne(
          { _id: articleId },
          { upvotes: article.upvotes }
        );
        res.status(200);
        res.json({ status: "ok" });
        break;
      case "downvote":
        const findDownVote = article.downvotes.includes(req.token);
        if (findDownVote) {
          article.downvotes.pop(req.token);
          await Article.updateOne(
            { _id: articleId },
            { downvotes: article.downvotes }
          );
          res.status(200);
          res.json({ status: "ok" });
          return;
        }

        article.downvotes.push(req.token);
        await Article.updateOne(
          { _id: articleId },
          { downvotes: article.downvotes }
        );
        res.status(200);
        res.json({ status: "ok" });
        break;
      default:
        res.status(400);
        res.json({ status: "error" });
    }
  }
);

app.get("/signin", (req: Request, res: Response) => {
  res.render("signin");
});

app.post("/api/v1/auth/signin", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email });
  if (!user || user.password !== password) {
    res.status(400);
    res.json({ error: "Wrong Credentials!" });
    return;
  }

  res.status(201);
  res.cookie("token", user._id);
  res.redirect("/");
});

app.get("/signup", (req: Request, res: Response) => {
  res.render("signup");
});

app.post("/api/v1/auth/signup", async (req: Request, res: Response) => {
  const { username, firstname, lastname, email, password, sex } = req.body;
  const checkEmail = await User.findOne({ email: email });
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

  await user.save();

  res.status(201);
  res.cookie("token", user._id);
  res.redirect("/");
});

app.get(
  "/profile",
  authMiddleWear,
  async (req: customRequest, res: Response) => {
    const userData = await User.findOne({ _id: req.token });
    const userArticle = await Article.find({ userId: req.token });

    res.render("profile", { userData, userArticle });
  }
);

app.get("/reset", authMiddleWear, (req: customRequest, res: Response) => {
  res.render("reset");
});

app.post(
  "/api/v1/auth/reset",
  authMiddleWear,
  async (req: customRequest, res: Response) => {
    const { oldpassword, newpassword } = req.body;
    const user = await User.findOne({ _id: req.token });
    if (user.password !== oldpassword) {
      res.status(400);
      res.json({ error: "wrong password" });
      return;
    }

    await User.updateOne({ _id: req.token }, { password: newpassword });
    res.status(200);
    res.redirect("/");
  }
);

app.get("/signout", authMiddleWear, (req: customRequest, res: Response) => {
  res.cookie("token", "");
  res.status(200);
  res.redirect("/signin");
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
