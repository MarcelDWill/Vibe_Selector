const db = require('./db');

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        drive_id TEXT NOT NULL,
        persona TEXT NOT NULL
    );
`;

const seedDataQuery = `
    INSERT INTO songs (title, drive_id, persona)
    VALUES 
        ('Ruby Vibe 1', '1_REAL_DRIVE_ID_HERE_REPLACE_ME', 'Ruby'),
        ('Ruby Vibe 2', '1_REAL_DRIVE_ID_HERE_REPLACE_ME', 'Ruby'),
        ('Marshall Vibe 1', '1_REAL_DRIVE_ID_HERE_REPLACE_ME', 'Marshall'),
        ('Marshall Vibe 2', '1_REAL_DRIVE_ID_HERE_REPLACE_ME', 'Marshall')
    ON CONFLICT DO NOTHING;
`;

async function setupDatabase() {
    try {
        console.log("Creating table 'songs'...");
        await db.query(createTableQuery);
        console.log("Table created successfully.");

        console.log("Seeding data...");
        // Check if data exists first to avoid duplicates if re-run (simple check)
        const check = await db.query('SELECT count(*) FROM songs');
        if (parseInt(check.rows[0].count) === 0) {
            await db.query(seedDataQuery);
            console.log("Data seeded successfully.");
        } else {
            console.log("Table already has data, skipping seed.");
        }

        console.log("Database setup complete!");
    } catch (err) {
        console.error("Error setting up database:", err);
    } 
}

setupDatabase();
