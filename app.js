const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Listen to port http://localhost:3000");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initializeServerAndDB();

//Post userDetails API
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const bcryptPassword = await bcrypt.hash(request.body.password, 10);
  const validateUserQuery = `
        SELECT * 
        FROM 
            user 
        WHERE 
            username = '${username}';
    `;
  const user = await db.get(validateUserQuery);
  console.log(user);
  if (user === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addNewUserQuery = `
        INSERT INTO 
            user (username,name,password,gender,location)
        VALUES (
            '${username}',
            '${name}',
            '${bcryptPassword}',
            '${gender}',
            '${location}'
        );
        `;
      const addUser = await db.run(addNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

module.exports = app;

//Post loginUser API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const bcryptPassword = await bcrypt.hash(request.body.password, 10);
  const validateUserQuery = `
        SELECT * 
        FROM 
            user 
        WHERE 
            username = '${username}';
    `;
  const user = await db.get(validateUserQuery);
  console.log(user);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Put UserUpdate API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const bcryptOldPassword = await bcrypt.hash(request.body.oldPassword, 10);
  const bcryptNewPassword = await bcrypt.hash(request.body.newPassword, 10);
  const validatePasswordQuery = `
        SELECT * 
        FROM 
            user 
        WHERE 
            username = '${username}';
    `;
  const user = await db.get(validatePasswordQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
  if (isPasswordMatched) {
    if (newPassword.length < 5) {
      response.send("Password is too short");
    } else {
      const updateUserQuery = `
        UPDATE
            user 
        SET 
            password = '${bcryptNewPassword}'
        WHERE 
            username = '${username}';
      `;
      const updateUser = await db.run(updateUserQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
