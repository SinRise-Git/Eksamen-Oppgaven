const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const sqlite3 = require("better-sqlite3")
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const session = require("express-session")

dotenv.config()
const app = express();
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

function checkLogin(role) {
    return function(req, res, next) {
        if(role){
            if (!role.includes(req.session.isLoggedIn === undefined || req.session.isLoggedIn.role)) {
                return res.send({valid: false, message: "You don't have the required role to do this action!"});
            }
        }
        if (req.session.isLoggedIn === undefined || !req.session.isLoggedIn.status) {
            return res.redirect('/login');
        }
        next();
    };
}
const db = sqlite3("./database.db", { verbose: console.log })
const staticPath = path.join(__dirname, "public");
const port = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(express.static(staticPath)); 

async function validateRequestDataSignup(requestData) {
    if(requestData.username.length <= 3){
        return { valid: false, message: "Username must be at least 4 characters long" };
    }
    if(requestData.password.length < 8) {
        return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if(!requestData.email.includes("@")) {
        return { valid: false, message: "Email must be valid"};
    }
    const checkEmail = db.prepare("SELECT email FROM users WHERE email = ?").get(requestData.email);
    if(checkEmail) {
        return { valid: false, message: "Email already in use"};
    }
    const checkRole = db.prepare("SELECT * FROM roler WHERE ID = ? and ID != ?").get(requestData.role, 4);
    if(!checkRole) {
        return { valid: false, message: "Role does not exist"};
    }

    return { valid: true };
}

async function validateRequestDataLogin(requestData) {
    const checkEmail = db.prepare("SELECT email FROM users WHERE email = ?").get(requestData.email);
    if(!checkEmail) {
        return { valid: false, message: "There is no user with email"};
    }
    const checkStatus = db.prepare("SELECT name FROM users WHERE email = ? and status = ?").get(requestData.email, "valid")
    if(!checkStatus){
        return { valid: false, message: "Account is not activated"};
    }
    const checkPassword = db.prepare("SELECT password FROM users WHERE email = ?").get(requestData.email);
    const passwordMatch = await bcrypt.compare(requestData.password, checkPassword.Password);
    if(!passwordMatch){
        return { valid: false, message: "Password is incorrect"};
    }
    return { valid: true }
}

function genorateUUID(table){
    const uniqueID = uuid.v4();
    const doesExist = db.prepare(`SELECT uuid FROM ${table} WHERE uuid = ?`).get(uniqueID);
    if(doesExist){
       return genorateUUID(); 
    }
    return uniqueID
}

app.post("/createAccount", async (req, res)  => {
    const requestData = req.body;
    const validationResult = await validateRequestDataSignup(requestData);
    if (!validationResult.valid) {
        res.status(400).send({valid: validationResult.valid, message: validationResult.message});
    } else {
        const uuid = genorateUUID("users")
        const status = requestData.role === "1" ? "valid" : "false";
        const hashPassword =  await bcrypt.hash(requestData.password, parseInt(process.env.SALT_ROUNDS))
        db.prepare("INSERT INTO users (Name, Email, Password, Role, Status, UUID) VALUES (?, ?, ?, ?, ?, ?)").run(requestData.username, requestData.email, hashPassword, requestData.role, status, uuid);
        res.status(200).send({valid: validationResult.valid, message: "Account created"});
    }
});

app.post("/checkLogin", async (req, res) => {
    const requestData = req.body;
    const validationResult = await validateRequestDataLogin(requestData);
    if (!validationResult.valid){
        res.status(400).send({valid: false, message: validationResult.message});
    } else {
        const data = db.prepare(`
        SELECT users.*, roler.name as roleName FROM users 
        INNER JOIN roler ON users.Role = roler.ID
        WHERE email = ?`).get(requestData.email);
        console.log(data);
        req.session.isLoggedIn = {status: true, id: data.ID, name: data.Name, email: data.Email, role: data.roleName};
        res.status(200).send({valid: true, message: "Login successfull"});
    }
})

app.get("/getAllUsers", checkLogin("Administrator"), (req, res) => {
    const users = db.prepare(`
    SELECT users.UUID, users.Name, users.Email, users.status, roler.name as roleName FROM users 
    INNER JOIN roler ON users.role = roler.ID
    WHERE users.ID != ?`).all(req.session.isLoggedIn.id)
    res.send(users);
})

app.get("/getSavedArticles", checkLogin(["Administrator", "Salg", "Montering", "Kunde"]), (req, res) => {
    const articles = db.prepare(`
    SELECT savedArticles.User, articles.name, articles.date, articles.UUID, users.Name as Owner FROM savedArticles 
    INNER JOIN articles ON savedArticles.Article = articles.ID
    INNER JOIN users ON savedArticles.User = users.ID
    WHERE User = ?`).all(req.session.isLoggedIn.id)
    res.send(articles);
})

app.get("/articles/getArticles", (req, res) => {
    const articles = db.prepare(`
    SELECT articles.UUID, articles.Name, articles.Description, articles.Content, articles.Date, users.Name as Owner FROM articles
    INNER JOIN users ON articles.Owner = users.ID
    `).all();
    res.send(articles);
})

app.post("/articles/createArticle", checkLogin(["Administrator", "Salg", "Montering"]), (req, res) => {
    const requestData = req.body;
    const uuid = genorateUUID("articles");
    const currentDate = new Date();
    const correctDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`
    db.prepare("INSERT INTO articles (Name, Description, Content, Date, Owner, UUID) VALUES (?, ?, ?, ?, ?, ?)").run(requestData.title, requestData.description, requestData.content, correctDate, req.session.isLoggedIn.id, uuid);
    res.send({valid: true});
})

app.get("/articles/getArticleInformation/:uuid", (req, res) => {
    const uuid = req.params.uuid;
    const article = db.prepare(`
    SELECT articles.Name, articles.Description, articles.Content, articles.Date, users.Name as Owner FROM articles
    INNER JOIN users ON articles.Owner = users.ID
    WHERE articles.UUID = ?`).get(uuid);
    res.send(article);
})

app.get("/articles/deleteArticle/:uuid", checkLogin(["Administrator", "Salg", "Montering"]), (req, res) => {
    const uuid = req.params.uuid;
    db.prepare("DELETE FROM articles WHERE UUID = ?").run(uuid);
    res.send({valid: true});
})

app.get("/articles/saveArticle/:uuid", checkLogin(["Administrator", "Salg", "Montering", "Kunde"]), (req, res) => {
    const uuid = req.params.uuid;
    const articleID = db.prepare("SELECT ID FROM articles WHERE UUID = ?").get(uuid);
    const doesExist = db.prepare("SELECT * FROM savedArticles WHERE User = ? AND Article = ?").get(req.session.isLoggedIn.id, articleID.ID);
    if(!doesExist) {
        db.prepare("INSERT INTO savedArticles (User, Article) VALUES (?, ?)").run(req.session.isLoggedIn.id, articleID.ID);
        res.send({valid: true});
    } else {
        db.prepare("DELETE FROM savedArticles WHERE User = ? AND Article = ?").run(req.session.isLoggedIn.id, articleID.ID);
        res.send({valid: true});
    }
})

app.get("/deleteUser/:uuid", checkLogin(["Administrator"]), (req, res) => {
    const uuid = req.params.uuid;
    db.prepare("DELETE FROM users WHERE UUID = ?").run(uuid);
    res.send({valid: true});
})

app.get("/activateUser/:uuid", checkLogin(["Administrator"]), (req, res) => {
    const uuid = req.params.uuid;
    db.prepare("UPDATE users SET Status = ? WHERE UUID = ?").run("valid", uuid);
    res.send({valid: true});
})


app.get("/getRole", (req, res) => {
    const role = db.prepare("SELECT * FROM roler WHERE ID != ?").all(4);
    res.send(role);
})

app.get(["/checkIfLogin", "/getUserInformation"], (req, res) => {
    if(req.session.isLoggedIn){
        res.send({valid: true, data: req.session.isLoggedIn});
    } else {
        res.send({valid: false});
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.send({valid: true});
})

app.get(["/", "/login"], (req, res) => {
    res.sendFile(path.join(staticPath, "pages/loginpage.html"));
})
app.get("/home", (req, res) => {
    res.sendFile(path.join(staticPath, "pages/homepage.html"));
})
app.get("/articles", (req, res) => {
    res.sendFile(path.join(staticPath, "pages/articlespage.html"));
})

app.get(["/articles/create"], checkLogin(["Administrator", "Salg", "Montering"]), (req, res) => {
    res.sendFile(path.join(staticPath, "pages/editCreateArticlepage.html"));
})

app.get("/articles/read/:uuid", (req, res) => {
    res.sendFile(path.join(staticPath, "pages/readArticlepage.html"));
})

app.get("/profile", checkLogin(), (req, res) => {
    if(req.session.isLoggedIn.role === "Administrator"){
        res.sendFile(path.join(staticPath, "pages/adminpage.html"));
    } else{
        res.sendFile(path.join(staticPath, "pages/profilepage.html"));
    }
})

app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
});