const express = require('express');
const cors = require('cors'); // 1. Added CORS
const db = require('./db'); 
const app = express();

app.use(cors()); // 2. Enable CORS so the frontend can talk to the backend
app.use(express.json());

app.get('/songs/:persona', async (req, res) => {
    try {
        const { persona } = req.params;
        
        // 3. Changed 'pool.query' to 'db.query' to match your import
        const result = await db.query(
            "SELECT * FROM songs WHERE persona = $1 ORDER BY RANDOM() LIMIT 1", 
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});