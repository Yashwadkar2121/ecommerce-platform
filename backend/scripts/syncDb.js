// backend/scripts/syncDb.js
//
// Creates the SQL tables (users, orders, order items, payments, password
// reset tokens). Run it ONCE after pointing the .env at a new database:
//   npm run db:sync
// It only creates missing tables - it never drops or changes existing ones.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

const { connectMySQL, getSequelize } = require("../config/database");

(async () => {
  try {
    await connectMySQL();
    require("../models/mysql/User"); // also loads Order, OrderItem, Payment
    require("../models/mysql/PasswordResetToken");
    await getSequelize().sync();
    const [rows] = await getSequelize().query("SHOW TABLES");
    console.log("✅ Tables ready:", rows.map((r) => Object.values(r)[0]).join(", "));
    process.exit(0);
  } catch (error) {
    console.error("❌ Could not create the tables:", error.message);
    process.exit(1);
  }
})();
