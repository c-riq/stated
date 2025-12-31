import * as fs from 'fs';
import * as path from 'path';
import {
  buildStatement,
  buildPollContent,
  buildVoteContent,
  buildOrganisationVerificationContent,
  buildPersonVerificationContent,
  buildDisputeAuthenticityContent,
  buildDisputeContentContent,
  buildResponseContent,
  buildPDFSigningContent,
  buildRating,
} from '../src/protocol';
import { generateKeyPair, buildSignedStatement } from '../src/signature';

const fixturesDir = path.join(process.cwd(), 'fixtures');

async function updateFixtures() {
  const fixtureDirs = fs
    .readdirSync(fixturesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const dir of fixtureDirs) {
    const inputPath = path.join(fixturesDir, dir, 'input.json');
    const outputPath = path.join(fixturesDir, dir, 'output.txt');

    if (!fs.existsSync(inputPath)) {
      // Skip directories without input.json
      continue;
    }

    try {
      const input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

      if (input.signature) {
        await handleSignatureFixture(input, outputPath);
        continue;
      }

      let content: string;
      if (typeof input.content === 'string') {
        content = input.content;
      } else if (input.content && typeof input.content === 'object') {
        const contentObj = input.content;
        switch (contentObj.type) {
          case 'poll':
            content = buildPollContent({
              poll: contentObj.poll,
              options: contentObj.options || [],
              deadline: contentObj.deadline ? new Date(contentObj.deadline) : undefined,
              scopeDescription: contentObj.scopeDescription,
              allowArbitraryVote: contentObj.allowArbitraryVote,
            });
            break;
          case 'vote':
            content = buildVoteContent({
              pollHash: contentObj.pollHash,
              poll: contentObj.poll,
              vote: contentObj.vote,
            });
            break;
          case 'organisation_verification':
            content = buildOrganisationVerificationContent({
              name: contentObj.name,
              englishName: contentObj.englishName,
              country: contentObj.country,
              city: contentObj.city,
              province: contentObj.province,
              legalForm: contentObj.legalForm,
              department: contentObj.department,
              domain: contentObj.domain,
              foreignDomain: contentObj.foreignDomain,
              serialNumber: contentObj.serialNumber,
              confidence: contentObj.confidence,
              reliabilityPolicy: contentObj.reliabilityPolicy,
              employeeCount: contentObj.employeeCount,
              pictureHash: contentObj.pictureHash,
              latitude: contentObj.latitude,
              longitude: contentObj.longitude,
              population: contentObj.population,
              publicKey: contentObj.publicKey,
            });
            break;
          case 'person_verification':
            content = buildPersonVerificationContent({
              name: contentObj.name,
              countryOfBirth: contentObj.countryOfBirth,
              cityOfBirth: contentObj.cityOfBirth,
              ownDomain: contentObj.ownDomain,
              foreignDomain: contentObj.foreignDomain,
              dateOfBirth: new Date(contentObj.dateOfBirth),
              jobTitle: contentObj.jobTitle,
              employer: contentObj.employer,
              verificationMethod: contentObj.verificationMethod,
              confidence: contentObj.confidence,
              picture: contentObj.picture,
              reliabilityPolicy: contentObj.reliabilityPolicy,
              publicKey: contentObj.publicKey,
            });
            break;
          case 'dispute_authenticity':
            content = buildDisputeAuthenticityContent({
              hash: contentObj.hash,
              confidence: contentObj.confidence,
              reliabilityPolicy: contentObj.reliabilityPolicy,
            });
            break;
          case 'dispute_content':
            content = buildDisputeContentContent({
              hash: contentObj.hash,
              confidence: contentObj.confidence,
              reliabilityPolicy: contentObj.reliabilityPolicy,
            });
            break;
          case 'response':
            content = buildResponseContent({
              hash: contentObj.hash,
              response: contentObj.response,
            });
            break;
          case 'pdf_signing':
            content = buildPDFSigningContent({
              hash: contentObj.hash,
            });
            break;
          case 'rating':
            content = buildRating({
              subjectName: contentObj.subjectName,
              subjectType: contentObj.subjectType,
              subjectReference: contentObj.subjectReference,
              documentFileHash: contentObj.documentFileHash,
              rating: contentObj.rating,
              quality: contentObj.quality,
              comment: contentObj.comment,
            });
            break;
          default:
            throw new Error(`Unknown content type: ${contentObj.type}`);
        }
      } else {
        throw new Error('Invalid input: content must be string or object');
      }

      const statement = buildStatement({
        domain: input.domain,
        author: input.author,
        time: new Date(input.time),
        tags: input.tags,
        content,
        representative: input.representative,
        supersededStatement: input.supersededStatement,
        translations: input.translations,
        attachments: input.attachments,
      });

      fs.writeFileSync(outputPath, statement, 'utf-8');
    } catch (error) {
      // Skip on error
    }
  }
}

async function handleSignatureFixture(input: unknown, outputPath: string) {
  const keys = await generateKeyPair();
  
  const inputObj = input as Record<string, unknown>;
  const statement = buildStatement({
    domain: inputObj.domain as string,
    author: inputObj.author as string,
    time: new Date(inputObj.time as string),
    tags: inputObj.tags as string[] | undefined,
    content: inputObj.content as string,
    representative: inputObj.representative as string | undefined,
    supersededStatement: inputObj.supersededStatement as string | undefined,
    translations: inputObj.translations as Record<string, string> | undefined,
    attachments: inputObj.attachments as string[] | undefined,
  });

  const signedStatement = await buildSignedStatement(statement, keys.privateKey, keys.publicKey);
  fs.writeFileSync(outputPath, signedStatement, 'utf-8');
}

async function main() {
  await updateFixtures();
}

main();
