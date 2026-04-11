const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser')
const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const responseLogger = require('./config/response.logger')
const fs = require("fs");
const path=require('path')

const authMiddleware = require("./middlewares/auth.middleware");
const app = express();

app.use(cors());

// app.use(cors({
//   origin: true,
//   credentials: true
// }));

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan('dev'))
app.use(responseLogger)


// FRONTEND BINDING
const adminPath = path.join(__dirname, 'public', 'admin');
const appPath = path.join(__dirname, 'public', 'app');

// Serve user app frontend static files under root
app.use(express.static(appPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));
// SPA fallback for user app routes (everything else)
app.get('', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) return next();
  // Skip admin routes (they're handled above)
  if (req.path.startsWith('/admin')) return next();
  // Skip if it has a file extension (static assets)
  if (req.path.includes('.')) return next();

  res.sendFile(path.join(appPath, 'index.html'));
});

// Serve admin frontend static files under /admin
app.use('/admin', express.static(adminPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));


// SPA fallback for admin routes - ONLY for page routes, not static files
app.use('/admin/', (req, res, next) => {
  // Skip if it has a file extension (static assets)
  if (req.path.includes('.')) return next();
  // Skip API routes
  if (req.path.startsWith('/api')) return next();

  res.sendFile(path.join(adminPath, 'index.html'));
});





app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/product", require("./routes/product.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/system", require("./routes/system.routes"));
app.use("/api/sell", require("./routes/sell.routes"));

// RAHUL WORK
app.use("/api/banners", require("./routes/banner.routes"));
app.use('/api/faqs', require('./routes/faq.routes'))

// ERROR HANDLING
const error_handler = require("./middlewares/error_handler.middleware")
app.use(error_handler)



// 200 Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "success", code: 200 });
});


// LOGS

app.get("/logs", (req, res) => {
  const d = new Date().toISOString().split("T")[0];
  const logs = fs.readFileSync("logs/app.log." + d, "utf8")
    .trim()
    .split("\n")
    .map(line => JSON.parse(line));
  res.json(logs.reverse());
});

app.get("/logs_clean", (req, res) => {
  fs.writeFileSync("logs/app.log." + new Date().toISOString().split("T")[0], "");
  res.json({ message: "Logs cleaned" });
});


// NOT FOUND ERROR
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", code: 404 });
});

module.exports = app;
