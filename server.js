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

function checkAuthorization(allowedRole) {
    return function(req, res, next) {
        console.log(req.session.isLoggedIn)
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

function genorateUUID(){
    const uniqueID = uuid.v4();
    const doesExist = db.prepare("SELECT uuid FROM users WHERE uuid = ?").get(uniqueID);
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
        const uuid = genorateUUID()
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
        const data = db.prepare("SELECT * FROM users WHERE email = ?").get(requestData.email);
        req.session.isLoggedIn = {status: true, id: data.ID, name: data.Name, email: data.Email, role: data.Role};
        res.status(200).send({valid: true, message: "Login successfull"});
    }
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
app.get("/news", (req, res) => {
    res.sendFile(path.join(staticPath, "pages/newspage.html"));
})

app.get("/profile", checkAuthorization(), (req, res) => {
    res.sendFile(path.join(staticPath, "pages/profilepage.html"));
})
app.listen(port, () => {
    console.log(`Server is running on localhost:${port}`);
});