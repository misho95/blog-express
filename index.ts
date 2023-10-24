import express, { Express, Request, Response, NextFunction } from "express";
import { readFile, writeFile } from "fs";
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

app.get("/", authMiddleWear, (req: Request, res: Response) => {
  readFile(
    "article.json",
    (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
      if (err) {
        res.render("index", { feed: [] });
        return;
      }

      if (data.toString() === "") {
        res.render("index", { feed: [] });
        return;
      }

      const parseData = JSON.parse(data.toString());
      res.render("index", { feed: parseData });
    }
  );
});

app.get("/:id", authMiddleWear, (req: customRequest, res: Response) => {
  readFile(
    "article.json",
    (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
      if (err) {
        res.render("index", { feed: [] });
      }

      const parseData = JSON.parse(data.toString());
      const findById = parseData.find((f: articleType) => {
        if (f.id === +req.params.id) {
          return f;
        }
      });
      res.render("article", { f: findById });
    }
  );
});

app.put("/:id", authMiddleWear, (req: customRequest, res: Response) => {
  readFile(
    "article.json",
    (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
      if (err) {
        throw err;
      }
      const action = req.query.action;
      const parseData = JSON.parse(data.toString());
      let update = [];

      switch (action) {
        case "upvote":
          update = parseData.map((f: articleType) => {
            if (f.id === +req.params.id) {
              return { ...f, upvotes: [...f.upvotes, req.token] };
            } else return f;
          });
          break;
        case "downvote":
          update = parseData.map((f: articleType) => {
            if (f.id === +req.params.id) {
              return { ...f, downvotes: [...f.downvotes, req.token] };
            } else return f;
          });
          break;
      }

      writeFile("article.json", JSON.stringify(update), (err) => {
        if (err) throw err;
      });
    }
  );
});

app.get("/signin", (req: Request, res: Response) => {
  res.render("signin");
});
app.get("/signup", (req: Request, res: Response) => {
  res.render("signup");
});

app.get("/reset", authMiddleWear, (req: Request, res: Response) => {
  res.render("reset");
});

app.get("/signout", authMiddleWear, (req: Request, res: Response) => {
  res.cookie("token", "");
  res.status(200);
  res.redirect("/signin");
});

app.get("/profile", authMiddleWear, (req: customRequest, res: Response) => {
  readFile(
    "users.json",
    (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
      if (err) {
        res.status(400).send("no data");
        return;
      }

      const parsedUserData = JSON.parse(data.toString());
      const userData = parsedUserData.find((u: userType) => {
        if (u.id === req.token) return u;
      });

      res.render("profile", { userData });
    }
  );
});

app.get("/addarticles", authMiddleWear, (req: customRequest, res: Response) => {
  res.render("addarticles");
});

app.post(
  "/api/v1/article",
  authMiddleWear,
  (req: customRequest, res: Response) => {
    const { title, des } = req.body;

    const articleObject = {
      id: new Date().getTime(),
      title,
      description: des,
      upvotes: [],
      downvotes: [],
      author: req.token,
    };

    readFile(
      "article.json",
      (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
        if (err) {
          writeFile("article.json", JSON.stringify([articleObject]), (err) => {
            if (err) throw err;
            res.redirect("/");
          });
        }

        const parsedData = JSON.parse(data.toString());

        writeFile(
          "article.json",
          JSON.stringify([...parsedData, articleObject]),
          (err) => {
            if (err) throw err;
            res.redirect("/");
          }
        );
      }
    );
  }
);

app.post("/api/v1/auth/signin", (req: Request, res: Response) => {
  const { email, password } = req.body;
  readFile(
    "users.json",
    (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
      if (err) {
        res.status(400).send("no data");
        return;
      }

      const parsedUserData = JSON.parse(data.toString());

      const checkUser = parsedUserData.find((u: userType) => {
        if (u.email === email && u.password === password) return u;
      });

      if (!checkUser) {
        res.status(400).send("Wrong Credentials!");
        return;
      }

      res.status(200);
      res.cookie("token", checkUser.id);
      res.redirect("/");
    }
  );
});

app.post("/api/v1/auth/signup", (req: Request, res: Response) => {
  const { username, firstname, lastname, email, password, sex } = req.body;
  const userForm: userType = {
    id: new Date().getTime().toString(),
    username,
    firstname,
    lastname,
    email,
    password,
    sex,
    createdAt: new Date().toString(),
  };

  readFile(
    "users.json",
    (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
      if (err) {
        // create new file
        writeFile(
          "users.json",
          JSON.stringify([userForm]),
          (err: NodeJS.ErrnoException | null) => {
            if (err) throw err;
            res.status(200);
            res.redirect("/signin");
            return;
          }
        );
        return;
      }

      const parsedUserData = JSON.parse(data.toString());
      const checkEmail = parsedUserData.find((u: userType) => {
        if (u.email === email) return u;
      });
      const checkUserName = parsedUserData.find((u: userType) => {
        if (u.username === username) return u;
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

      writeFile(
        "users.json",
        JSON.stringify([...parsedUserData, userForm]),
        (err: NodeJS.ErrnoException | null) => {
          if (err) throw err;
          res.status(200);
          res.redirect("/signin");
          return;
        }
      );
    }
  );
});

app.post(
  "/api/v1/auth/reset",
  authMiddleWear,
  (req: customRequest, res: Response) => {
    const { oldpassword, newpassword } = req.body;

    readFile(
      "users.json",
      (err: NodeJS.ErrnoException | null, data: string | Buffer) => {
        if (err) {
          res.status(400).send("no data");
          return;
        }

        const parsedUserData = JSON.parse(data.toString());
        const findUser = parsedUserData.find((user: userType) => {
          if (user.id === req.token) return user;
        });

        if (findUser.password !== oldpassword) {
          res.status(400).send("wrong password!");
          return;
        }

        findUser.password = newpassword;
        const update = parsedUserData.map((user: userType) => {
          if (user.id === findUser.id) {
            return findUser;
          } else {
            return user;
          }
        });

        writeFile(
          "users.json",
          JSON.stringify(update),
          (err: NodeJS.ErrnoException | null) => {
            if (err) throw new Error();
            res.status(200);
            res.redirect("/");
          }
        );
      }
    );
  }
);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
