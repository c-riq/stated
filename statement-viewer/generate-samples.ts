import { writeFile, mkdir, readFile, rm } from 'fs/promises';
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
    buildPDFSigningContent,
    generateKeyPair,
    sha256,
    generateStatementsFile,
    parseStatementsFile,
    parseStatement,
    parseOrganisationVerification,
} from 'stated-protocol-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Go up one level from dist to project root
const PROJECT_ROOT = join(__dirname, '..');
const MEDIA_DIR = join(PROJECT_ROOT, 'media');

// Country A deployment (mofa.country-a.com) - DEFAULT
const COUNTRY_A_DIR = join(PROJECT_ROOT, '.well-known');
const COUNTRY_A_STATEMENTS_DIR = join(COUNTRY_A_DIR, 'statements');
const COUNTRY_A_ATTACHMENTS_DIR = join(COUNTRY_A_STATEMENTS_DIR, 'attachments');
const COUNTRY_A_PEERS_DIR = join(COUNTRY_A_STATEMENTS_DIR, 'peers');

// Country B deployment (mofa.country-b.com)
const COUNTRY_B_DIR = join(PROJECT_ROOT, '.well-known-country-b');
const COUNTRY_B_STATEMENTS_DIR = join(COUNTRY_B_DIR, 'statements');
const COUNTRY_B_ATTACHMENTS_DIR = join(COUNTRY_B_STATEMENTS_DIR, 'attachments');
const COUNTRY_B_PEERS_DIR = join(COUNTRY_B_STATEMENTS_DIR, 'peers');

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
    profileImage: string;
    publicKey?: string;
    privateKey?: string;
}

interface DeploymentPaths {
    wellKnownDir: string;
    statementsDir: string;
    attachmentsDir: string;
    peersDir: string;
}

async function cleanOldData(): Promise<void> {
    try {
        await rm(COUNTRY_A_DIR, { recursive: true, force: true });
        await rm(COUNTRY_B_DIR, { recursive: true, force: true });
        console.log('Cleaned old data');
    } catch (error) {
        console.log('No old data to clean');
    }
}

async function ensureDirectories(paths: DeploymentPaths): Promise<void> {
    await mkdir(paths.wellKnownDir, { recursive: true });
    await mkdir(paths.statementsDir, { recursive: true });
    await mkdir(paths.attachmentsDir, { recursive: true });
    await mkdir(paths.peersDir, { recursive: true });
}

async function ensurePeerDirectories(peersDir: string, peerDomain: string): Promise<PeerDirectories> {
    const peerDir = join(peersDir, peerDomain);
    const peerStatementsDir = join(peerDir, 'statements');
    const peerAttachmentsDir = join(peerStatementsDir, 'attachments');
    await mkdir(peerDir, { recursive: true });
    await mkdir(peerStatementsDir, { recursive: true });
    await mkdir(peerAttachmentsDir, { recursive: true });
    return { peerDir, peerStatementsDir, peerAttachmentsDir };
}

async function createAttachment(attachmentsDir: string, filename: string, content: Buffer): Promise<string> {
    const hash = sha256(content);
    const ext = filename.split('.').pop();
    const attachmentFilename = `${hash}.${ext}`;
    const attachmentPath = join(attachmentsDir, attachmentFilename);
    await writeFile(attachmentPath, content);
    return attachmentFilename;
}

async function generateSampleStatements(paths: DeploymentPaths, deploymentName: string): Promise<{
    statements: string[];
    statementFiles: string[];
    attachmentFiles: string[];
    ministries: MinistryInfo[];
}> {
    console.log(`\nGenerating sample statements for ${deploymentName}...`);

    const statements: string[] = [];
    const statementFiles: string[] = [];
    const attachmentFiles: string[] = [];

    const ministries: MinistryInfo[] = [
        {
            domain: 'mofa.country-a.com',
            author: 'Ministry of Foreign Affairs of Country A',
            country: 'Country A',
            profileImage: 'profile1.png',
        },
        {
            domain: 'mofa.country-b.com',
            author: 'Ministry of Foreign Affairs of Country B',
            country: 'Country B',
            profileImage: 'profile2.png',
        },
        {
            domain: 'mofa.country-c.com',
            author: 'Ministry of Foreign Affairs of Country C',
            country: 'Country C',
            profileImage: 'profile3.png',
        },
        {
            domain: 'mofa.country-d.com',
            author: 'Ministry of Foreign Affairs of Country D',
            country: 'Country D',
            profileImage: 'profile4.png',
        },
        {
            domain: 'mofa.country-e.com',
            author: 'Ministry of Foreign Affairs of Country E',
            country: 'Country E',
            profileImage: 'profile5.png',
        },
    ];

    // Generate key pairs for each ministry
    for (const ministry of ministries) {
        const { publicKey, privateKey } = await generateKeyPair();
        ministry.publicKey = publicKey;
        ministry.privateKey = privateKey;
    }

    // Get references to all ministries for use in statements
    const countryA = ministries[0];
    const countryB = ministries[1];
    const countryC = ministries[2];
    const countryD = ministries[3];
    const countryE = ministries[4];
    const { publicKey, privateKey } = { publicKey: countryA.publicKey!, privateKey: countryA.privateKey! };

    console.log('\nGenerating ministry self-verification statements...');
    for (const ministry of ministries) {
        // Read and create profile picture attachment
        const profileContent = await readFile(join(MEDIA_DIR, ministry.profileImage));
        const profileFilename = await createAttachment(paths.attachmentsDir, ministry.profileImage, profileContent);
        attachmentFiles.push(profileFilename);

        // Create self-verification statement with pictureHash
        const selfVerification = buildOrganisationVerificationContent({
            name: ministry.author,
            country: ministry.country,
            legalForm: 'foreign affairs ministry',
            domain: ministry.domain,
            confidence: 0.98,
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
        domain: 'mofa.country-a.com',
        author: 'Ministry of Foreign Affairs of Country A',
        time: new Date('2024-01-15T10:00:00Z'),
        tags: ['announcement', 'treaty'],
        content: 'We are pleased to announce the initiation of multilateral treaty negotiations on digital cooperation frameworks.',
    });
    const signedStatement1 = await buildSignedStatement(statement1, privateKey, publicKey);
    statements.push(signedStatement1);

    // 2. Poll statement (from Country C)
    const pollContent = buildPollContent({
        poll: 'Should the AI Safety Treaty include an upper limit on model size?',
        options: ['Yes', 'No'],
        deadline: new Date('2024-12-31T23:59:59Z'),
        scopeDescription: 'All participating foreign ministries',
        allowArbitraryVote: false,
    });
    const statement2 = buildStatement({
        domain: countryC.domain,
        author: countryC.author,
        time: new Date('2024-02-01T14:30:00Z'),
        tags: ['poll', 'treaty-negotiation'],
        content: pollContent,
    });
    const signedStatement2 = await buildSignedStatement(statement2, countryC.privateKey!, countryC.publicKey!);
    statements.push(signedStatement2);
    
    // Calculate the poll statement hash for use in vote (use the signed version)
    const pollStatementHash = sha256(signedStatement2);

    const countryBMinistry = ministries.find(m => m.domain === 'mofa.country-b.com')!;
    const orgVerification = buildOrganisationVerificationContent({
        name: 'Ministry of Foreign Affairs of Country B',
        country: 'Country B',
        legalForm: 'foreign affairs ministry',
        domain: 'mofa.country-b.com',
        confidence: 0.98,
        publicKey: countryBMinistry.publicKey,
    });
    const statement3 = buildStatement({
        domain: 'mofa.country-a.com',
        author: 'Ministry of Foreign Affairs of Country A',
        time: new Date('2024-03-10T09:15:00Z'),
        tags: ['verification', 'diplomatic-relations'],
        content: orgVerification,
    });
    statements.push(statement3);

    // 4. Statement with translations (from Country B)
    const statement4 = buildStatement({
        domain: countryB.domain,
        author: countryB.author,
        time: new Date('2024-04-05T16:45:00Z'),
        tags: ['multilingual', 'treaty-announcement'],
        content: 'We welcome all nations to participate in the AI safety treaty negotiations.',
        translations: {
            es: 'Damos la bienvenida a todas las naciones a participar en las negociaciones del tratado de seguridad de IA.',
            fr: 'Nous accueillons toutes les nations pour participer aux négociations du traité de sécurité de l\'IA.',
            de: 'Wir heißen alle Nationen willkommen, an den Verhandlungen über den KI-Sicherheitsvertrag teilzunehmen.',
            zh: '我们欢迎所有国家参与人工智能安全条约谈判。',
            ar: 'نرحب بجميع الدول للمشاركة في مفاوضات معاهدة سلامة الذكاء الاصطناعي.',
            ja: 'AI安全条約交渉への全ての国の参加を歓迎します。',
        },
    });
    const signedStatement4 = await buildSignedStatement(statement4, countryB.privateKey!, countryB.publicKey!);
    statements.push(signedStatement4);

    // 5. Statement with 2 images - read and hash the actual files
    const image1Content = await readFile(join(MEDIA_DIR, 'image1.png'));
    const image2Content = await readFile(join(MEDIA_DIR, 'image2.png'));
    const image1Filename = await createAttachment(paths.attachmentsDir, 'image1.png', image1Content);
    const image2Filename = await createAttachment(paths.attachmentsDir, 'image2.png', image2Content);
    attachmentFiles.push(image1Filename, image2Filename);
    
    const statement5 = buildStatement({
        domain: 'mofa.country-a.com',
        author: 'Ministry of Foreign Affairs of Country A',
        time: new Date('2024-05-20T11:20:00Z'),
        tags: ['visual-content', 'global-coordination'],
        content: 'Proposed visual designs for the global coordination website. These mockups demonstrate the user interface for treaty monitoring and diplomatic collaboration.',
        attachments: [image1Filename, image2Filename],
    });
    const signedStatement5 = await buildSignedStatement(statement5, privateKey, publicKey);
    statements.push(signedStatement5);

    // 6. Statement with PDF document - read and hash the actual file
    const pdfContent = await readFile(join(MEDIA_DIR, 'document.pdf'));
    const pdfFilename = await createAttachment(paths.attachmentsDir, 'document.pdf', pdfContent);
    attachmentFiles.push(pdfFilename);
    
    const statement6 = buildStatement({
        domain: 'mofa.country-a.com',
        author: 'Ministry of Foreign Affairs of Country A',
        time: new Date('2024-05-21T14:30:00Z'),
        tags: ['publication', 'digital-diplomacy'],
        content: 'We are pleased to share our comprehensive publication on digital diplomacy practices. This document explores innovative approaches to international relations in the digital age and provides insights for modern diplomatic engagement.',
        attachments: [pdfFilename],
    });
    const signedStatement6 = await buildSignedStatement(statement6, privateKey, publicKey);
    statements.push(signedStatement6);
    // 6b. Statement with video (from Country E)
    const videoContent = await readFile(join(MEDIA_DIR, 'video.mp4'));
    const videoFilename = await createAttachment(paths.attachmentsDir, 'video.mp4', videoContent);
    attachmentFiles.push(videoFilename);
    
    const statement6b = buildStatement({
        domain: countryE.domain,
        author: countryE.author,
        time: new Date('2024-05-22T10:00:00Z'),
        tags: ['video', 'announcement', 'ai-safety'],
        content: 'Watch our video message on the importance of international AI safety cooperation. This presentation outlines our vision for collaborative frameworks in AI governance and highlights key initiatives for responsible AI development.',
        attachments: [videoFilename],
    });
    const signedStatement6b = await buildSignedStatement(statement6b, countryE.privateKey!, countryE.publicKey!);
    statements.push(signedStatement6b);

    // 6c. Treaty PDF signing statements from all countries (NO statement with attachment)
    const treatyPdfContent = await readFile(join(MEDIA_DIR, 'treaty.pdf'));
    const treatyPdfFilename = await createAttachment(paths.attachmentsDir, 'treaty.pdf', treatyPdfContent);
    attachmentFiles.push(treatyPdfFilename);
    
    // Extract just the hash part (without extension) for PDF signing
    const treatyPdfHash = treatyPdfFilename.split('.')[0];
    
    // All countries sign the treaty PDF directly (no separate statement with attachment)
    const pdfSigningContent = buildPDFSigningContent({
        hash: treatyPdfHash,
    });
    
    // Country A signs (publisher)
    const pdfSignStatement1 = buildStatement({
        domain: countryA.domain,
        author: countryA.author,
        time: new Date('2024-05-23T10:00:00Z'),
        tags: ['treaty-signature', 'pdf-signing'],
        content: pdfSigningContent,
    });
    const signedPdfSign1 = await buildSignedStatement(pdfSignStatement1, countryA.privateKey!, countryA.publicKey!);
    statements.push(signedPdfSign1);
    
    // Country B signs
    const pdfSignStatement2 = buildStatement({
        domain: countryB.domain,
        author: countryB.author,
        time: new Date('2024-05-24T11:30:00Z'),
        tags: ['treaty-signature', 'pdf-signing'],
        content: pdfSigningContent,
    });
    const signedPdfSign2 = await buildSignedStatement(pdfSignStatement2, countryB.privateKey!, countryB.publicKey!);
    statements.push(signedPdfSign2);
    
    // Country C signs
    const pdfSignStatement3 = buildStatement({
        domain: countryC.domain,
        author: countryC.author,
        time: new Date('2024-05-25T14:15:00Z'),
        tags: ['treaty-signature', 'pdf-signing'],
        content: pdfSigningContent,
    });
    const signedPdfSign3 = await buildSignedStatement(pdfSignStatement3, countryC.privateKey!, countryC.publicKey!);
    statements.push(signedPdfSign3);
    
    // Country D signs
    const pdfSignStatement4 = buildStatement({
        domain: countryD.domain,
        author: countryD.author,
        time: new Date('2024-05-26T09:45:00Z'),
        tags: ['treaty-signature', 'pdf-signing'],
        content: pdfSigningContent,
    });
    const signedPdfSign4 = await buildSignedStatement(pdfSignStatement4, countryD.privateKey!, countryD.publicKey!);
    statements.push(signedPdfSign4);
    
    // Country E signs
    const pdfSignStatement5 = buildStatement({
        domain: countryE.domain,
        author: countryE.author,
        time: new Date('2024-05-27T16:20:00Z'),
        tags: ['treaty-signature', 'pdf-signing'],
        content: pdfSigningContent,
    });
    const signedPdfSign5 = await buildSignedStatement(pdfSignStatement5, countryE.privateKey!, countryE.publicKey!);
    statements.push(signedPdfSign5);

    // 7. Vote statement - using actual poll hash (with Country B's key)
    const voteContent = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the AI Safety Treaty include an upper limit on model size?',
        vote: 'Yes',
    });
    const statement7 = buildStatement({
        domain: countryB.domain,
        author: countryB.author,
        time: new Date('2024-02-15T10:30:00Z'),
        tags: ['vote', 'treaty-position'],
        content: voteContent,
    });
    const signedStatement7 = await buildSignedStatement(statement7, countryB.privateKey!, countryB.publicKey!);
    statements.push(signedStatement7);
    
    // 7b. Additional vote statements for the same poll (with Country C's key)
    const voteContent2 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the AI Safety Treaty include an upper limit on model size?',
        vote: 'Yes',
    });
    const statement7b = buildStatement({
        domain: countryC.domain,
        author: countryC.author,
        time: new Date('2024-02-16T09:15:00Z'),
        tags: ['vote', 'treaty-position'],
        content: voteContent2,
    });
    const signedStatement7b = await buildSignedStatement(statement7b, countryC.privateKey!, countryC.publicKey!);
    statements.push(signedStatement7b);
    
    const voteContent3 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the AI Safety Treaty include an upper limit on model size?',
        vote: 'No',
    });
    const statement7c = buildStatement({
        domain: countryD.domain,
        author: countryD.author,
        time: new Date('2024-02-17T14:20:00Z'),
        tags: ['vote', 'treaty-position'],
        content: voteContent3,
    });
    const signedStatement7c = await buildSignedStatement(statement7c, countryD.privateKey!, countryD.publicKey!);
    statements.push(signedStatement7c);
    
    const voteContent4 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the AI Safety Treaty include an upper limit on model size?',
        vote: 'Yes',
    });
    const statement7d = buildStatement({
        domain: countryE.domain,
        author: countryE.author,
        time: new Date('2024-02-18T11:45:00Z'),
        tags: ['vote', 'treaty-position'],
        content: voteContent4,
    });
    const signedStatement7d = await buildSignedStatement(statement7d, countryE.privateKey!, countryE.publicKey!);
    statements.push(signedStatement7d);

    // 8. Statement superseding another - must reference the SIGNED statement hash
    const statement8 = buildStatement({
        domain: 'mofa.country-a.com',
        author: 'Ministry of Foreign Affairs of Country A',
        time: new Date('2024-06-01T08:00:00Z'),
        tags: ['correction', 'treaty-update'],
        content: 'Correction: The multilateral treaty negotiations will commence in Q3, not Q2 as previously announced. This adjustment allows for more comprehensive preparatory consultations.',
        supersededStatement: sha256(signedStatement1),
    });
    const signedStatement8 = await buildSignedStatement(statement8, privateKey, publicKey);
    statements.push(signedStatement8);

    // 9. Recent statement
    const statement9 = buildStatement({
        domain: 'mofa.country-a.com',
        author: 'Ministry of Foreign Affairs of Country A',
        time: new Date(),
        tags: ['news', 'diplomatic-progress'],
        content: 'We are pleased to report significant progress in the treaty negotiations. Five nations have now formally committed to the digital cooperation framework, marking a milestone in international diplomatic collaboration.',
    });
    const signedStatement9 = await buildSignedStatement(statement9, privateKey, publicKey);
    statements.push(signedStatement9);

    // 10. Statement with deliberately corrupted signature (for demonstration)
    const statement10 = buildStatement({
        domain: 'mofa.unverified.com',
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
        const filepath = join(paths.statementsDir, filename);
        await writeFile(filepath, statement);
        statementFiles.push(filename);
    }

    // Write statements.txt (all statements concatenated)
    const allStatements = statements.join('\n\n');
    await writeFile(join(paths.wellKnownDir, 'statements.txt'), allStatements);

    // Write statements/index.txt with files and directories
    const statementsIndexContent = [
        'attachments/',
        'peers/',
        'index.txt',
        ...statementFiles
    ].join('\n');
    await writeFile(join(paths.statementsDir, 'index.txt'), statementsIndexContent);

    // Write attachments index.txt
    const attachmentsIndexContent = [
        'index.txt',
        ...attachmentFiles
    ].join('\n');
    await writeFile(join(paths.attachmentsDir, 'index.txt'), attachmentsIndexContent);

    return { statements, statementFiles, attachmentFiles, ministries };
}

async function generatePeerReplications(
    peersDir: string,
    referencedStatement: string,
    peers: PeerInfo[]
): Promise<string[]> {
    const peerDomains: string[] = [];
    const statementHash = sha256(referencedStatement);

    for (const peer of peers) {
        peerDomains.push(peer.domain);
        
        // Create peer directories
        const { peerDir, peerStatementsDir, peerAttachmentsDir } = await ensurePeerDirectories(peersDir, peer.domain);

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

        // Append to peer's statements.txt (if it exists, otherwise create it)
        const statementsFilePath = join(peerDir, 'statements.txt');
        try {
            const existingStatementsContent = await readFile(statementsFilePath, 'utf-8');
            const existingStatements = parseStatementsFile(existingStatementsContent);
            const allStatements = [...existingStatements, signedResponseStatement];
            await writeFile(statementsFilePath, generateStatementsFile(allStatements));
        } catch {
            // File doesn't exist, create it
            await writeFile(statementsFilePath, signedResponseStatement);
        }
        console.log(`Updated: statements/peers/${peer.domain}/statements.txt`);

        // Write individual statement file
        const hash = sha256(signedResponseStatement);
        const filename = `${hash}.txt`;
        await writeFile(join(peerStatementsDir, filename), signedResponseStatement);
        console.log(`Created: statements/peers/${peer.domain}/statements/${filename}`);

        // Update peer's statements index - append the new filename
        const indexFilePath = join(peerStatementsDir, 'index.txt');
        try {
            const existingIndex = await readFile(indexFilePath, 'utf-8');
            await writeFile(indexFilePath, existingIndex + '\n' + filename);
        } catch {
            // File doesn't exist, create it
            const peerStatementsIndexContent = [
                'attachments/',
                'index.txt',
                filename
            ].join('\n');
            await writeFile(indexFilePath, peerStatementsIndexContent);
        }
        console.log(`Updated: statements/peers/${peer.domain}/statements/index.txt`);

        // Write peer's attachments index
        const peerAttachmentsIndexContent = 'index.txt';
        await writeFile(join(peerAttachmentsDir, 'index.txt'), peerAttachmentsIndexContent);
        console.log(`Created: statements/peers/${peer.domain}/statements/attachments/index.txt`);

        // Write metadata.json
        const metadata = {
            lastSyncedTime: new Date().toISOString(),
            peerDomain: peer.domain,
        };
        await writeFile(join(peerDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
        console.log(`Created: statements/peers/${peer.domain}/metadata.json`);

        // Write peer directory index with files and directories
        const peerDirIndexContent = [
            'statements/',
            'metadata.json',
            'statements.txt'
        ].join('\n');
        await writeFile(join(peerDir, 'index.txt'), peerDirIndexContent);
        console.log(`Created: statements/peers/${peer.domain}/index.txt`);
    }

    return peerDomains;
}

async function writeDeploymentFiles(
    paths: DeploymentPaths,
    ownDomain: string,
    statements: string[],
    statementFiles: string[],
    attachmentFiles: string[],
    peerDomains: string[]
): Promise<void> {
    // Filter statements by domain - only own domain goes in main directory
    const ownStatements: string[] = [];
    const ownStatementFiles: string[] = [];
    
    for (let i = 0; i < statements.length; i++) {
        if (statements[i].includes(`Publishing domain: ${ownDomain}`)) {
            ownStatements.push(statements[i]);
            ownStatementFiles.push(statementFiles[i]);
        }
    }

    // Write individual statement files (only own domain)
    for (let i = 0; i < ownStatements.length; i++) {
        const filepath = join(paths.statementsDir, ownStatementFiles[i]);
        await writeFile(filepath, ownStatements[i]);
    }

    // Write statements.txt (only own statements)
    await writeFile(join(paths.wellKnownDir, 'statements.txt'), generateStatementsFile(ownStatements));

    // Write statements/index.txt with files and directories
    const statementsIndexContent = [
        'attachments/',
        'peers/',
        'index.txt',
        ...ownStatementFiles
    ].join('\n');
    await writeFile(join(paths.statementsDir, 'index.txt'), statementsIndexContent);

    // Write attachments index.txt
    const attachmentsIndexContent = [
        'index.txt',
        ...attachmentFiles
    ].join('\n');
    await writeFile(join(paths.attachmentsDir, 'index.txt'), attachmentsIndexContent);

    // Write peers index.txt with all peer directories
    const peersIndexContent = [
        'index.txt',
        ...peerDomains.map(domain => `${domain}/`)
    ].join('\n');
    await writeFile(join(paths.peersDir, 'index.txt'), peersIndexContent);
}

async function writePeerStatements(
    peersDir: string,
    peerDomain: string,
    statements: string[],
    statementFiles: string[],
    sourceAttachmentsDir: string
): Promise<void> {
    // Filter statements for this peer domain
    const peerStatements: string[] = [];
    const peerStatementFiles: string[] = [];
    const peerAttachmentFiles: Set<string> = new Set();
    
    for (let i = 0; i < statements.length; i++) {
        if (statements[i].includes(`Publishing domain: ${peerDomain}`)) {
            peerStatements.push(statements[i]);
            peerStatementFiles.push(statementFiles[i]);
            
            // Parse statement to extract attachments using library functions
            try {
                const parsed = parseStatement({ statement: statements[i] });
                
                // Add regular attachments
                if (parsed.attachments && Array.isArray(parsed.attachments)) {
                    parsed.attachments.forEach(att => peerAttachmentFiles.add(att));
                }
                
                // Add profile picture from organisation verification
                if (parsed.type === 'organisation_verification' && parsed.content) {
                    const orgVerification = parseOrganisationVerification(parsed.content);
                    if (orgVerification.pictureHash) {
                        peerAttachmentFiles.add(orgVerification.pictureHash);
                    }
                }
            } catch (error) {
                console.error(`Error parsing statement for attachments: ${error}`);
            }
        }
    }

    if (peerStatements.length === 0) {
        return; // No statements from this peer
    }

    // Create peer directories
    const { peerDir, peerStatementsDir, peerAttachmentsDir } = await ensurePeerDirectories(peersDir, peerDomain);

    // Copy attachments to peer's attachments directory
    for (const attachmentFile of Array.from(peerAttachmentFiles)) {
        try {
            const sourcePath = join(sourceAttachmentsDir, attachmentFile);
            const destPath = join(peerAttachmentsDir, attachmentFile);
            const content = await readFile(sourcePath);
            await writeFile(destPath, content);
        } catch (error) {
            console.error(`Warning: Could not copy attachment ${attachmentFile} for peer ${peerDomain}`);
        }
    }

    // Write peer's statements.txt
    await writeFile(join(peerDir, 'statements.txt'), generateStatementsFile(peerStatements));

    // Write individual statement files
    for (let i = 0; i < peerStatements.length; i++) {
        const filepath = join(peerStatementsDir, peerStatementFiles[i]);
        await writeFile(filepath, peerStatements[i]);
    }

    // Write peer's statements index
    const peerStatementsIndexContent = [
        'attachments/',
        'index.txt',
        ...peerStatementFiles
    ].join('\n');
    await writeFile(join(peerStatementsDir, 'index.txt'), peerStatementsIndexContent);

    // Write peer's attachments index
    const peerAttachmentsIndexContent = [
        'index.txt',
        ...Array.from(peerAttachmentFiles)
    ].join('\n');
    await writeFile(join(peerAttachmentsDir, 'index.txt'), peerAttachmentsIndexContent);

    // Write metadata.json
    const metadata = {
        lastSyncedTime: new Date().toISOString(),
        peerDomain: peerDomain,
    };
    await writeFile(join(peerDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    // Write peer directory index
    const peerDirIndexContent = [
        'statements/',
        'metadata.json',
        'statements.txt'
    ].join('\n');
    await writeFile(join(peerDir, 'index.txt'), peerDirIndexContent);
}

async function generateBothDeployments(): Promise<void> {
    await cleanOldData();
    
    // Setup paths for both deployments
    const countryAPaths: DeploymentPaths = {
        wellKnownDir: COUNTRY_A_DIR,
        statementsDir: COUNTRY_A_STATEMENTS_DIR,
        attachmentsDir: COUNTRY_A_ATTACHMENTS_DIR,
        peersDir: COUNTRY_A_PEERS_DIR,
    };
    
    const countryBPaths: DeploymentPaths = {
        wellKnownDir: COUNTRY_B_DIR,
        statementsDir: COUNTRY_B_STATEMENTS_DIR,
        attachmentsDir: COUNTRY_B_ATTACHMENTS_DIR,
        peersDir: COUNTRY_B_PEERS_DIR,
    };

    // Ensure directories for both deployments
    await ensureDirectories(countryAPaths);
    await ensureDirectories(countryBPaths);

    // Generate statements once (they will be the same for both deployments)
    const { statements, statementFiles, attachmentFiles, ministries } =
        await generateSampleStatements(countryAPaths, 'Country A (mofa.country-a.com)');

    console.log('\n=== Country A Deployment ===');
    console.log('Country A statements in main directory');
    console.log('Other countries statements in peers directory');
    
    // Write Country A's own statements to main directory
    await writeDeploymentFiles(
        countryAPaths,
        'mofa.country-a.com',
        statements,
        statementFiles,
        attachmentFiles,
        ['mofa.country-b.com', 'mofa.country-c.com', 'mofa.country-d.com', 'mofa.country-e.com']
    );
    
    // Write other countries' statements to peers directories
    await writePeerStatements(countryAPaths.peersDir, 'mofa.country-b.com', statements, statementFiles, countryAPaths.attachmentsDir);
    await writePeerStatements(countryAPaths.peersDir, 'mofa.country-c.com', statements, statementFiles, countryAPaths.attachmentsDir);
    await writePeerStatements(countryAPaths.peersDir, 'mofa.country-d.com', statements, statementFiles, countryAPaths.attachmentsDir);
    await writePeerStatements(countryAPaths.peersDir, 'mofa.country-e.com', statements, statementFiles, countryAPaths.attachmentsDir);
    
    // Add response statement from Country B
    const countryBPeers: PeerInfo[] = [
        {
            domain: 'mofa.country-b.com',
            author: 'Ministry of Foreign Affairs of Country B',
            response: 'We fully support the digital cooperation treaty initiative and commit to active participation in all negotiation phases.',
        },
    ];
    const countryAFirstStatement = statements.find(s => s.includes('mofa.country-a.com') && s.includes('Signature:'));
    await generatePeerReplications(countryAPaths.peersDir, countryAFirstStatement!, countryBPeers);
    
    const countryAOwnCount = statements.filter(s => s.includes('Publishing domain: mofa.country-a.com')).length;
    console.log(`✓ Country A deployment created in ${COUNTRY_A_DIR}`);
    console.log(`  - ${countryAOwnCount} own statements in main directory`);
    console.log(`  - ${attachmentFiles.length} attachments`);
    console.log(`  - 4 peer domains with their statements`);

    console.log('\n=== Country B Deployment ===');
    console.log('Country B statements in main directory');
    console.log('Other countries statements in peers directory');
    
    // Copy attachments to Country B deployment
    for (const attachmentFile of attachmentFiles) {
        const sourcePath = join(countryAPaths.attachmentsDir, attachmentFile);
        const destPath = join(countryBPaths.attachmentsDir, attachmentFile);
        const content = await readFile(sourcePath);
        await writeFile(destPath, content);
    }
    
    // Write Country B's own statements to main directory
    await writeDeploymentFiles(
        countryBPaths,
        'mofa.country-b.com',
        statements,
        statementFiles,
        attachmentFiles,
        ['mofa.country-a.com', 'mofa.country-c.com', 'mofa.country-d.com', 'mofa.country-e.com']
    );
    
    // Write other countries' statements to peers directories
    await writePeerStatements(countryBPaths.peersDir, 'mofa.country-a.com', statements, statementFiles, countryBPaths.attachmentsDir);
    await writePeerStatements(countryBPaths.peersDir, 'mofa.country-c.com', statements, statementFiles, countryBPaths.attachmentsDir);
    await writePeerStatements(countryBPaths.peersDir, 'mofa.country-d.com', statements, statementFiles, countryBPaths.attachmentsDir);
    await writePeerStatements(countryBPaths.peersDir, 'mofa.country-e.com', statements, statementFiles, countryBPaths.attachmentsDir);
    
    // Add response statement from Country A
    const countryAPeers: PeerInfo[] = [
        {
            domain: 'mofa.country-a.com',
            author: 'Ministry of Foreign Affairs of Country A',
            response: 'We appreciate the support and look forward to collaborative efforts in establishing this framework.',
        },
    ];
    const countryBFirstStatement = statements.find(s => s.includes('mofa.country-b.com') && s.includes('Signature:'));
    await generatePeerReplications(countryBPaths.peersDir, countryBFirstStatement!, countryAPeers);
    
    const countryBOwnCount = statements.filter(s => s.includes('Publishing domain: mofa.country-b.com')).length;
    console.log(`✓ Country B deployment created in ${COUNTRY_B_DIR}`);
    console.log(`  - ${countryBOwnCount} own statements in main directory`);
    console.log(`  - ${attachmentFiles.length} attachments`);
    console.log(`  - 4 peer domains with their statements`);

    console.log('\n✓ Both deployments generated successfully!');
    console.log(`\nGenerated ${statements.length} statements with ${attachmentFiles.length} attachments`);
    console.log(`Generated ${ministries.length} ministry self-verifications with profile pictures`);
    console.log('\nTo view the statements:');
    console.log('Country A (default): http://localhost:3033/?baseUrl=http://localhost:3033/.well-known/statements/');
    console.log('Country B: http://localhost:3033/?baseUrl=http://localhost:3033/.well-known-country-b/statements/');
}

// Run the generator
generateBothDeployments()
    .catch((error: Error) => {
        console.error('Error generating samples:', error);
        process.exit(1);
    });