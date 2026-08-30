// import bcrypt from "bcrypt";
// import pool from "./src/config/db.js";

// try{

// const password = await bcrypt.hash(
//     "admin123",
//     10
// );

// await pool.execute(
//     `
//     INSERT INTO users
//     (name, username, password, role)
//     VALUES (?, ?, ?, ?)
//     `,
//     [
//         "Admin",
//         "admin",
//         password,
//         "admin"
//     ]
// );

// console.log("Admin created successfully.");
// console.log("Username: admin");
// console.log("Password: admin123");

// } catch (error) {

//     console.error("CREATE ADMIN ERROR:", error);

// } finally {

//     await pool.end();

// }
// process.exit();



import bcrypt from "bcrypt";
import pool from "./src/config/db.js";

try {

    const newPassword = "admin123";

    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    const [result] = await pool.execute(
        `
        UPDATE users
        SET password = ?
        WHERE username = ?
        `,
        [
            hashedPassword,
            "admin"
        ]
    );

    if (result.affectedRows === 0) {

        console.log("Admin user not found.");

    } else {

        console.log("Admin password reset successfully!");
        console.log("Username: admin");
        console.log("Password: admin123");

    }

} catch (error) {

    console.error(
        "PASSWORD RESET ERROR:",
        error
    );

} finally {

    await pool.end();

}