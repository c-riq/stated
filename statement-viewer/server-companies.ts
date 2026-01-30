import express, { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..');
const PORT = 3034;

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

// Redirect /.well-known to /.well-known-business-a
app.use('/.well-known', express.static(join(PROJECT_ROOT, '.well-known-business-a')));

// Serve config-companies.json as config.json
app.get('/config.json', (req: Request, res: Response) => {
    res.sendFile(join(PROJECT_ROOT, 'config-companies.json'));
});

// Serve index-companies.html as the default index
app.get('/', (req: Request, res: Response) => {
    res.sendFile(join(PROJECT_ROOT, 'index-companies.html'));
});

app.use(express.static(PROJECT_ROOT));

app.listen(PORT, () => {
    console.log(`Statement Viewer (Companies) server running at http://localhost:${PORT}/`);
    console.log(`View Business A statements at: http://localhost:${PORT}/`);
    console.log(`Browse files at: http://localhost:${PORT}/browser.html`);
});