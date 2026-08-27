import express from "express";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();


// ==========================================
// GET ALL RECORDS
// ==========================================

router.get("/", authenticateToken, async (req, res) => {

    try {

        const [records] = await pool.execute(`
            SELECT
                id,
                medicine_id,
                name,
                category,
                type,
                unit,
                quantity,
                user,
                patient_name,
                description,
                supplier,
                expiry_date,
                date,
                time
            FROM records
            ORDER BY date DESC, time DESC
        `);

        res.json(records);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load records."
        });

    }

});


// ==========================================
// GET ALL MEDICINES
// ==========================================

router.get("/medicines", authenticateToken, async (req, res) => {

    try {

        const [medicines] = await pool.execute(`
            SELECT *
            FROM medicines
            ORDER BY name ASC
        `);

        res.json(medicines);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load medicines."
        });

    }

});


// ==========================================
// ADD NEW STOCK
// ==========================================

router.post("/stock-in", authenticateToken, async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const {
            name,
            category,
            unit,
            quantity,
            expiryDate,
            supplier
        } = req.body;

        if (
            !name ||
            !category ||
            !unit ||
            !quantity
        ) {

            return res.status(400).json({
                message: "Please fill all required fields."
            });

        }

        if (Number(quantity) <= 0) {

            return res.status(400).json({
                message: "Quantity must be greater than zero."
            });

        }

        await connection.beginTransaction();

        const [existing] = await connection.execute(
            "SELECT * FROM medicines WHERE name = ?",
            [name]
        );

        let medicineId;

        if (existing.length > 0) {

            medicineId = existing[0].id;

            await connection.execute(
                `
                UPDATE medicines
                SET
                    category = ?,
                    unit = ?,
                    quantity = quantity + ?,
                    supplier = ?,
                    expiry_date = ?
                WHERE id = ?
                `,
                [
                    category,
                    unit,
                    quantity,
                    supplier || null,
                    expiryDate || null,
                    medicineId
                ]
            );

        } else {

            const [result] = await connection.execute(
                `
                INSERT INTO medicines
                (name, category, unit, quantity, supplier, expiry_date)
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    name,
                    category,
                    unit,
                    quantity,
                    supplier || null,
                    expiryDate || null
                ]
            );

            medicineId = result.insertId;

        }

        const now = new Date();

        const date = now.toISOString().split("T")[0];

        const time = now.toTimeString().split(" ")[0];

        await connection.execute(
            `
            INSERT INTO records
            (
                medicine_id,
                name,
                category,
                type,
                unit,
                quantity,
                user,
                supplier,
                expiry_date,
                description,
                date,
                time
            )
            VALUES (?, ?, ?, 'stock In', ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                medicineId,
                name,
                category,
                unit,
                quantity,
                req.user.name,
                supplier || null,
                expiryDate || null,
                "Pharmacy restock",
                date,
                time
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: "Stock added successfully."
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            message: "Failed to add stock."
        });

    } finally {

        connection.release();

    }

});


// ==========================================
// RECORD STOCK USAGE
// ==========================================

router.post("/stock-out", authenticateToken, async (req, res) => {

    const connection = await pool.getConnection();

    try {

        const {
            medicineId,
            quantity,
            patientName,
            description
        } = req.body;

        if (!medicineId || !quantity) {

            return res.status(400).json({
                message: "Medicine and quantity are required."
            });

        }

        if (Number(quantity) <= 0) {

            return res.status(400).json({
                message: "Quantity must be greater than zero."
            });

        }

        await connection.beginTransaction();

        const [medicines] = await connection.execute(
            "SELECT * FROM medicines WHERE id = ? FOR UPDATE",
            [medicineId]
        );

        if (medicines.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: "Medicine not found."
            });

        }

        const medicine = medicines[0];

        if (medicine.quantity < Number(quantity)) {

            await connection.rollback();

            return res.status(400).json({
                message: `Insufficient stock. Available quantity: ${medicine.quantity}`
            });

        }

        await connection.execute(
            `
            UPDATE medicines
            SET quantity = quantity - ?
            WHERE id = ?
            `,
            [
                quantity,
                medicineId
            ]
        );

        const now = new Date();

        const date = now.toISOString().split("T")[0];

        const time = now.toTimeString().split(" ")[0];

        await connection.execute(
            `
            INSERT INTO records
            (
                medicine_id,
                name,
                category,
                type,
                unit,
                quantity,
                user,
                patient_name,
                description,
                supplier,
                expiry_date,
                date,
                time
            )
            VALUES (?, ?, ?, 'stock Out', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                medicine.id,
                medicine.name,
                medicine.category,
                medicine.unit,
                quantity,
                req.user.name,
                patientName || null,
                description || null,
                medicine.supplier,
                medicine.expiry_date,
                date,
                time
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: "Usage recorded successfully."
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            message: "Failed to record usage."
        });

    } finally {

        connection.release();

    }

});

export default router;