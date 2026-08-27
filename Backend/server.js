import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./src/routes/authRoutes.js";
import stockRoutes from "./src/routes/stocks.js";
import dashboardRoutes from "./src/routes/dashboard.js";

dotenv.config();

const app = express();


// ==========================================
// PATH SETUP
// ==========================================

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


// ==========================================
// MIDDLEWARE
// ==========================================

// ==========================================
// MIDDLEWARE
// ==========================================

// app.use(cors({
//   origin: "http://localhost:5000",   // allow your frontend
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));
const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));


app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));



// ==========================================
// SERVE FRONTEND
// ==========================================

app.use(
    express.static(
        path.join(__dirname, "../Frontend")
    )
);


// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/stocks", stockRoutes);

app.use("/api/dashboard", dashboardRoutes);


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api", (req, res) => {

    res.json({
        message: "Hospital Inventory API is running."
    });

});


// ==========================================
// DEFAULT PAGE
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../Frontend/login.html"
        )
    );

});


// ==========================================
// 404
// ==========================================

app.use((req, res) => {

    res.status(404).json({
        message: "Route not found."
    });

});


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Hospital Inventory System Server running on: http://localhost:${PORT}`);
});