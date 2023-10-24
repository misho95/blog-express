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
  res.render("index");
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
