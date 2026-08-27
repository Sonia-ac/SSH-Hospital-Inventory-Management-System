import db from "../config/db.js";
export const addStock = async(req, res) => {
    try {
        const {
            user,
            date,
            time,
            type,
            category,
            name,
            unit,
            quantity,
            expiryDate,
            supplier,
            patient,
            description
        } = req.body;

        const sql = `
            INSERT INTO record
            (
                user,
                date,
                time,
                type,
                category,
                name,
                unit,
                quantity,
                expiry_date,
                supplier,
                patient,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            user,
            date,
            time,
            type,
            category,
            name,
            unit,
            quantity,
            expiryDate,
            supplier,
            patient,
            description
        ];

        await db.query(sql, values);

        res.status(201).json({
            message: "Stock added successfully"
        });

    } catch (error) {
        console.error("Error adding stock:", error);

        res.status(500).json({
            message: "Failed to add stock",
            error: error.message
        });
    }
};

export const getAllStocks = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM record");

        res.status(200).json(rows);

    } catch (error) {
        console.error("Error getting stocks:", error);

        res.status(500).json({
            message: "Failed to fetch stocks",
            error: error.message
        });
    }
};