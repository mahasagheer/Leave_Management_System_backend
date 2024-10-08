var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const pdfReport = require("./crons/pdfReportCron");

// Routes Import
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/auth");
const emailRouter = require("./routes/email");
const leaveRouter = require("./routes/leave_balance");
const leaveUpdateRouter = require("./routes/receive_leave");
const settingRouter = require("./routes/customTheme");
const { DB_URL } = require("./config");

const upload = require("./service/multer");
var app = express();
// Swagger setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Load environment variables
dotenv.config();

// Mongoose Connection
mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("Connection Successfully");
  })
  .catch((err) => {
    console.log("Received an Error:", err.message);
  });

// Cors setup
const corsOptions = {
  origin: "*", // Allow all origins
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
app.set("/public", path.join(__dirname, "public"));
app.use("/uploads", express.static("uploads"));

// Routes Configuration
app.use("/", indexRouter);
app.use("/system_setting", upload.single("logo"), settingRouter);
app.use("/login", authRouter);
app.use("/send_email", emailRouter);
app.use("/users", usersRouter);
app.use("/employee_leave_detail", leaveRouter);
app.use("/inbox_messages", leaveUpdateRouter);
app.use("/:employee_id", leaveUpdateRouter);
app.use("/:employee_id", usersRouter);
app.use("/:employee_id", leaveRouter);
app.use("/:id", settingRouter);
pdfReport();
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

// Set Port and Create HTTP Server
const PORT = process.env.PORT || 5000;
app.set("port", PORT);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on("listening", () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
});

module.exports = app;
