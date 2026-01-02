import express, { Request, Response, NextFunction } from 'express';
import serveIndex from 'serve-index';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..');
const PORT = 3033;

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});

app.use('/.well-known', serveIndex(join(PROJECT_ROOT, '.well-known'), {
    icons: true,
    view: 'details'
}));

app.use(express.static(PROJECT_ROOT));

app.listen(PORT, () => {
    console.log(`Statement Viewer server running at http://localhost:${PORT}/`);
    console.log(`View statements at: http://localhost:${PORT}/?baseUrl=http://localhost:${PORT}/.well-known/statements/`);
    console.log(`Browse files at: http://localhost:${PORT}/.well-known/`);
});