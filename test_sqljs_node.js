const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function test() {
    console.log("Loading sql.js...");
    const t0 = Date.now();
    const SQL = await initSqlJs({
        locateFile: file => path.join(__dirname, 'Lib', file)
    });
    console.log(`sql.js initialized in ${Date.now() - t0}ms`);

    const dbPath = path.join(__dirname, 'Database', 'dictionary_en_vi.db');
    console.log(`Reading database file from ${dbPath}...`);
    const t1 = Date.now();
    const fileBuffer = fs.readFileSync(dbPath);
    console.log(`Database read (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) in ${Date.now() - t1}ms`);

    const t2 = Date.now();
    const db = new SQL.Database(fileBuffer);
    console.log(`SQL.Database initialized in ${Date.now() - t2}ms`);

    // Test query for 'hello'
    console.log("\n--- Querying 'hello' ---");
    const t3 = Date.now();
    const stmt = db.prepare(`
        SELECT 
            w.word,
            p.ipa,
            p.region,
            d.definition,
            d.pos,
            d.sub_pos,
            wd.example
        FROM words w
        LEFT JOIN pronunciations p ON w.id = p.word_id
        LEFT JOIN word_definitions wd ON w.id = wd.word_id
        LEFT JOIN definitions d ON wd.definition_id = d.id
        WHERE w.word = :word AND w.lang_code = 'en'
    `);
    
    stmt.bind({ ':word': 'hello' });
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    console.log(`Query 'hello' took ${Date.now() - t3}ms, found ${results.length} rows.`);
    console.log(JSON.stringify(results.slice(0, 3), null, 2));

    // Test query for 'look forward to'
    console.log("\n--- Querying 'look forward to' ---");
    const stmt2 = db.prepare(`
        SELECT 
            w.word,
            p.ipa,
            p.region,
            d.definition,
            d.pos,
            d.sub_pos,
            wd.example
        FROM words w
        LEFT JOIN pronunciations p ON w.id = p.word_id
        LEFT JOIN word_definitions wd ON w.id = wd.word_id
        LEFT JOIN definitions d ON wd.definition_id = d.id
        WHERE w.word = :word AND w.lang_code = 'en'
    `);
    stmt2.bind({ ':word': 'look forward to' });
    const resultsPhrase = [];
    while (stmt2.step()) {
        resultsPhrase.push(stmt2.getAsObject());
    }
    stmt2.free();
    console.log(`Found ${resultsPhrase.length} rows for 'look forward to':`);
    console.log(JSON.stringify(resultsPhrase, null, 2));

    db.close();
    console.log("\nAll tests passed successfully!");
}

test().catch(err => {
    console.error("Test failed:", err);
});
