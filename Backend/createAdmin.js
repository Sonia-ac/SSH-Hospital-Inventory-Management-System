import bcrypt from "bcrypt";
import pool from "./src/config/db.js";

const password = await bcrypt.hash(
    "admin123",
    10
);

await pool.execute(
    `
    INSERT INTO users
    (name, username, password, role)
    VALUES (?, ?, ?, ?)
    `,
    [
        "Admin",
        "admin",
        password,
        "admin"
    ]
);

console.log("Admin created successfully.");

process.exit();