// backend/scripts/createAdmin.js
//
// Creates an admin account (or turns an existing account into an admin).
//   npm run admin:create -- --email=you@example.com --password=YourPassword1
//   npm run admin:create -- --email=you@example.com --password=... --first=Yash --last=Wadkar
// The password can also come from the ADMIN_PASSWORD environment variable, which
// keeps it out of your shell history.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });

const { connectMySQL, getSequelize } = require("../config/database");

const parse = (argv) => {
  const args = { first: "Admin", last: "User" };
  for (const arg of argv) {
    const match = /^--(email|password|first|last)=(.*)$/.exec(arg);
    if (!match) throw new Error(`Unknown option: ${arg}`);
    args[match[1]] = match[2];
  }
  args.password = args.password || process.env.ADMIN_PASSWORD;
  return args;
};

(async () => {
  try {
    const args = parse(process.argv.slice(2));
    const email = (args.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Pass a valid --email=...");
    if (!args.password || args.password.length < 8) {
      throw new Error("Pass --password=... (at least 8 characters) or set ADMIN_PASSWORD");
    }

    await connectMySQL();
    const User = require("../models/mysql/User");
    require("../models/mysql/PasswordResetToken");
    await getSequelize().sync(); // make sure the tables exist

    // withPassword scope: the password is hidden by default
    const existing = await User.scope("withPassword").findOne({ where: { email } });
    if (existing) {
      existing.role = "admin";
      existing.password = args.password; // hashed by the model hook
      await existing.save();
      console.log(`✅ ${email} is now an admin (password updated)`);
    } else {
      await User.create({
        email,
        password: args.password, // hashed by the model hook
        firstName: args.first,
        lastName: args.last,
        role: "admin",
      });
      console.log(`✅ Admin ${email} created`);
    }
    process.exit(0);
  } catch (error) {
    console.error("❌", error.message);
    process.exit(1);
  }
})();
