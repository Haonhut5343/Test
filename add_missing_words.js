const fs = require('fs');
const initSqlJs = require('sql.js');

async function main() {
  const SQL = await initSqlJs();
  const dbPath = './Database/dictionary_en_vi.db';
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  const missingWords = [
    {
      word: 'my',
      ipa: '/maɪ/',
      pos: 'PRON',
      meaning: 'Của tôi (tính từ sở hữu)',
      example: 'This is my book.'
    },
    {
      word: 'his',
      ipa: '/hɪz/',
      pos: 'PRON',
      meaning: 'Của anh ấy, của ông ấy',
      example: 'That is his car.'
    },
    {
      word: "i'll",
      ipa: '/aɪl/',
      pos: 'O',
      meaning: 'Dạng viết tắt của "I will" (Tôi sẽ)',
      example: "I'll be there soon."
    },
    {
      word: "don't",
      ipa: '/doʊnt/',
      pos: 'V',
      meaning: 'Dạng viết tắt của "do not" (Đừng, không)',
      example: "Don't worry."
    },
    {
      word: "can't",
      ipa: '/kænt/',
      pos: 'V',
      meaning: 'Dạng viết tắt của "cannot" (Không thể)',
      example: "I can't believe it."
    },
    {
      word: "it's",
      ipa: '/ɪts/',
      pos: 'PRON',
      meaning: 'Dạng viết tắt của "it is" hoặc "it has" (Nó là / Nó thì)',
      example: "It's a great day."
    },
    {
      word: "you're",
      ipa: '/jʊr/',
      pos: 'PRON',
      meaning: 'Dạng viết tắt của "you are" (Bạn là / Bạn đang)',
      example: "You're welcome."
    },
    {
      word: "we're",
      ipa: '/wɪr/',
      pos: 'PRON',
      meaning: 'Dạng viết tắt của "we are" (Chúng tôi là / Chúng ta đang)',
      example: "We're ready."
    },
    {
      word: "they're",
      ipa: '/ðer/',
      pos: 'PRON',
      meaning: 'Dạng viết tắt của "they are" (Họ là / Chúng nó là)',
      example: "They're here."
    },
    {
      word: "that's",
      ipa: '/ðæts/',
      pos: 'PRON',
      meaning: 'Dạng viết tắt của "that is" (Đó là)',
      example: "That's awesome."
    },
    {
      word: "what's",
      ipa: '/wʌts/',
      pos: 'PRON',
      meaning: 'Dạng viết tắt của "what is" (Cái gì là / Có chuyện gì)',
      example: "What's up?"
    },
    {
      word: "didn't",
      ipa: '/ˈdɪdənt/',
      pos: 'V',
      meaning: 'Dạng viết tắt của "did not" (Đã không)',
      example: "I didn't know."
    },
    {
      word: "won't",
      ipa: '/woʊnt/',
      pos: 'V',
      meaning: 'Dạng viết tắt của "will not" (Sẽ không)',
      example: "I won't let you down."
    }
  ];

  console.log(`Checking and adding ${missingWords.length} common words/contractions to SQLite DB...`);

  for (const item of missingWords) {
    // Check if word exists
    const checkStmt = db.prepare("SELECT id FROM words WHERE word = :w AND lang_code = 'en'");
    checkStmt.bind({ ':w': item.word });
    const exists = checkStmt.step();
    let wordId = exists ? checkStmt.getAsObject().id : null;
    checkStmt.free();

    if (!wordId) {
      db.run("INSERT INTO words (word, lang_code) VALUES (?, 'en')", [item.word]);
      const getWordIdStmt = db.prepare("SELECT id FROM words WHERE word = ? AND lang_code = 'en'");
      getWordIdStmt.bind([item.word]);
      getWordIdStmt.step();
      wordId = getWordIdStmt.getAsObject().id;
      getWordIdStmt.free();

      // Add pronunciation
      if (item.ipa) {
        db.run("INSERT INTO pronunciations (word_id, ipa, region) VALUES (?, ?, 'US')", [wordId, item.ipa]);
      }

      // Add definition
      db.run("INSERT INTO definitions (definition, pos, definition_lang) VALUES (?, ?, 'vi')", [item.meaning, item.pos]);
      const getDefIdStmt = db.prepare("SELECT id FROM definitions WHERE definition = ? AND pos = ?");
      getDefIdStmt.bind([item.meaning, item.pos]);
      getDefIdStmt.step();
      const defId = getDefIdStmt.getAsObject().id;
      getDefIdStmt.free();

      // Link word_definitions
      db.run("INSERT INTO word_definitions (word_id, definition_id, example) VALUES (?, ?, ?)", [wordId, defId, item.example]);
      console.log(`Added: "${item.word}" (id: ${wordId})`);
    } else {
      console.log(`Already exists: "${item.word}" (id: ${wordId})`);
    }
  }

  // Export database back to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log(`Database updated successfully! File size: ${(buffer.length / (1024*1024)).toFixed(2)} MB`);
  db.close();
}

main().catch(console.error);
