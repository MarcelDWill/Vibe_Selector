const express = require('express');
const cors = require('cors'); // 1. Added CORS
const db = require('./db'); 
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || '*';
app.use(cors({
    origin: FRONTEND_URL
}));
app.use(express.json());

app.get('/songs/:persona', async (req, res) => {
    try {
        const { persona } = req.params;
        
        const result = await db.query(
            // The query string is argument 1
            "SELECT * FROM songs WHERE LOWER(persona) = LOWER($1) ORDER BY RANDOM() LIMIT 1", 
            // The values array is argument 2 (Don't forget this!)
            [persona]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No songs found for this persona" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});