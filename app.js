var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");
var cors = require("cors");
//middleware
const { authentication } = require("./middleware/auth");

// Routes Import
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/auth");
const emailRouter = require("./routes/email");
const leaveRouter = require("./routes/leave_balance");
const leaveUpdateRouter = require("./routes/receive_leave");

var app = express();
//Mongoose Connection
mongoose
  .connect("mongodb+srv://skillconnection:skillconnection123@skill-connection.qwcftsr.mongodb.net/LMS")
  .then(() => {
    console.log("Connection Successfully");
  })
  .catch((err) => {
    console.log("Received an Error");
  });

// Cors setup
const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
// middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes Configuration
app.use("/", indexRouter);
app.use("/login", authRouter);
app.use("/send_email", emailRouter);
app.use("/users", usersRouter);
app.use("/employee_leave_detail", leaveRouter);
app.use("/inbox_messages", leaveUpdateRouter);
app.use("/:id", leaveUpdateRouter);
app.use("/:employee_id", usersRouter);
app.use("/:employee_id", leaveRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
