import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildStatement,
  parseStatement,
  buildPollContent,
  buildVoteContent,
  buildOrganisationVerificationContent,
  buildPersonVerificationContent,
  buildDisputeAuthenticityContent,
  buildDisputeContentContent,
  buildResponseContent,
  buildPDFSigningContent,
  buildRating,
} from './protocol';
import { verifySignedStatement } from './signature';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../fixtures');

function getFixtureDirs(): string[] {
  if (!fs.existsSync(fixturesDir)) {
    return [];
  }
  return fs
    .readdirSync(fixturesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildContentFromInput(contentObj: any): string {
  if (!contentObj || typeof contentObj !== 'object') {
    throw new Error('Content must be an object with a type field');
  }

  switch (contentObj.type) {
    case 'poll':
      return buildPollContent({
        poll: contentObj.poll,
        options: contentObj.options || [],
        deadline: contentObj.deadline ? new Date(contentObj.deadline) : undefined,
        scopeDescription: contentObj.scopeDescription,
        allowArbitraryVote: contentObj.allowArbitraryVote,
      });
    case 'vote':
      return buildVoteContent({
        pollHash: contentObj.pollHash,
        poll: contentObj.poll,
        vote: contentObj.vote,
      });
    case 'organisation_verification':
      return buildOrganisationVerificationContent({
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
    case 'person_verification':
      return buildPersonVerificationContent({
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
    case 'dispute_authenticity':
      return buildDisputeAuthenticityContent({
        hash: contentObj.hash,
        confidence: contentObj.confidence,
        reliabilityPolicy: contentObj.reliabilityPolicy,
      });
    case 'dispute_content':
      return buildDisputeContentContent({
        hash: contentObj.hash,
        confidence: contentObj.confidence,
        reliabilityPolicy: contentObj.reliabilityPolicy,
      });
    case 'response':
      return buildResponseContent({
        hash: contentObj.hash,
        response: contentObj.response,
      });
    case 'pdf_signing':
      return buildPDFSigningContent({});
    case 'rating':
      return buildRating({
        subjectName: contentObj.subjectName,
        subjectType: contentObj.subjectType,
        subjectReference: contentObj.subjectReference,
        documentFileHash: contentObj.documentFileHash,
        rating: contentObj.rating,
        quality: contentObj.quality,
        comment: contentObj.comment,
      });
    default:
      throw new Error(`Unknown content type: ${contentObj.type}`);
  }
}

describe('Fixture Validation', () => {
  const fixtureDirs = getFixtureDirs();

  if (fixtureDirs.length === 0) {
    it('no fixtures found', () => {
      // No fixture directories found
      assert.ok(true);
    });
    return;
  }

  for (const dir of fixtureDirs) {
    describe(`Fixture: ${dir}`, () => {
      const inputPath = path.join(fixturesDir, dir, 'input.json');
      const outputPath = path.join(fixturesDir, dir, 'output.txt');

      if (!fs.existsSync(inputPath)) {
        it('should have input.json', () => {
          assert.fail(`Missing input.json in ${dir}`);
        });
        return;
      }

      if (!fs.existsSync(outputPath)) {
        it('should have output.txt', () => {
          assert.fail(`Missing output.txt in ${dir}`);
        });
        return;
      }

      it('output.txt should match built statement from input.json', async () => {
        const input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
        const expectedOutput = fs.readFileSync(outputPath, 'utf-8');

        if (input.signature) {
          const isValid = await verifySignedStatement(expectedOutput);
          assert.strictEqual(isValid, true);
          return;
        }

        let content: string;
        if (typeof input.content === 'string') {
          content = input.content;
        } else {
          content = buildContentFromInput(input.content);
        }

        // Build statement
        const builtStatement = buildStatement({
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

        assert.strictEqual(builtStatement, expectedOutput);
      });

      it('output.txt should not contain double newlines', () => {
        const output = fs.readFileSync(outputPath, 'utf-8');
        assert.ok(!/\n\n/.test(output));
      });

      it('output.txt should be parseable', () => {
        const output = fs.readFileSync(outputPath, 'utf-8');
        const parsed = parseStatement({ statement: output });

        assert.ok(parsed.domain);
        assert.ok(parsed.author);
        assert.ok(parsed.content);
        assert.strictEqual(parsed.formatVersion, '5');
      });

      it('round-trip: parse(output.txt) should match input.json structure', () => {
        const input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
        const output = fs.readFileSync(outputPath, 'utf-8');
        const parsed = parseStatement({ statement: output });

        assert.strictEqual(parsed.domain, input.domain);
        assert.strictEqual(parsed.author, input.author);
        assert.strictEqual(new Date(parsed.time).toISOString(), new Date(input.time).toISOString());

        if (input.tags) {
          assert.deepStrictEqual(parsed.tags, input.tags);
        }
        if (input.representative) {
          assert.strictEqual(parsed.representative, input.representative);
        }
        if (input.supersededStatement) {
          assert.strictEqual(parsed.supersededStatement, input.supersededStatement);
        }
        if (input.attachments) {
          assert.deepStrictEqual(parsed.attachments, input.attachments);
        }
        if (input.translations) {
          assert.deepStrictEqual(parsed.translations, input.translations);
        }
      });
    });
  }
});
