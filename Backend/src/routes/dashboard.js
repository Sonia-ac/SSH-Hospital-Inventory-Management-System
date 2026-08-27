import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();


// ==========================================
// DASHBOARD STATISTICS
// ==========================================

router.get("/stats", authenticateToken, async (req, res) => {

    try {

        const [products] = await pool.execute(`
            SELECT COUNT(*) AS totalProducts
            FROM medicines
        `);

        const [stock] = await pool.execute(`
            SELECT COALESCE(SUM(quantity), 0) AS totalStock
            FROM medicines
        `);

        const [lowStock] = await pool.execute(`
            SELECT COUNT(*) AS lowStock
            FROM medicines
            WHERE quantity <= 10
        `);

        const [outOfStock] = await pool.execute(`
            SELECT COUNT(*) AS outOfStock
            FROM medicines
            WHERE quantity = 0
        `);

        const [expiring] = await pool.execute(`
            SELECT COUNT(*) AS expiring
            FROM medicines
            WHERE expiry_date IS NOT NULL
            AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND expiry_date >= CURDATE()
        `);

        res.json({

            totalProducts: products[0].totalProducts,

            totalStock: stock[0].totalStock,

            lowStock: lowStock[0].lowStock,

            outOfStock: outOfStock[0].outOfStock,

            expiring: expiring[0].expiring

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load statistics."
        });

    }

});


// ==========================================
// LOW STOCK
// ==========================================

router.get("/low-stock", authenticateToken, async (req, res) => {

    try {

        const [rows] = await pool.execute(`
            SELECT *
            FROM medicines
            WHERE quantity <= 10
            ORDER BY quantity ASC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load low stock."
        });

    }

});


// ==========================================
// EXPIRING MEDICINES
// ==========================================

router.get("/expiring", authenticateToken, async (req, res) => {

    try {

        const [rows] = await pool.execute(`
            SELECT *
            FROM medicines
            WHERE expiry_date IS NOT NULL
            AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND expiry_date >= CURDATE()
            ORDER BY expiry_date ASC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load expiry notifications."
        });

    }

});

export default router;