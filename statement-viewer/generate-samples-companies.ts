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
} from 'stated-protocol';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Go up one level from dist to project root
const PROJECT_ROOT = join(__dirname, '..');
const MEDIA_DIR = join(PROJECT_ROOT, 'media');

// Business A deployment (business-a.com) - DEFAULT
const BUSINESS_A_DIR = join(PROJECT_ROOT, '.well-known-business-a');
const BUSINESS_A_STATEMENTS_DIR = join(BUSINESS_A_DIR, 'statements');
const BUSINESS_A_ATTACHMENTS_DIR = join(BUSINESS_A_STATEMENTS_DIR, 'attachments');
const BUSINESS_A_PEERS_DIR = join(BUSINESS_A_STATEMENTS_DIR, 'peers');

// Business D deployment (business-d.com)
const BUSINESS_D_DIR = join(PROJECT_ROOT, '.well-known-business-d');
const BUSINESS_D_STATEMENTS_DIR = join(BUSINESS_D_DIR, 'statements');
const BUSINESS_D_ATTACHMENTS_DIR = join(BUSINESS_D_STATEMENTS_DIR, 'attachments');
const BUSINESS_D_PEERS_DIR = join(BUSINESS_D_STATEMENTS_DIR, 'peers');

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

interface CompanyInfo {
    domain: string;
    author: string;
    country: string;
    sector: string;
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
        await rm(BUSINESS_A_DIR, { recursive: true, force: true });
        await rm(BUSINESS_D_DIR, { recursive: true, force: true });
        console.log('Cleaned old company data');
    } catch (error) {
        console.log('No old company data to clean');
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
    companies: CompanyInfo[];
}> {
    console.log(`\nGenerating sample statements for ${deploymentName}...`);

    const statements: string[] = [];
    const statementFiles: string[] = [];
    const attachmentFiles: string[] = [];

    const companies: CompanyInfo[] = [
        {
            domain: 'business-a.com',
            author: 'Business A - Technology Solutions',
            country: 'Germany',
            sector: 'Technology',
            profileImage: 'company-a.png',
        },
        {
            domain: 'business-b.com',
            author: 'Business B - Manufacturing Group',
            country: 'France',
            sector: 'Manufacturing',
            profileImage: 'company-b.png',
        },
        {
            domain: 'business-c.com',
            author: 'Business C - Financial Services',
            country: 'Netherlands',
            sector: 'Finance',
            profileImage: 'company-c.png',
        },
        {
            domain: 'business-d.com',
            author: 'Business D - Energy Corporation',
            country: 'Spain',
            sector: 'Energy',
            profileImage: 'company-d.png',
        },
        {
            domain: 'business-e.com',
            author: 'Business E - Logistics Network',
            country: 'Italy',
            sector: 'Logistics',
            profileImage: 'company-e.png',
        },
    ];

    // Generate key pairs for each company
    for (const company of companies) {
        const { publicKey, privateKey } = await generateKeyPair();
        company.publicKey = publicKey;
        company.privateKey = privateKey;
    }

    // Get references to all companies for use in statements
    const businessA = companies[0];
    const businessB = companies[1];
    const businessC = companies[2];
    const businessD = companies[3];
    const businessE = companies[4];
    const { publicKey, privateKey } = { publicKey: businessA.publicKey!, privateKey: businessA.privateKey! };

    console.log('\nGenerating company self-verification statements...');
    for (const company of companies) {
        // Read and create profile picture attachment
        const profileContent = await readFile(join(MEDIA_DIR, company.profileImage));
        const profileFilename = await createAttachment(paths.attachmentsDir, company.profileImage, profileContent);
        attachmentFiles.push(profileFilename);

        // Create self-verification statement with pictureHash
        const selfVerification = buildOrganisationVerificationContent({
            name: company.author,
            country: company.country,
            legalForm: 'corporation',
            domain: company.domain,
            confidence: 0.95,
            publicKey: company.publicKey,
            pictureHash: profileFilename,
        });

        const verificationStatement = buildStatement({
            domain: company.domain,
            author: company.author,
            time: new Date('2024-01-01T08:00:00Z'),
            tags: ['self-verification', 'company-profile', 'eu-business'],
            content: selfVerification,
        });

        const signedVerification = await buildSignedStatement(
            verificationStatement,
            company.privateKey!,
            company.publicKey!
        );
        statements.push(signedVerification);
        console.log(`Created self-verification for ${company.domain}`);
    }

    // 1. Plain statement with signature - Joint sustainability initiative
    const statement1 = buildStatement({
        domain: 'business-a.com',
        author: 'Business A - Technology Solutions',
        time: new Date('2024-05-15T10:00:00Z'),
        tags: ['announcement', 'sustainability', 'eu-initiative'],
        content: 'We are pleased to announce the launch of the EU Companies Sustainability Initiative, a collaborative framework for achieving carbon neutrality by 2030.',
    });
    const signedStatement1 = await buildSignedStatement(statement1, privateKey, publicKey);
    statements.push(signedStatement1);

    // 2. Poll statement (from Business C)
    const pollContent = buildPollContent({
        poll: 'Should the EU Companies Initiative mandate quarterly sustainability reporting?',
        options: ['Yes, mandatory quarterly reports', 'No, annual reports are sufficient', 'Biannual reports as compromise'],
        deadline: new Date('2024-12-31T23:59:59Z'),
        scopeDescription: 'All participating EU companies in the initiative',
        allowArbitraryVote: false,
    });
    const statement2 = buildStatement({
        domain: businessC.domain,
        author: businessC.author,
        time: new Date('2024-06-20T14:30:00Z'),
        tags: ['poll', 'sustainability', 'reporting'],
        content: pollContent,
    });
    const signedStatement2 = await buildSignedStatement(statement2, businessC.privateKey!, businessC.publicKey!);
    statements.push(signedStatement2);
    
    // Calculate the poll statement hash for use in votes
    const pollStatementHash = sha256(signedStatement2);

    // 3. Organization verification (Business A verifies Business B)
    const orgVerification = buildOrganisationVerificationContent({
        name: 'Business B - Manufacturing Group',
        country: 'France',
        legalForm: 'corporation',
        domain: 'business-b.com',
        confidence: 0.95,
        publicKey: businessB.publicKey,
    });
    const statement3 = buildStatement({
        domain: 'business-a.com',
        author: 'Business A - Technology Solutions',
        time: new Date('2024-03-10T09:15:00Z'),
        tags: ['verification', 'business-relations', 'eu-network'],
        content: orgVerification,
    });
    statements.push(statement3);

    // 4. Statement with translations (from Business B)
    const statement4 = buildStatement({
        domain: businessB.domain,
        author: businessB.author,
        time: new Date('2024-06-18T16:45:00Z'),
        tags: ['multilingual', 'partnership', 'eu-collaboration'],
        content: 'We welcome all EU companies to join the sustainability initiative and contribute to our shared environmental goals.',
        translations: {
            de: 'Wir heißen alle EU-Unternehmen willkommen, sich der Nachhaltigkeitsinitiative anzuschließen und zu unseren gemeinsamen Umweltzielen beizutragen.',
            fr: 'Nous accueillons toutes les entreprises de l\'UE pour rejoindre l\'initiative de durabilité et contribuer à nos objectifs environnementaux communs.',
            es: 'Damos la bienvenida a todas las empresas de la UE para unirse a la iniciativa de sostenibilidad y contribuir a nuestros objetivos ambientales compartidos.',
            it: 'Diamo il benvenuto a tutte le aziende dell\'UE per unirsi all\'iniziativa di sostenibilità e contribuire ai nostri obiettivi ambientali condivisi.',
            nl: 'We verwelkomen alle EU-bedrijven om deel te nemen aan het duurzaamheidsinitiatief en bij te dragen aan onze gedeelde milieudoelen.',
        },
    });
    const signedStatement4 = await buildSignedStatement(statement4, businessB.privateKey!, businessB.publicKey!);
    statements.push(signedStatement4);

    // 5. Statement with 2 images - Sustainability report visuals
    const image1Content = await readFile(join(MEDIA_DIR, 'image1.png'));
    const image2Content = await readFile(join(MEDIA_DIR, 'image2.png'));
    const image1Filename = await createAttachment(paths.attachmentsDir, 'image1.png', image1Content);
    const image2Filename = await createAttachment(paths.attachmentsDir, 'image2.png', image2Content);
    attachmentFiles.push(image1Filename, image2Filename);
    
    const statement5 = buildStatement({
        domain: businessD.domain,
        author: businessD.author,
        time: new Date('2024-06-10T11:20:00Z'),
        tags: ['visual-content', 'sustainability-report', 'energy-transition'],
        content: 'Visual overview of our renewable energy transition roadmap. These charts demonstrate our progress toward 100% renewable energy sources and carbon neutrality targets.',
        attachments: [image1Filename, image2Filename],
    });
    const signedStatement5 = await buildSignedStatement(statement5, businessD.privateKey!, businessD.publicKey!);
    statements.push(signedStatement5);

    // 6. Statement with PDF document - Sustainability framework
    const pdfContent = await readFile(join(MEDIA_DIR, 'document.pdf'));
    const pdfFilename = await createAttachment(paths.attachmentsDir, 'document.pdf', pdfContent);
    attachmentFiles.push(pdfFilename);
    
    const statement6 = buildStatement({
        domain: businessC.domain,
        author: businessC.author,
        time: new Date('2024-06-08T14:30:00Z'),
        tags: ['publication', 'sustainability-framework', 'best-practices'],
        content: 'We are pleased to share our comprehensive EU Sustainability Framework document. This publication outlines best practices for corporate environmental responsibility and provides actionable guidelines for sustainable business operations.',
        attachments: [pdfFilename],
    });
    const signedStatement6 = await buildSignedStatement(statement6, businessC.privateKey!, businessC.publicKey!);
    statements.push(signedStatement6);

    // 6b. Statement with video (from Business E)
    const videoContent = await readFile(join(MEDIA_DIR, 'video.mp4'));
    const videoFilename = await createAttachment(paths.attachmentsDir, 'video.mp4', videoContent);
    attachmentFiles.push(videoFilename);
    
    const statement6b = buildStatement({
        domain: businessE.domain,
        author: businessE.author,
        time: new Date('2024-06-05T10:00:00Z'),
        tags: ['video', 'announcement', 'green-logistics'],
        content: 'Watch our video presentation on sustainable logistics solutions. This presentation showcases our innovative approaches to reducing carbon emissions in supply chain operations and highlights our commitment to green transportation.',
        attachments: [videoFilename],
    });
    const signedStatement6b = await buildSignedStatement(statement6b, businessE.privateKey!, businessE.publicKey!);
    statements.push(signedStatement6b);

    // 6c. Joint agreement PDF signing statements from all companies
    const agreementPdfContent = await readFile(join(MEDIA_DIR, 'treaty.pdf'));
    const agreementPdfFilename = await createAttachment(paths.attachmentsDir, 'treaty.pdf', agreementPdfContent);
    attachmentFiles.push(agreementPdfFilename);
    
    // Extract just the hash part (without extension) for PDF signing
    const agreementPdfHash = agreementPdfFilename.split('.')[0];
    
    // All companies sign the joint sustainability agreement PDF
    const pdfSigningContent = buildPDFSigningContent({
        hash: agreementPdfHash,
    });
    
    // Business A signs (initiator)
    const pdfSignStatement1 = buildStatement({
        domain: businessA.domain,
        author: businessA.author,
        time: new Date('2024-06-15T10:00:00Z'),
        tags: ['agreement-signature', 'pdf-signing', 'sustainability-commitment'],
        content: pdfSigningContent,
    });
    const signedPdfSign1 = await buildSignedStatement(pdfSignStatement1, businessA.privateKey!, businessA.publicKey!);
    statements.push(signedPdfSign1);
    
    // Business B signs
    const pdfSignStatement2 = buildStatement({
        domain: businessB.domain,
        author: businessB.author,
        time: new Date('2024-06-15T11:30:00Z'),
        tags: ['agreement-signature', 'pdf-signing', 'sustainability-commitment'],
        content: pdfSigningContent,
    });
    const signedPdfSign2 = await buildSignedStatement(pdfSignStatement2, businessB.privateKey!, businessB.publicKey!);
    statements.push(signedPdfSign2);
    
    // Business C signs
    const pdfSignStatement3 = buildStatement({
        domain: businessC.domain,
        author: businessC.author,
        time: new Date('2024-06-15T14:15:00Z'),
        tags: ['agreement-signature', 'pdf-signing', 'sustainability-commitment'],
        content: pdfSigningContent,
    });
    const signedPdfSign3 = await buildSignedStatement(pdfSignStatement3, businessC.privateKey!, businessC.publicKey!);
    statements.push(signedPdfSign3);
    
    // Business D signs
    const pdfSignStatement4 = buildStatement({
        domain: businessD.domain,
        author: businessD.author,
        time: new Date('2024-06-15T09:45:00Z'),
        tags: ['agreement-signature', 'pdf-signing', 'sustainability-commitment'],
        content: pdfSigningContent,
    });
    const signedPdfSign4 = await buildSignedStatement(pdfSignStatement4, businessD.privateKey!, businessD.publicKey!);
    statements.push(signedPdfSign4);
    
    // Business E signs
    const pdfSignStatement5 = buildStatement({
        domain: businessE.domain,
        author: businessE.author,
        time: new Date('2024-06-15T16:20:00Z'),
        tags: ['agreement-signature', 'pdf-signing', 'sustainability-commitment'],
        content: pdfSigningContent,
    });
    const signedPdfSign5 = await buildSignedStatement(pdfSignStatement5, businessE.privateKey!, businessE.publicKey!);
    statements.push(signedPdfSign5);

    // 7. Vote statements for the poll
    const voteContent = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the EU Companies Initiative mandate quarterly sustainability reporting?',
        vote: 'Yes, mandatory quarterly reports',
    });
    const statement7 = buildStatement({
        domain: businessB.domain,
        author: businessB.author,
        time: new Date('2024-06-21T10:30:00Z'),
        tags: ['vote', 'reporting-policy'],
        content: voteContent,
    });
    const signedStatement7 = await buildSignedStatement(statement7, businessB.privateKey!, businessB.publicKey!);
    statements.push(signedStatement7);
    
    // Additional vote statements
    const voteContent2 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the EU Companies Initiative mandate quarterly sustainability reporting?',
        vote: 'Yes, mandatory quarterly reports',
    });
    const statement7b = buildStatement({
        domain: businessC.domain,
        author: businessC.author,
        time: new Date('2024-06-21T09:15:00Z'),
        tags: ['vote', 'reporting-policy'],
        content: voteContent2,
    });
    const signedStatement7b = await buildSignedStatement(statement7b, businessC.privateKey!, businessC.publicKey!);
    statements.push(signedStatement7b);
    
    const voteContent3 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the EU Companies Initiative mandate quarterly sustainability reporting?',
        vote: 'Biannual reports as compromise',
    });
    const statement7c = buildStatement({
        domain: businessD.domain,
        author: businessD.author,
        time: new Date('2024-06-21T14:20:00Z'),
        tags: ['vote', 'reporting-policy'],
        content: voteContent3,
    });
    const signedStatement7c = await buildSignedStatement(statement7c, businessD.privateKey!, businessD.publicKey!);
    statements.push(signedStatement7c);
    
    const voteContent4 = buildVoteContent({
        pollHash: pollStatementHash,
        poll: 'Should the EU Companies Initiative mandate quarterly sustainability reporting?',
        vote: 'Yes, mandatory quarterly reports',
    });
    const statement7d = buildStatement({
        domain: businessE.domain,
        author: businessE.author,
        time: new Date('2024-06-21T11:45:00Z'),
        tags: ['vote', 'reporting-policy'],
        content: voteContent4,
    });
    const signedStatement7d = await buildSignedStatement(statement7d, businessE.privateKey!, businessE.publicKey!);
    statements.push(signedStatement7d);

    // 8. Statement superseding another
    const statement8 = buildStatement({
        domain: 'business-a.com',
        author: 'Business A - Technology Solutions',
        time: new Date('2024-05-20T08:00:00Z'),
        tags: ['correction', 'initiative-update'],
        content: 'Correction: The EU Companies Sustainability Initiative will launch in Q4 2024, not Q3 as previously announced. This adjustment allows for more comprehensive stakeholder consultations and framework refinement.',
        supersededStatement: sha256(signedStatement1),
    });
    const signedStatement8 = await buildSignedStatement(statement8, privateKey, publicKey);
    statements.push(signedStatement8);

    // 9. Recent statement
    const statement9 = buildStatement({
        domain: businessB.domain,
        author: businessB.author,
        time: new Date(),
        tags: ['news', 'progress-update', 'eu-collaboration'],
        content: 'We are pleased to report significant progress in the EU Companies Sustainability Initiative. Five major corporations have now formally committed to the framework, representing over 50,000 employees and €10 billion in combined annual revenue.',
    });
    const signedStatement9 = await buildSignedStatement(statement9, businessB.privateKey!, businessB.publicKey!);
    statements.push(signedStatement9);

    // 10. Statement with deliberately corrupted signature (for demonstration)
    const statement10 = buildStatement({
        domain: 'unverified-business.com',
        author: 'Unverified Corporation',
        time: new Date('2024-06-15T16:00:00Z'),
        tags: ['security', 'demonstration'],
        content: 'This statement has a tampered signature to demonstrate signature verification failure in business communications.',
    });
    const signedStatement10 = await buildSignedStatement(statement10, privateKey, publicKey);
    // Deliberately corrupt the signature
    const corruptedStatement10 = signedStatement10.replace(/Signature: ([A-Za-z0-9_-]+)/, (match: string, sig: string) => {
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

    return { statements, statementFiles, attachmentFiles, companies };
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
            time: new Date('2024-06-16T14:30:00Z'),
            tags: ['response', 'initiative-support'],
            content: responseContent,
        });

        const signedResponseStatement = await buildSignedStatement(responseStatement, privateKey, publicKey);

        // Append to peer's statements.txt
        const statementsFilePath = join(peerDir, 'statements.txt');
        try {
            const existingStatementsContent = await readFile(statementsFilePath, 'utf-8');
            const existingStatements = parseStatementsFile(existingStatementsContent);
            const allStatements = [...existingStatements, signedResponseStatement];
            await writeFile(statementsFilePath, generateStatementsFile(allStatements));
        } catch {
            await writeFile(statementsFilePath, signedResponseStatement);
        }
        console.log(`Updated: statements/peers/${peer.domain}/statements.txt`);

        // Write individual statement file
        const hash = sha256(signedResponseStatement);
        const filename = `${hash}.txt`;
        await writeFile(join(peerStatementsDir, filename), signedResponseStatement);
        console.log(`Created: statements/peers/${peer.domain}/statements/${filename}`);

        // Update peer's statements index
        const indexFilePath = join(peerStatementsDir, 'index.txt');
        try {
            const existingIndex = await readFile(indexFilePath, 'utf-8');
            await writeFile(indexFilePath, existingIndex + '\n' + filename);
        } catch {
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

        // Write peer directory index
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
    // Filter statements by domain
    const ownStatements: string[] = [];
    const ownStatementFiles: string[] = [];
    
    for (let i = 0; i < statements.length; i++) {
        if (statements[i].includes(`Publishing domain: ${ownDomain}`)) {
            ownStatements.push(statements[i]);
            ownStatementFiles.push(statementFiles[i]);
        }
    }

    // Write individual statement files
    for (let i = 0; i < ownStatements.length; i++) {
        const filepath = join(paths.statementsDir, ownStatementFiles[i]);
        await writeFile(filepath, ownStatements[i]);
    }

    // Write statements.txt
    await writeFile(join(paths.wellKnownDir, 'statements.txt'), generateStatementsFile(ownStatements));

    // Write statements/index.txt
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

    // Write peers index.txt
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
            
            // Parse statement to extract attachments
            try {
                const parsed = parseStatement({ statement: statements[i] });
                
                if (parsed.attachments && Array.isArray(parsed.attachments)) {
                    parsed.attachments.forEach(att => peerAttachmentFiles.add(att));
                }
                
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
        return;
    }

    // Create peer directories
    const { peerDir, peerStatementsDir, peerAttachmentsDir } = await ensurePeerDirectories(peersDir, peerDomain);

    // Copy attachments
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
    const businessAPaths: DeploymentPaths = {
        wellKnownDir: BUSINESS_A_DIR,
        statementsDir: BUSINESS_A_STATEMENTS_DIR,
        attachmentsDir: BUSINESS_A_ATTACHMENTS_DIR,
        peersDir: BUSINESS_A_PEERS_DIR,
    };
    
    const businessDPaths: DeploymentPaths = {
        wellKnownDir: BUSINESS_D_DIR,
        statementsDir: BUSINESS_D_STATEMENTS_DIR,
        attachmentsDir: BUSINESS_D_ATTACHMENTS_DIR,
        peersDir: BUSINESS_D_PEERS_DIR,
    };

    // Ensure directories for both deployments
    await ensureDirectories(businessAPaths);
    await ensureDirectories(businessDPaths);

    // Generate statements once
    const { statements, statementFiles, attachmentFiles, companies } =
        await generateSampleStatements(businessAPaths, 'Business A (business-a.com)');

    console.log('\n=== Business A Deployment ===');
    console.log('Business A statements in main directory');
    console.log('Other companies statements in peers directory');
    
    // Write Business A's own statements to main directory
    await writeDeploymentFiles(
        businessAPaths,
        'business-a.com',
        statements,
        statementFiles,
        attachmentFiles,
        ['business-b.com', 'business-c.com', 'business-d.com', 'business-e.com']
    );
    
    // Write other companies' statements to peers directories
    await writePeerStatements(businessAPaths.peersDir, 'business-b.com', statements, statementFiles, businessAPaths.attachmentsDir);
    await writePeerStatements(businessAPaths.peersDir, 'business-c.com', statements, statementFiles, businessAPaths.attachmentsDir);
    await writePeerStatements(businessAPaths.peersDir, 'business-d.com', statements, statementFiles, businessAPaths.attachmentsDir);
    await writePeerStatements(businessAPaths.peersDir, 'business-e.com', statements, statementFiles, businessAPaths.attachmentsDir);
    
    // Add response statement from Business B
    const businessBPeers: PeerInfo[] = [
        {
            domain: 'business-b.com',
            author: 'Business B - Manufacturing Group',
            response: 'We fully support the EU Companies Sustainability Initiative and commit to active participation in all framework development phases.',
        },
    ];
    const businessAInitiativeStatement = statements.find(s =>
        s.includes('business-a.com') &&
        s.includes('EU Companies Sustainability Initiative')
    );
    await generatePeerReplications(businessAPaths.peersDir, businessAInitiativeStatement!, businessBPeers);
    
    const businessAOwnCount = statements.filter(s => s.includes('Publishing domain: business-a.com')).length;
    console.log(`✓ Business A deployment created in ${BUSINESS_A_DIR}`);
    console.log(`  - ${businessAOwnCount} own statements in main directory`);
    console.log(`  - ${attachmentFiles.length} attachments`);
    console.log(`  - 4 peer domains with their statements`);

    console.log('\n=== Business D Deployment ===');
    console.log('Business D statements in main directory');
    console.log('Other companies statements in peers directory');
    
    // Copy attachments to Business D deployment
    for (const attachmentFile of attachmentFiles) {
        const sourcePath = join(businessAPaths.attachmentsDir, attachmentFile);
        const destPath = join(businessDPaths.attachmentsDir, attachmentFile);
        const content = await readFile(sourcePath);
        await writeFile(destPath, content);
    }
    
    // Write Business D's own statements to main directory
    await writeDeploymentFiles(
        businessDPaths,
        'business-d.com',
        statements,
        statementFiles,
        attachmentFiles,
        ['business-a.com', 'business-b.com', 'business-c.com', 'business-e.com']
    );
    
    // Write other companies' statements to peers directories
    await writePeerStatements(businessDPaths.peersDir, 'business-a.com', statements, statementFiles, businessDPaths.attachmentsDir);
    await writePeerStatements(businessDPaths.peersDir, 'business-b.com', statements, statementFiles, businessDPaths.attachmentsDir);
    await writePeerStatements(businessDPaths.peersDir, 'business-c.com', statements, statementFiles, businessDPaths.attachmentsDir);
    await writePeerStatements(businessDPaths.peersDir, 'business-e.com', statements, statementFiles, businessDPaths.attachmentsDir);
    
    // Add response statement from Business A
    const businessAPeers: PeerInfo[] = [
        {
            domain: 'business-a.com',
            author: 'Business A - Technology Solutions',
            response: 'We appreciate the support and look forward to collaborative efforts in establishing this sustainability framework.',
        },
    ];
    const businessBWelcomeStatement = statements.find(s =>
        s.includes('business-b.com') &&
        s.includes('We welcome all EU companies to join the sustainability initiative')
    );
    await generatePeerReplications(businessDPaths.peersDir, businessBWelcomeStatement!, businessAPeers);
    
    const businessDOwnCount = statements.filter(s => s.includes('Publishing domain: business-d.com')).length;
    console.log(`✓ Business D deployment created in ${BUSINESS_D_DIR}`);
    console.log(`  - ${businessDOwnCount} own statements in main directory`);
    console.log(`  - ${attachmentFiles.length} attachments`);
    console.log(`  - 4 peer domains with their statements`);

    console.log('\n✓ Both deployments generated successfully!');
    console.log(`\nGenerated ${statements.length} statements with ${attachmentFiles.length} attachments`);
    console.log(`Generated ${companies.length} company self-verifications with profile pictures`);
    console.log('\nTo view the statements:');
    console.log('Business A (default): http://localhost:3033/?baseUrl=http://localhost:3033/.well-known-business-a/statements/');
    console.log('Business D: http://localhost:3033/?baseUrl=http://localhost:3033/.well-known-business-d/statements/');
}

// Run the generator
generateBothDeployments()
    .catch((error: Error) => {
        console.error('Error generating company samples:', error);
        process.exit(1);
    });