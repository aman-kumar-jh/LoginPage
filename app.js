// load all the library required
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require('path');

// get API for user registration route form routes folder
const userRoute = require('./backend/routes/user.js');

// app is begin intialized
const app = express();
// enable the .env file use
dotenv.config();

// user cooking for session mangment
app.use(cookieParser());

// loading the static files
app.use(express.static(path.join(__dirname, 'frontend')));

// making the home folder router to load the login.html page
app.get('/', function(req, res){
	res.
	status(200)
	.sendFile(path.join(__dirname + '/frontend/login.html'));
});

// enabling the all the required interaction between the frontend and backend
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
			"Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept, Authorization"
	);
	if (req.method === "OPTIONS") {
			res.header("Access-Control-Allow-Methods", "PUT, POST, GET");
			return res.status(200).json({});
	}
	next();
});

// parser for reading the data from request
app.use(bodyParser.urlencoded({ extended: true }));

// making the limit on data
app.use(bodyParser.json({ limit: "5mb" }));

// assing the user registration routes
app.use("/", userRoute);

// connection to the mongoodb
const db = mongoose.connection;

// making connection failed show the error in console
db.on("error", error => console.log("Failed to start server"));

// if the connection is made with db, allowing the app to start on the given port
db.once("open", () => {
  app.listen(process.env.SERVER_PORT);
  console.log("server running on port:", process.env.SERVER_PORT);
});

// making the connection to our cluster db
mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});




