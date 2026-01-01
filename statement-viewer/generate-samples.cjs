const { writeFile, mkdir } = require('fs/promises');
const { join } = require('path');
const {
    buildStatement,
    buildPollContent,
    buildOrganisationVerificationContent,
    buildVoteContent,
    buildResponseContent,
    buildSignedStatement,
    generateKeyPair,
    sha256,
} = require('stated-protocol-parser');

// __dirname is available in CommonJS

const WELL_KNOWN_DIR = join(__dirname, '.well-known');
const STATEMENTS_DIR = join(WELL_KNOWN_DIR, 'statements');
const ATTACHMENTS_DIR = join(STATEMENTS_DIR, 'attachments');
const PEERS_DIR = join(STATEMENTS_DIR, 'peers');

async function ensureDirectories() {
    await mkdir(WELL_KNOWN_DIR, { recursive: true });
    await mkdir(STATEMENTS_DIR, { recursive: true });
    await mkdir(ATTACHMENTS_DIR, { recursive: true });
    await mkdir(PEERS_DIR, { recursive: true });
}

async function ensurePeerDirectories(peerDomain) {
    const peerDir = join(PEERS_DIR, peerDomain);
    const peerStatementsDir = join(peerDir, 'statements');
    const peerAttachmentsDir = join(peerStatementsDir, 'attachments');
    await mkdir(peerDir, { recursive: true });
    await mkdir(peerStatementsDir, { recursive: true });
    await mkdir(peerAttachmentsDir, { recursive: true });
    return { peerDir, peerStatementsDir, peerAttachmentsDir };
}

async function createAttachment(filename, content) {
    const hash = sha256(content);
    const ext = filename.split('.').pop();
    const attachmentFilename = `${hash}.${ext}`;
    const attachmentPath = join(ATTACHMENTS_DIR, attachmentFilename);
    await writeFile(attachmentPath, content);
    return attachmentFilename;
}

async function generateSampleStatements() {
    console.log('Generating sample statements...');

    const statements = [];
    const statementFiles = [];

    // Generate key pair for signed statements
    const { publicKey, privateKey } = await generateKeyPair();

    // 1. Plain statement with signature
    const statement1 = buildStatement({
        domain: 'example.com',
        author: 'Example Organization',
        time: new Date('2024-01-15T10:00:00Z'),
        tags: ['announcement', 'update'],
        content: 'We are pleased to announce our new sustainability initiative.',
    });
    const signedStatement1 = await buildSignedStatement(statement1, privateKey, publicKey);
    statements.push(signedStatement1);

    // 2. Poll statement
    const pollContent = buildPollContent({
        poll: 'Should we implement a 4-day work week?',
        options: ['Yes', 'No', 'Need more discussion'],
        deadline: new Date('2024-12-31T23:59:59Z'),
        scopeDescription: 'All employees',
        allowArbitraryVote: false,
    });
    const statement2 = buildStatement({
        domain: 'example.com',
        author: 'Example Organization',
        time: new Date('2024-02-01T14:30:00Z'),
        tags: ['poll', 'hr'],
        content: pollContent,
    });
    statements.push(statement2);

    // 3. Organisation verification
    const orgVerification = buildOrganisationVerificationContent({
        name: 'Tech Innovations Inc.',
        englishName: 'Tech Innovations Inc.',
        country: 'United States',
        city: 'San Francisco',
        province: 'California',
        legalForm: 'corporation',
        domain: 'techinnovations.example',
        serialNumber: '123456789',
        employeeCount: '100-1000',
        confidence: '0.95',
    });
    const statement3 = buildStatement({
        domain: 'example.com',
        author: 'Example Organization',
        time: new Date('2024-03-10T09:15:00Z'),
        tags: ['verification', 'partner'],
        content: orgVerification,
    });
    statements.push(statement3);

    // 4. Statement with translations
    const statement4 = buildStatement({
        domain: 'example.com',
        author: 'Example Organization',
        time: new Date('2024-04-05T16:45:00Z'),
        tags: ['multilingual', 'announcement'],
        content: 'We are expanding our services to new markets.',
        translations: {
            es: 'Estamos expandiendo nuestros servicios a nuevos mercados.',
            fr: 'Nous étendons nos services à de nouveaux marchés.',
            de: 'Wir erweitern unsere Dienstleistungen auf neue Märkte.',
        },
    });
    statements.push(statement4);

    // 5. Statement with 2 images
    const statement5 = buildStatement({
        domain: 'example.com',
        author: 'Example Organization',
        time: new Date('2024-05-20T11:20:00Z'),
        tags: ['photos', 'event'],
        content: 'Check out these amazing photos from our recent company event!',
        attachments: ['image1.png', 'image2.png'],
    });
    const signedStatement5 = await buildSignedStatement(statement5, privateKey, publicKey);
    statements.push(signedStatement5);

    // 6. Statement with PDF document
    const statement6 = buildStatement({
        domain: 'example.com',
        author: 'Example Organization',
        time: new Date('2024-05-21T14:30:00Z'),
        tags: ['report', 'documentation'],
        content: 'Our comprehensive annual report is now available. Please review the attached document for detailed financial information and strategic insights.',
        attachments: ['document.pdf'],
    });
    const signedStatement6 = await buildSignedStatement(statement6, privateKey, publicKey);
    statements.push(signedStatement6);

    // 7. Vote statement
    const voteContent = buildVoteContent({
        pollHash: 'abc123def456',
        poll: 'Should we implement a 4-day work week?',
        vote: 'Yes',
    });
    const statement7 = buildStatement({
        domain: 'employee.example.com',
        author: 'John Doe',
        time: new Date('2024-02-15T10:30:00Z'),
        tags: ['vote'],
        content: voteContent,
    });
    statements.push(statement7);

    // 8. Statement superseding another
    const statement8 = buildStatement({
        domain: 'example.com',
        author: 'Example Organization',
        time: new Date('2024-06-01T08:00:00Z'),
        tags: ['correction', 'update'],
        content: 'Correction: Our sustainability initiative will launch in Q3, not Q2 as previously stated.',
        supersededStatement: sha256(statement1),
    });
    statements.push(statement8);

    // 9. Recent statement
    const statement9 = buildStatement({
        domain: 'example.com',
        author: 'Example Organization',
        time: new Date(),
        tags: ['news', 'announcement'],
        content: 'We are excited to share our latest achievements and milestones with the community.',
    });
    const signedStatement9 = await buildSignedStatement(statement9, privateKey, publicKey);
    statements.push(signedStatement9);

    // Write individual statement files
    for (const statement of statements) {
        const hash = sha256(statement);
        const filename = `${hash}.txt`;
        const filepath = join(STATEMENTS_DIR, filename);
        await writeFile(filepath, statement);
        statementFiles.push(filename);
        console.log(`Created: ${filename}`);
    }

    // Write statements.txt (all statements concatenated)
    const allStatements = statements.join('\n\n');
    await writeFile(join(WELL_KNOWN_DIR, 'statements.txt'), allStatements);
    console.log('Created: statements.txt');

    // Write index.txt
    await writeFile(join(STATEMENTS_DIR, 'index.txt'), statementFiles.join('\n'));
    console.log('Created: statements/index.txt');

    // Write attachments index.txt
    const attachmentFiles = ['image1.png', 'image2.png', 'document.pdf'];
    await writeFile(join(ATTACHMENTS_DIR, 'index.txt'), attachmentFiles.join('\n'));
    console.log('Created: statements/attachments/index.txt');

    // Generate peer replication data
    await generatePeerReplications(signedStatement1);

    console.log('\n✓ Sample data generated successfully!');
    console.log(`\nGenerated ${statements.length} statements with ${attachmentFiles.length} attachments`);
    console.log('Generated 2 peer domains with response statements');
    console.log('\nTo view the statements:');
    console.log('1. Run: npm start');
    console.log('2. Open: http://localhost:3033/?baseUrl=http://localhost:3033/.well-known/statements/');
}

async function generatePeerReplications(referencedStatement) {
    console.log('\nGenerating peer replication data...');
    
    const peers = [
        {
            domain: 'partner-org.example',
            author: 'Partner Organization',
            response: 'We fully support this sustainability initiative and will collaborate on implementation.',
        },
        {
            domain: 'community-group.example',
            author: 'Community Environmental Group',
            response: 'This is an excellent step forward. We look forward to seeing the concrete actions.',
        },
    ];

    const peerDomains = [];
    const statementHash = sha256(referencedStatement);

    for (const peer of peers) {
        peerDomains.push(peer.domain);
        
        // Create peer directories
        const { peerDir, peerStatementsDir, peerAttachmentsDir } = await ensurePeerDirectories(peer.domain);

        // Generate key pair for this peer
        const { publicKey, privateKey } = await generateKeyPair();

        // Create response statement
        const responseContent = buildResponseContent({
            hash: statementHash,
            response: peer.response,
        });

        const responseStatement = buildStatement({
            domain: peer.domain,
            author: peer.author,
            time: new Date('2024-01-16T14:30:00Z'),
            tags: ['response', 'sustainability'],
            content: responseContent,
        });

        const signedResponseStatement = await buildSignedStatement(responseStatement, privateKey, publicKey);

        // Write peer's statements.txt
        await writeFile(join(peerDir, 'statements.txt'), signedResponseStatement);
        console.log(`Created: statements/peers/${peer.domain}/statements.txt`);

        // Write individual statement file
        const hash = sha256(signedResponseStatement);
        const filename = `${hash}.txt`;
        await writeFile(join(peerStatementsDir, filename), signedResponseStatement);
        console.log(`Created: statements/peers/${peer.domain}/statements/${filename}`);

        // Write peer's statements index
        await writeFile(join(peerStatementsDir, 'index.txt'), filename);
        console.log(`Created: statements/peers/${peer.domain}/statements/index.txt`);

        // Write peer's attachments index (empty for now)
        await writeFile(join(peerAttachmentsDir, 'index.txt'), '');
        console.log(`Created: statements/peers/${peer.domain}/statements/attachments/index.txt`);

        // Write metadata.json
        const metadata = {
            lastSyncedTime: new Date().toISOString(),
            peerDomain: peer.domain,
        };
        await writeFile(join(peerDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
        console.log(`Created: statements/peers/${peer.domain}/metadata.json`);
    }

    // Write peers index.txt
    await writeFile(join(PEERS_DIR, 'index.txt'), peerDomains.join('\n'));
    console.log('Created: statements/peers/index.txt');
}

// Run the generator
ensureDirectories()
    .then(() => generateSampleStatements())
    .catch((error) => {
        console.error('Error generating samples:', error);
        process.exit(1);
    });