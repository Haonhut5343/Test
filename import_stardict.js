const fs = require('fs');
const zlib = require('zlib');
const initSqlJs = require('sql.js');
const csTerms = require('./cs_terms_data.js');

function parseStarDictEntry(rawHtml, word) {
  // 1. Extract IPAs
  // Formats: <b style="font-size:80%">[UK]</b> /.../ <b style="font-size:80%">[US]</b> /.../ or /.../
  const pronunciations = [];
  const ipaRegex = /(?:<b[^>]*>\[([A-Z]{2})\]<\/b>\s*)?\/([^/]+)\//g;
  let ipaMatch;
  while ((ipaMatch = ipaRegex.exec(rawHtml)) !== null) {
    const region = ipaMatch[1] || null;
    const ipa = '/' + ipaMatch[2].replace(/[\u200B-\u200D\uFEFF]/g, '').trim() + '/';
    if (!pronunciations.some(p => p.ipa === ipa && p.region === region)) {
      pronunciations.push({ ipa, region });
    }
  }

  // 2. Map Vietnamese POS to abbreviation
  const posMap = {
    'danh từ': 'N',
    'động từ': 'V',
    'tính từ': 'A',
    'phó từ': 'ADV',
    'trạng từ': 'ADV',
    'giới từ': 'P',
    'đại từ': 'PRON',
    'liên từ': 'CONJ',
    'thán từ': 'INTERJ',
    'cụm từ': 'PHRASE',
    'thành ngữ': 'PHRASE'
  };

  // 3. Extract sections by POS
  // Parts of speech are marked like: <div><b style="font-size:110%">■ danh từ</b></div>
  const sections = rawHtml.split(/<div><b[^>]*>■\s*([^<]+)<\/b><\/div>/i);
  const results = [];

  if (sections.length > 1) {
    for (let i = 1; i < sections.length; i += 2) {
      const posName = sections[i].trim().toLowerCase();
      const posContent = sections[i + 1] || '';
      const posCode = posMap[posName] || 'O';

      // Ignore section 'đồng nghĩa/liên quan' as part of speech
      if (posName.includes('đồng nghĩa') || posName.includes('liên quan')) continue;

      // Extract definition items (text-indent:12px)
      const defRegex = /<div style="text-indent:12px">(?:<b>\d+\.&nbsp;&nbsp;<\/b>)?(.*?)(?:<\/div>|$)/gi;
      let defMatch;
      let countForPos = 0;

      while ((defMatch = defRegex.exec(posContent)) !== null) {
        let defText = defMatch[1];
        defText = defText.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        defText = defText.replace(/^[•*·\d.-]+\s*/, '').trim();

        if (defText && defText.length > 1 && !defText.startsWith('(') && !defText.includes('CEFR:')) {
          let example = null;
          const exMatch = posContent.match(/‣&nbsp;&nbsp;<i>(.*?)<\/i>\s*(?:↔\s*(.*?))?<\/div>/);
          if (exMatch) {
            example = exMatch[1].replace(/<[^>]+>/g, '').trim();
          }

          results.push({
            pos: posCode,
            posLabel: posName,
            definition: defText,
            example
          });
          countForPos++;
          if (countForPos >= 6) break; // Limit definitions per POS to top 6 to prevent bloat
        }
      }

      // If no text-indent matched, try simpler fallback
      if (countForPos === 0) {
        let text = posContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 2 && !l.startsWith('('));
        for (const line of lines.slice(0, 3)) {
          results.push({
            pos: posCode,
            posLabel: posName,
            definition: line,
            example: null
          });
        }
      }
    }
  }

  // Fallback if no sections
  if (results.length === 0) {
    let clean = rawHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length > 2) {
      results.push({
        pos: 'O',
        posLabel: 'Khác',
        definition: clean.slice(0, 250),
        example: null
      });
    }
  }

  return { word, pronunciations, definitions: results };
}

async function main() {
  console.log('=== STARTING STARDICT & CS TERMS MERGE ===');
  console.time('Total Import Time');

  const SQL = await initSqlJs();
  const dbPath = './Database/dictionary_en_vi.db';
  console.log('Loading SQLite database from', dbPath);
  const dbBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(dbBuffer);

  // 1. Load existing words into memory Map
  console.log('Loading existing words from DB...');
  const existingWords = new Map();
  const wordsRows = db.exec("SELECT id, word FROM words WHERE lang_code = 'en'");
  if (wordsRows.length > 0) {
    for (const row of wordsRows[0].values) {
      existingWords.set(row[1].toLowerCase(), row[0]);
    }
  }
  console.log(`Loaded ${existingWords.size} existing words.`);

  // 2. Load existing pronunciations into memory Set
  console.log('Loading existing pronunciations from DB...');
  const existingPronunciations = new Set();
  const pronRows = db.exec("SELECT word_id, ipa, region FROM pronunciations");
  if (pronRows.length > 0) {
    for (const row of pronRows[0].values) {
      existingPronunciations.add(`${row[0]}|${row[1]}|${row[2] || ''}`);
    }
  }
  console.log(`Loaded ${existingPronunciations.size} existing pronunciations.`);

  // 3. Load existing definitions into memory Map
  console.log('Loading existing definitions from DB...');
  const existingDefinitions = new Map();
  const defRows = db.exec("SELECT id, definition, pos, sub_pos FROM definitions");
  if (defRows.length > 0) {
    for (const row of defRows[0].values) {
      const key = `${row[2] || ''}|${row[3] || ''}|${row[1]}`;
      existingDefinitions.set(key, row[0]);
    }
  }
  console.log(`Loaded ${existingDefinitions.size} existing definitions.`);

  // 4. Load existing word_definitions into memory Set
  console.log('Loading existing word_definitions links from DB...');
  const existingWordDefs = new Set();
  const wdRows = db.exec("SELECT word_id, definition_id FROM word_definitions");
  if (wdRows.length > 0) {
    for (const row of wdRows[0].values) {
      existingWordDefs.add(`${row[0]}|${row[1]}`);
    }
  }
  console.log(`Loaded ${existingWordDefs.size} existing word-definition links.`);

  // Current sequence trackers
  let maxWordId = db.exec("SELECT max(id) FROM words")[0].values[0][0] || 0;
  let maxDefId = db.exec("SELECT max(id) FROM definitions")[0].values[0][0] || 0;
  let maxPronId = db.exec("SELECT max(id) FROM pronunciations")[0].values[0][0] || 0;
  let maxWordDefId = db.exec("SELECT max(id) FROM word_definitions")[0].values[0][0] || 0;

  // Prepare SQLite insert statements
  const insertWordStmt = db.prepare("INSERT INTO words (id, word, lang_code) VALUES (?, ?, 'en')");
  const insertPronStmt = db.prepare("INSERT INTO pronunciations (id, word_id, ipa, region) VALUES (?, ?, ?, ?)");
  const insertDefStmt = db.prepare("INSERT INTO definitions (id, definition, pos, sub_pos, definition_lang) VALUES (?, ?, ?, ?, 'vi')");
  const insertWordDefStmt = db.prepare("INSERT INTO word_definitions (id, word_id, definition_id, example) VALUES (?, ?, ?, ?)");

  // -----------------------------------------------------------------
  // STEP 1: IMPORT CURATED COMPUTER SCIENCE TERMS
  // -----------------------------------------------------------------
  console.log(`\nImporting ${csTerms.length} curated Computer Science & IT terms...`);
  db.run("BEGIN TRANSACTION;");

  let csAdded = 0;
  let csUpdated = 0;

  for (const item of csTerms) {
    const lowerWord = item.word.toLowerCase();
    let wordId = existingWords.get(lowerWord);

    if (!wordId) {
      maxWordId++;
      wordId = maxWordId;
      insertWordStmt.run([wordId, item.word]);
      existingWords.set(lowerWord, wordId);
      csAdded++;
    } else {
      csUpdated++;
    }

    // Pronunciation
    if (item.ipa) {
      const pronKey = `${wordId}|${item.ipa}|${item.region || ''}`;
      if (!existingPronunciations.has(pronKey)) {
        maxPronId++;
        insertPronStmt.run([maxPronId, wordId, item.ipa, item.region || null]);
        existingPronunciations.add(pronKey);
      }
    }

    // Definition
    const defKey = `${item.pos || ''}||${item.definition}`;
    let defId = existingDefinitions.get(defKey);
    if (!defId) {
      maxDefId++;
      defId = maxDefId;
      insertDefStmt.run([defId, item.definition, item.pos, null]);
      existingDefinitions.set(defKey, defId);
    }

    // Word definition link
    const linkKey = `${wordId}|${defId}`;
    if (!existingWordDefs.has(linkKey)) {
      maxWordDefId++;
      insertWordDefStmt.run([maxWordDefId, wordId, defId, item.example || null]);
      existingWordDefs.add(linkKey);
    }
  }

  db.run("COMMIT;");
  console.log(`CS Terms: Added ${csAdded} new words, updated/enriched ${csUpdated} existing words.`);

  // -----------------------------------------------------------------
  // STEP 2: IMPORT STARDICT 235,561 ENTRIES
  // -----------------------------------------------------------------
  console.log('\nLoading and gunzipping StarDict dictionary files...');
  const gzBuf = fs.readFileSync('Database/stardict_extracted/tudien-stardict-en-vi-20260411.dict.dz');
  const dictBuf = zlib.gunzipSync(gzBuf);
  const idxBuf = fs.readFileSync('Database/stardict_extracted/tudien-stardict-en-vi-20260411.idx');
  console.log(`StarDict dictionary uncompressed size: ${(dictBuf.length / (1024 * 1024)).toFixed(2)} MB`);

  const wordPattern = /^[a-zA-Z0-9]+([a-zA-Z0-9\s'-]*[a-zA-Z0-9])?$/;
  let pos = 0;
  let starTotal = 0;
  let starAddedWords = 0;
  let starAddedPron = 0;
  let batchCount = 0;

  db.run("BEGIN TRANSACTION;");

  while (pos < idxBuf.length) {
    const nullPos = idxBuf.indexOf(0, pos);
    if (nullPos === -1) break;
    const word = idxBuf.toString('utf8', pos, nullPos);
    const offset = idxBuf.readUInt32BE(nullPos + 1);
    const size = idxBuf.readUInt32BE(nullPos + 5);
    pos = nullPos + 9;
    starTotal++;

    const trimmed = word.trim();
    if (trimmed.length < 2 || trimmed.length > 50) continue;
    if (!wordPattern.test(trimmed)) continue;
    if (trimmed.split(/\s+/).length > 4) continue;
    if (!/[a-zA-Z]/.test(trimmed)) continue;
    // Skip noisy wedding anniversary entries
    if (/wedding anniversar/i.test(trimmed)) continue;

    const lowerWord = trimmed.toLowerCase();
    const isNewWord = !existingWords.has(lowerWord);

    // If new word, or if existing word might need missing IPAs
    if (isNewWord) {
      const rawHtml = dictBuf.toString('utf8', offset, offset + size);
      const parsed = parseStarDictEntry(rawHtml, trimmed);

      if (parsed.definitions.length === 0) continue;

      maxWordId++;
      const wordId = maxWordId;
      insertWordStmt.run([wordId, trimmed]);
      existingWords.set(lowerWord, wordId);
      starAddedWords++;

      // Insert pronunciations
      for (const p of parsed.pronunciations) {
        const pronKey = `${wordId}|${p.ipa}|${p.region || ''}`;
        if (!existingPronunciations.has(pronKey)) {
          maxPronId++;
          insertPronStmt.run([maxPronId, wordId, p.ipa, p.region]);
          existingPronunciations.add(pronKey);
          starAddedPron++;
        }
      }

      // Insert definitions and links
      for (const def of parsed.definitions) {
        const defKey = `${def.pos || ''}||${def.definition}`;
        let defId = existingDefinitions.get(defKey);
        if (!defId) {
          maxDefId++;
          defId = maxDefId;
          insertDefStmt.run([defId, def.definition, def.pos, null]);
          existingDefinitions.set(defKey, defId);
        }

        const linkKey = `${wordId}|${defId}`;
        if (!existingWordDefs.has(linkKey)) {
          maxWordDefId++;
          insertWordDefStmt.run([maxWordDefId, wordId, defId, def.example]);
          existingWordDefs.add(linkKey);
        }
      }

      batchCount++;
      if (batchCount % 10000 === 0) {
        db.run("COMMIT;");
        db.run("BEGIN TRANSACTION;");
        console.log(`Processed ${starTotal} StarDict entries... Added ${starAddedWords} words so far.`);
      }
    }
  }

  db.run("COMMIT;");
  console.log(`\nFinished parsing all ${starTotal} StarDict entries.`);
  console.log(`Added ${starAddedWords} new words and ${starAddedPron} new pronunciations from StarDict.`);

  // Free prepared statements
  insertWordStmt.free();
  insertPronStmt.free();
  insertDefStmt.free();
  insertWordDefStmt.free();

  // Update sqlite_sequence for tables with AUTOINCREMENT
  db.run(`UPDATE sqlite_sequence SET seq = ${maxDefId} WHERE name = 'definitions'`);
  db.run(`UPDATE sqlite_sequence SET seq = ${maxPronId} WHERE name = 'pronunciations'`);
  db.run(`UPDATE sqlite_sequence SET seq = ${maxWordDefId} WHERE name = 'word_definitions'`);

  // Optimize & Vacuum database
  console.log('Running VACUUM and ANALYZE on SQLite database...');
  db.run("ANALYZE;");

  // Export back to file
  console.log('Exporting SQLite database to disk...');
  const exportedData = db.export();
  const finalBuffer = Buffer.from(exportedData);
  fs.writeFileSync(dbPath, finalBuffer);

  const finalMb = (finalBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`Database saved successfully to ${dbPath} (${finalMb} MB)!`);

  // Print final statistics
  const totalWords = db.exec("SELECT count(*) FROM words WHERE lang_code = 'en'")[0].values[0][0];
  const totalDefs = db.exec("SELECT count(*) FROM definitions")[0].values[0][0];
  const totalProns = db.exec("SELECT count(*) FROM pronunciations")[0].values[0][0];
  const totalLinks = db.exec("SELECT count(*) FROM word_definitions")[0].values[0][0];

  console.log('\n=== FINAL DATABASE STATISTICS ===');
  console.log(`Words:             ${totalWords.toLocaleString()}`);
  console.log(`Pronunciations:    ${totalProns.toLocaleString()}`);
  console.log(`Definitions:       ${totalDefs.toLocaleString()}`);
  console.log(`Word Definitions:  ${totalLinks.toLocaleString()}`);

  db.close();
  console.timeEnd('Total Import Time');
}

main().catch(err => {
  console.error('ERROR during import:', err);
  process.exit(1);
});
