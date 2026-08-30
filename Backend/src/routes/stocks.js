import express from "express";
import pool from "../config/db.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();


// ==========================================
// GET ALL RECORDS
// ==========================================

router.get("/", authenticateToken, requireAdmin, async (req, res) => {

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
                unit_cost,
                unit_price,
                total_cost,
                total_amount,
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

router.post("/stock-in", authenticateToken, requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();

    try {

        const {
            name,
            category,
            unit,
            quantity,
            totalCost,
            expiryDate,
            supplier
        } = req.body;

        const qty = Number(quantity);
        const purchaseCost = Number(totalCost);


        if (
            !name ||
            !category ||
            !unit ||
            !qty ||
            !purchaseCost
        ) {

            return res.status(400).json({
                message: "Please fill all required fields."
            });

        }

        if (qty <= 0 || purchaseCost <= 0) {

            return res.status(400).json({
                message: "Quantity and purchase cost must be greater than zero."
            });

        }

         // Cost of ONE unit in this new delivery
        const incomingUnitCost = purchaseCost / qty;

        await connection.beginTransaction();


        const [existingItems] = await connection.execute(
            `SELECT * FROM medicines WHERE name = ? FOR UPDATE`,
            [name]
        );

        let medicineId;
        let finalUnitCost;
        let finalSellingPrice;

        //Existing medicine found, update quantity and possibly cost
        if (existingItems.length > 0) {

            const existing = existingItems[0];
            const oldQuantity =Number(existing.quantity);
            const oldUnitCost = Number(existing.cost_per_unit);
            /*
                Weighted Average= Existing inventory value + New inventory value
                    divided by
                Total quantity
            */

            const existingValue = oldQuantity * oldUnitCost;
            const newValue =qty * incomingUnitCost;
            const newTotalQuantity = oldQuantity + qty;

            finalUnitCost = (existingValue + newValue) / newTotalQuantity;
            finalSellingPrice = finalUnitCost * 6;



            medicineId = existing.id;

            await connection.execute(
                `
                UPDATE medicines
                SET
                    category = ?,
                    unit = ?,
                    quantity = quantity + ?,
                    cost_per_unit = ?,
                    markup_percentage = 500,
                    selling_price = ?,
                    supplier = ?,
                    expiry_date = ?
                WHERE id = ?
                `,
                [
                    category,
                    unit,
                    quantity,
                    finalUnitCost.toFixed(2),
                    finalSellingPrice.toFixed(2),
                    supplier || null,
                    expiryDate || null,
                    medicineId
                ]
            );

        } else {
            finalUnitCost =  incomingUnitCost;
            finalSellingPrice = incomingUnitCost * 6;

            const [result] = await connection.execute(
                `
                INSERT INTO medicines
                (name, category, unit, quantity, cost_per_unit, markup_percentage, selling_price, supplier, expiry_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    name,
                    category,
                    unit,
                    qty,
                    finalUnitCost.toFixed(2),
                    500,
                    finalSellingPrice.toFixed(2),
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
                unit_cost,
                unit_price,
                total_cost,
                total_amount,
                user,
                supplier,
                expiry_date,
                description,
                date,
                time
            )
            VALUES (?, ?, ?, 'stock In', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                medicineId,
                name,
                category,
                unit,
                qty,
                incomingUnitCost.toFixed(2),
                finalSellingPrice.toFixed(2),
                purchaseCost.toFixed(2),
                null,
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
            message: "Stock added successfully.",

             pricing: { quantityAdded:  qty,
                        totalPurchaseCost: purchaseCost,
                        incomingUnitCost: Number( incomingUnitCost.toFixed(2)),
                        averageUnitCost: Number( finalUnitCost.toFixed(2)),
                        markupPercentage: 500,
                        sellingPricePerUnit:  Number( finalSellingPrice.toFixed(2))
                      }
        });
  }
catch (error) {

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

        const qty = Number(quantity);


        if (!medicineId || !qty) {

            return res.status(400).json({
                message: "Medicine and quantity are required."
            });

        }

        if (qty <= 0) {

            return res.status(400).json({
                message: "Quantity must be greater than zero."
            });

        }

        await connection.beginTransaction();

        const [items] = await connection.execute(
            "SELECT * FROM medicines WHERE id = ? FOR UPDATE",
            [medicineId]
        );

        if (items.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                message: "Item not found."
            });

        }

        const medicine = items[0];
        const availableStock = Number(medicine.quantity);

        if (availableStock < qty) {

            await connection.rollback();

            return res.status(400).json({
                message: `Insufficient stock. Only ${availableStock} ${medicine.unit}(s) available.`
            });

        }

         const unitCost = Number(  medicine.cost_per_unit);
        const unitPrice = Number(   medicine.selling_price);

        // MAIN STOCK-OUT CALCULATION
        const totalAmount = unitPrice * qty;
        const remainingQuantity =  availableStock - qty;


        await connection.execute(
            `
            UPDATE medicines
            SET quantity = ?
            WHERE id = ?
            `,
            [
                remainingQuantity,
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
                unit_cost,
                unit_price,
                total_cost,
                total_amount,
                user,
                patient_name,
                description,
                supplier,
                expiry_date,
                date,
                time
            )
            VALUES (?, ?, ?, 'stock Out', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                medicine.id,
                medicine.name,
                medicine.category,
                medicine.unit,
                qty,
                unitCost.toFixed(2),
                unitPrice.toFixed(2),
                null,
                totalAmount.toFixed(2),
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
            message: "Usage recorded successfully.",
            pricing: {item: medicine.name,
                      quantity: qty,
                      unit: medicine.unit,
                      costPerUnit: unitCost,
                      sellingPricePerUnit: unitPrice,
                      markup:500,
                      totalAmount:  Number( totalAmount.toFixed(2)),
                      remainingStock: remainingQuantity 
                     }

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