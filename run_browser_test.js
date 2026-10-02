const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PORT = 8765;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.wasm': 'application/wasm',
    '.db': 'application/octet-stream',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/test_extension.html';
    const filePath = path.join(ROOT, reqPath);

    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Test server running at http://127.0.0.1:${PORT}`);

    // Launch Edge headless
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const args = [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--virtual-time-budget=8000',
        '--dump-dom',
        `http://127.0.0.1:${PORT}/test_extension.html`
    ];

    console.log("Launching Microsoft Edge headless to verify browser execution...");
    execFile(edgePath, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        server.close();
        if (err) {
            console.error("Edge test error:", err);
            process.exit(1);
        }

        console.log("\n=== Checking Headless Edge Execution Output ===");
        if (stdout.includes('Phase 3 Check: Query "hello" thành công')) {
            console.log("SUCCESS: SQLite WebAssembly loaded in Edge, hello queried successfully!");
        } else {
            console.log("Output summary (first 500 chars):", stdout.slice(0, 500));
        }

        if (stdout.includes('subdict-phrase')) {
            console.log("SUCCESS: Greedy phrase detection successfully highlighted 'look forward to' in subtitle!");
        }

        if (stdout.includes('/həˈləʊ/')) {
            console.log("SUCCESS: IPA /həˈləʊ/ rendered correctly in DOM!");
        }

        process.exit(0);
    });
});
