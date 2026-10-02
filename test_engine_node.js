const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// Make initSqlJs globally available for DictionaryEngine
global.initSqlJs = initSqlJs;
const DictionaryEngine = require('./Lib/dictionary.js');

async function test() {
    console.log("=== Testing DictionaryEngine in Node ===");
    const engine = new DictionaryEngine();

    const dbPath = path.join(__dirname, 'Database', 'dictionary_en_vi.db');
    const wasmPath = path.join(__dirname, 'Lib', 'sql-wasm.wasm');
    const dbBuffer = fs.readFileSync(dbPath);

    console.log("Initializing engine...");
    const initRes = await engine.init({
        wasmUrl: wasmPath,
        dbBuffer: new Uint8Array(dbBuffer)
    });
    console.log(`Engine ready in ${initRes.loadTimeMs}ms, DB size: ${(initRes.dbSizeBytes / (1024*1024)).toFixed(2)} MB`);

    // 1. Test 'hello'
    console.log("\n--- Testing lookup('hello') ---");
    const resHello = engine.lookup('hello');
    console.log("Found:", resHello.found);
    console.log("Word:", resHello.word);
    console.log("Pronunciations:", resHello.pronunciations);
    console.log(`Definitions count: ${resHello.definitions.length}`);
    console.log("First definition:", resHello.definitions[0]);

    // 2. Test 'look forward to'
    console.log("\n--- Testing lookup('look forward to') ---");
    const resPhrase = engine.lookup('look forward to');
    console.log("Found:", resPhrase.found);
    console.log("Word:", resPhrase.word);
    console.log("Pronunciations:", resPhrase.pronunciations);
    console.log("Definitions:", resPhrase.definitions);

    // 3. Test 'running' (exact or lemma fallback)
    console.log("\n--- Testing lookup('running') ---");
    const resRunning = engine.lookup('running');
    console.log("Found:", resRunning.found);
    console.log("Word:", resRunning.word, "Fallback Lemma:", resRunning.lemma);
    console.log("Definitions count:", resRunning.definitions.length);

    // 4. Test phrase token matching in sentence
    console.log("\n--- Testing matchPhrasesInTokens ---");
    const rawTokens = [
        { text: 'I' },
        { text: 'want' },
        { text: 'to' },
        { text: 'look' },
        { text: 'forward' },
        { text: 'to' },
        { text: 'this' }
    ];
    const segments = engine.matchPhrasesInTokens(rawTokens);
    console.log("Segments matched in 'I want to look forward to this':");
    for (const seg of segments) {
        console.log(`- [${seg.type}] "${seg.text}" (key: ${seg.lookupKey}, recognized: ${seg.isRecognized ?? true})`);
    }

    engine.close();
    console.log("\n=== DictionaryEngine Node Test Succeeded! ===");
}

test().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
