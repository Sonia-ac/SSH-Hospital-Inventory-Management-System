import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = express.Router();

// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {

            return res.status(400).json({
                message: "Username and password are required."
            });

        }

        const [users] = await pool.execute(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (users.length === 0) {

            return res.status(401).json({
                message: "Invalid username or password."
            });

        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {

            return res.status(401).json({
                message: "Invalid username or password."
            });

        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful.",
            token,

            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role
            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error."
        });

    }

});

// REGISTER
router.post("/register", async (req, res) => {
    try {

        const {
            name,
            username,
            password
        } = req.body;

        if (!name || !username || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const [existingUsers] =
            await pool.execute(
                `SELECT id FROM users WHERE username = ?`,
                [username]
            );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Username already exists."
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        await pool.execute(
            `
            INSERT INTO users
            (name, username, password, role)
            VALUES (?, ?, ?, ?)
            `,
            [
                name,
                username,
                hashedPassword,
                "staff"
            ]
        );

        res.status(201).json({
            message: "Registration successful. You can now login."
        });

    } catch (error) {

        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            message: "Registration failed."
        });

    }
});

export default router;