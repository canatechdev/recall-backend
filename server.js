require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 1000;

// Start Server
app.listen(PORT,"0.0.0.0", () => {
  console.log(`
╔══════════════════════════════════╗
║   🚀 Resello Backend Server      ║
║   📍 Port: ${PORT}                  ║
║   🌍 Environment: ${PORT || "development"}           ║
╚══════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    pool.end(() => {
      console.log("Database pool closed");
      process.exit(0);
    });
  });
});