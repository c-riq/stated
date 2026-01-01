import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
    buildStatement,
    buildPollContent,
    buildOrganisationVerificationContent,
    buildVoteContent,
    buildResponseContent,
    buildSignedStatement,
    generateKeyPair,
    sha256,
} from 'stated-protocol-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Go up one level from dist to project root
const PROJECT_ROOT = join(__dirname, '..');
const WELL_KNOWN_DIR = join(PROJECT_ROOT, '.well-known');
const STATEMENTS_DIR = join(WELL_KNOWN_DIR, 'statements');
const ATTACHMENTS_DIR = join(STATEMENTS_DIR, 'attachments');
const PEERS_DIR = join(STATEMENTS_DIR, 'peers');
const MEDIA_DIR = join(PROJECT_ROOT, 'media');

interface PeerDirectories {
    peerDir: string;
    peerStatementsDir: string;
    peerAttachmentsDir: string;
}

interface PeerInfo {
    domain: string;
    author: string;
    response: string;
}

interface MinistryInfo {
    domain: string;
    author: string;
    country: string;
    city: string;
    province: string;
    profileImage: string;
    publicKey?: string;
    privateKey?: string;
}

async function ensureDirectories(): Promise<void> {
    await mkdir(WELL_KNOWN_DIR, { recursive: true });
    await mkdir(STATEMENTS_DIR, { recursive: true });
    await mkdir(ATTACHMENTS_DIR, { recursive: true });
    await mkdir(PEERS_DIR, { recursive: true });
}

async function ensurePeerDirectories(peerDomain: string): Promise<PeerDirectories> {
    const peerDir = join(PEERS_DIR, peerDomain);
    const peerStatementsDir = join(peerDir, 'statements');
    const peerAttachmentsDir = join(peerStatementsDir, 'attachments');
    await mkdir(peerDir, { recursive: true });
    await mkdir(peerStatementsDir, { recursive: true });
    await mkdir(peerAttachmentsDir, { recursive: true });
    return { peerDir, peerStatementsDir, peerAttachmentsDir };
}

async function createAttachment(filename: string, content: Buffer): Promise<string> {
    const hash = sha256(content);
    const ext = filename.split('.').pop();
    const attachmentFilename = `${hash}.${ext}`;
    const attachmentPath = join(ATTACHMENTS_DIR, attachmentFilename);
    await writeFile(attachmentPath, content);
    return attachmentFilename;
}

async function generateSampleStatements(): Promise<void> {
    console.log('Generating sample statements...');

    const statements: string[] = [];
    const statementFiles: string[] = [];
    const attachmentFiles: string[] = [];

    // Define all ministries with their information
    const ministries: MinistryInfo[] = [
        {
            domain: 'foreign.atlantea.gov',
            author: 'Ministry of Foreign Affairs of Atlantea',
            country: 'Atlantea',
            city: 'New Atlantis',
            province: 'Capital District',
            profileImage: 'profile1.jpg',
        },
        {
            domain: 'foreign.pacifica.gov',
            author: 'Ministry of Foreign Affairs of Pacifica',
            country: 'Pacifica',
            city: 'Port Azure',
            province: 'Central District',
            profileImage: 'profile2.jpg',
        },
        {
            domain: 'foreign.nordica.gov',
            author: 'Ministry of Foreign Affairs of Nordica',
            country: 'Nordica',
            city: 'Frostholm',
            province: 'Northern Territory',
            profileImage: 'profile3.jpg',
        },
        {
            domain: 'foreign.australis.gov',
            author: 'Ministry of Foreign Affairs of Australis',
            country: 'Australis',
            city: 'Southern Bay',
            province: 'Coastal Region',
            profileImage: 'profile4.jpg',
        },
        {
            domain: 'foreign.meridia.gov',
            author: 'Ministry of Foreign Affairs of Meridia',
            country: 'Meridia',
            city: 'Sunhaven',
            province: 'Eastern Province',
            profileImage: 'profile5.jpg',
        },
    ];

    // Generate key pairs for each ministry
    for (const ministry of ministries) {
        const { publicKey, privateKey } = await generateKeyPair();
        ministry.publicKey = publicKey;
        ministry.privateKey = privateKey;
    }

    // Get the first ministry (Atlantea) for initial statements
    const atlantea = ministries[0];
    const { publicKey, privateKey } = { publicKey: atlantea.publicKey!, privateKey: atlantea.privateKey! };

    // 0. Self-verification statements for each ministry with profile pictures
    console.log('\nGenerating ministry self-verification statements...');
    for (const ministry of ministries) {
        // Read and create profile picture attachment
        const profileContent = await readFile(join(MEDIA_DIR, ministry.profileImage));
        const profileFilename = await createAttachment(ministry.profileImage, profileContent);
        attachmentFiles.push(profileFilename);

        // Create self-verification statement with pictureHash
        const selfVerification = buildOrganisationVerificationContent({
            name: ministry.author,
            englishName: ministry.author,
            country: ministry.country,
            city: ministry.city,
            province: ministry.province,
            legalForm: 'foreign affairs ministry',
            domain: ministry.domain,
            foreignDomain: ministry.domain,
            serialNumber: `GOV-${ministry.country.toUpperCase().substring(0, 3)}-2024-001`,
            employeeCount: '1000-10,000',
            confidence: 1.0,
            publicKey: ministry.publicKey,
            pictureHash: profileFilename,
        });

        const verificationStatement = buildStatement({
            domain: ministry.domain,
            author: ministry.author,
            time: new Date('2024-01-01T08:00:00Z'),
            tags: ['self-verification', 'ministry-profile'],
            content: selfVerification,
        });

        const signedVerification = await buildSignedStatement(
            verificationStatement,
            ministry.privateKey!,
            ministry.publicKey!
        );
        statements.push(signedVerification);
        console.log(`Created self-verification for ${ministry.domain}`);
    }

    // 1. Plain statement with signature
    const statement1 = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date('2024-01-15T10:00:00Z'),
        tags: ['announcement', 'treaty'],
        content: 'We are pleased to announce the initiation of multilateral treaty negotiations on digital cooperation frameworks.',
    });
    const signedStatement1 = await buildSignedStatement(statement1, privateKey, publicKey);
    statements.push(signedStatement1);

    // 2. Poll statement
    const pollContent = buildPollContent({
        poll: 'Should the treaty include provisions for cross-border data protection?',
        options: ['Yes, with strict enforcement', 'Yes, with flexible implementation', 'No', 'Requires further study'],
        deadline: new Date('2024-12-31T23:59:59Z'),
        scopeDescription: 'All participating foreign ministries',
        allowArbitraryVote: false,
    });
    const statement2 = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date('2024-02-01T14:30:00Z'),
        tags: ['poll', 'treaty-negotiation'],
        content: pollContent,
    });
    statements.push(statement2);
    
    // Calculate the poll statement hash for use in vote
    const pollStatementHash = sha256(statement2);

    // 3. Organisation verification (Atlantea verifying Pacifica)
    const pacificaMinistry = ministries.find(m => m.domain === 'foreign.pacifica.gov')!;
    const orgVerification = buildOrganisationVerificationContent({
        name: 'Ministry of Foreign Affairs of Pacifica',
        englishName: 'Ministry of Foreign Affairs of Pacifica',
        country: 'Pacifica',
        city: 'Port Azure',
        province: 'Central District',
        legalForm: 'foreign affairs ministry',
        domain: 'foreign.pacifica.gov',
        foreignDomain: 'foreign.atlantea.gov',
        serialNumber: 'GOV-PAC-2024-001',
        employeeCount: '1000-10,000',
        confidence: 0.98,
        publicKey: pacificaMinistry.publicKey,
    });
    const statement3 = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date('2024-03-10T09:15:00Z'),
        tags: ['verification', 'diplomatic-relations'],
        content: orgVerification,
    });
    statements.push(statement3);

    // 4. Statement with translations
    const statement4 = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date('2024-04-05T16:45:00Z'),
        tags: ['multilingual', 'treaty-announcement'],
        content: 'We welcome all nations to participate in the digital cooperation treaty negotiations.',
        translations: {
            es: 'Damos la bienvenida a todas las naciones a participar en las negociaciones del tratado de cooperación digital.',
            fr: 'Nous accueillons toutes les nations pour participer aux négociations du traité de coopération numérique.',
            de: 'Wir heißen alle Nationen willkommen, an den Verhandlungen über den Vertrag zur digitalen Zusammenarbeit teilzunehmen.',
        },
    });
    statements.push(statement4);

    // 5. Statement with 2 images - read and hash the actual files
    const image1Content = await readFile(join(MEDIA_DIR, 'image1.png'));
    const image2Content = await readFile(join(MEDIA_DIR, 'image2.png'));
    const image1Filename = await createAttachment('image1.png', image1Content);
    const image2Filename = await createAttachment('image2.png', image2Content);
    attachmentFiles.push(image1Filename, image2Filename);
    
    const statement5 = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date('2024-05-20T11:20:00Z'),
        tags: ['visual-content', 'global-coordination'],
        content: 'Proposed visual designs for the global coordination website. These mockups demonstrate the user interface for treaty monitoring and diplomatic collaboration.',
        attachments: [image1Filename, image2Filename],
    });
    const signedStatement5 = await buildSignedStatement(statement5, privateKey, publicKey);
    statements.push(signedStatement5);

    // 6. Statement with PDF document - read and hash the actual file
    const pdfContent = await readFile(join(MEDIA_DIR, 'document.pdf'));
    const pdfFilename = await createAttachment('document.pdf', pdfContent);
    attachmentFiles.push(pdfFilename);
    
    const statement6 = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date('2024-05-21T14:30:00Z'),
        tags: ['publication', 'digital-diplomacy'],
        content: 'We are pleased to share our comprehensive publication on digital diplomacy practices. This document explores innovative approaches to international relations in the digital age and provides insights for modern diplomatic engagement.',
        attachments: [pdfFilename],
    });
    const signedStatement6 = await buildSignedStatement(statement6, privateKey, publicKey);
    statements.push(signedStatement6);
    // 6b. Statement with video - read and hash the actual file
    const videoContent = await readFile(join(MEDIA_DIR, 'video.mp4'));
    const videoFilename = await createAttachment('video.mp4', videoContent);
    attachmentFiles.push(videoFilename);
    
    const statement6b = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date('2024-05-22T10:00:00Z'),
        tags: ['video', 'announcement', 'digital-cooperation'],
        content: 'Watch our video message on the importance of international digital cooperation. This presentation outlines our vision for collaborative frameworks in the digital age and highlights key initiatives for cross-border data governance.',
        attachments: [videoFilename],
    });
    const signedStatement6b = await buildSignedStatement(statement6b, privateKey, publicKey);
    statements.push(signedStatement6b);


    // 7. Vote statement - using actual poll hash (with Pacifica's key)
    const pacifica = ministries.find(m => m.domain === 'foreign.pacifica.gov')!;
    const voteContent = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the treaty include provisions for cross-border data protection?',
        vote: 'Yes, with strict enforcement',
    });
    const statement7 = buildStatement({
        domain: pacifica.domain,
        author: pacifica.author,
        time: new Date('2024-02-15T10:30:00Z'),
        tags: ['vote', 'treaty-position'],
        content: voteContent,
    });
    const signedStatement7 = await buildSignedStatement(statement7, pacifica.privateKey!, pacifica.publicKey!);
    statements.push(signedStatement7);
    
    // 7b. Additional vote statements for the same poll (with Nordica's key)
    const nordica = ministries.find(m => m.domain === 'foreign.nordica.gov')!;
    const voteContent2 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the treaty include provisions for cross-border data protection?',
        vote: 'Yes, with flexible implementation',
    });
    const statement7b = buildStatement({
        domain: nordica.domain,
        author: nordica.author,
        time: new Date('2024-02-16T09:15:00Z'),
        tags: ['vote', 'treaty-position'],
        content: voteContent2,
    });
    const signedStatement7b = await buildSignedStatement(statement7b, nordica.privateKey!, nordica.publicKey!);
    statements.push(signedStatement7b);
    
    const australis = ministries.find(m => m.domain === 'foreign.australis.gov')!;
    const voteContent3 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the treaty include provisions for cross-border data protection?',
        vote: 'Requires further study',
    });
    const statement7c = buildStatement({
        domain: australis.domain,
        author: australis.author,
        time: new Date('2024-02-17T14:20:00Z'),
        tags: ['vote', 'treaty-position'],
        content: voteContent3,
    });
    const signedStatement7c = await buildSignedStatement(statement7c, australis.privateKey!, australis.publicKey!);
    statements.push(signedStatement7c);
    
    const meridia = ministries.find(m => m.domain === 'foreign.meridia.gov')!;
    const voteContent4 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the treaty include provisions for cross-border data protection?',
        vote: 'Yes, with strict enforcement',
    });
    const statement7d = buildStatement({
        domain: meridia.domain,
        author: meridia.author,
        time: new Date('2024-02-18T11:45:00Z'),
        tags: ['vote', 'treaty-position'],
        content: voteContent4,
    });
    const signedStatement7d = await buildSignedStatement(statement7d, meridia.privateKey!, meridia.publicKey!);
    statements.push(signedStatement7d);

    // 8. Statement superseding another
    const statement8 = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date('2024-06-01T08:00:00Z'),
        tags: ['correction', 'treaty-update'],
        content: 'Correction: The multilateral treaty negotiations will commence in Q3, not Q2 as previously announced. This adjustment allows for more comprehensive preparatory consultations.',
        supersededStatement: sha256(statement1),
    });
    statements.push(statement8);

    // 9. Recent statement
    const statement9 = buildStatement({
        domain: 'foreign.atlantea.gov',
        author: 'Ministry of Foreign Affairs of Atlantea',
        time: new Date(),
        tags: ['news', 'diplomatic-progress'],
        content: 'We are pleased to report significant progress in the treaty negotiations. Five nations have now formally committed to the digital cooperation framework, marking a milestone in international diplomatic collaboration.',
    });
    const signedStatement9 = await buildSignedStatement(statement9, privateKey, publicKey);
    statements.push(signedStatement9);

    // 10. Statement with deliberately corrupted signature (for demonstration)
    const statement10 = buildStatement({
        domain: 'foreign.unverified.gov',
        author: 'Unverified Ministry',
        time: new Date('2024-06-15T16:00:00Z'),
        tags: ['security', 'demonstration'],
        content: 'This statement has a tampered signature to demonstrate signature verification failure in diplomatic communications.',
    });
    const signedStatement10 = await buildSignedStatement(statement10, privateKey, publicKey);
    // Deliberately corrupt the signature by changing one character
    const corruptedStatement10 = signedStatement10.replace(/Signature: ([A-Za-z0-9_-]+)/, (match: string, sig: string) => {
        // Change the first character of the signature
        const corruptedSig = 'X' + sig.substring(1);
        return `Signature: ${corruptedSig}`;
    });
    statements.push(corruptedStatement10);

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
    await writeFile(join(ATTACHMENTS_DIR, 'index.txt'), attachmentFiles.join('\n'));
    console.log('Created: statements/attachments/index.txt');

    // Generate peer replication data
    await generatePeerReplications(signedStatement1);

    console.log('\n✓ Sample data generated successfully!');
    console.log(`\nGenerated ${statements.length} statements with ${attachmentFiles.length} attachments`);
    console.log(`Generated ${ministries.length} ministry self-verifications with profile pictures`);
    console.log('Generated 2 peer domains with response statements');
    console.log('\nTo view the statements:');
    console.log('1. Run: npm start');
    console.log('2. Open: http://localhost:3033/?baseUrl=http://localhost:3033/.well-known/statements/');
}

async function generatePeerReplications(referencedStatement: string): Promise<void> {
    console.log('\nGenerating peer replication data...');
    
    const peers: PeerInfo[] = [
        {
            domain: 'foreign.pacifica.gov',
            author: 'Ministry of Foreign Affairs of Pacifica',
            response: 'We fully support the digital cooperation treaty initiative and commit to active participation in all negotiation phases.',
        },
        {
            domain: 'foreign.nordica.gov',
            author: 'Ministry of Foreign Affairs of Nordica',
            response: 'This is an excellent diplomatic initiative. We look forward to contributing our expertise in digital governance frameworks.',
        },
    ];

    const peerDomains: string[] = [];
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
            tags: ['response', 'treaty-support'],
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
    .catch((error: Error) => {
        console.error('Error generating samples:', error);
        process.exit(1);
    });