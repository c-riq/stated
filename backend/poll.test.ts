
import {describe, expect, it} from '@jest/globals';
jest.disableAutomock()
import {checkRequiredObservations} from './poll'
import { parseObservation, parseStatement } from './statementFormats';


enum StatementTypeDB {
    Statement = "statement",
    DisputeStatementAuthenticity = "dispute_statement_authenticity",
    Response = "response",
    OrganisationVerification = "organisation_verification",
    PersonVerification = "person_verification",
    Poll = "poll",
    Vote = "vote",
    Rating = "rating",
    SignPdf = "sign_pdf",
    Bounty = "bounty",
    DisputeStatementContent = "dispute_statement_content",
    Boycott = "boycott",
    Observation = "observation",
    Unsupported = "unsupported",
}

enum VerificationMethodDB {
    Api = "api",
    Dns = "dns",
}

jest.mock('./database', () => ({
    createPoll: jest.fn(() => false),
    getVerificationsForDomain: jest.fn(() => ({rows: [1]})),
    getPoll: jest.fn(() => ({rows: [1]})),
    createVote: jest.fn(() => ({rows: [1]})),
    getVotes: jest.fn(() => ({rows: [1]})),
    updateVote: jest.fn(() => ({rows: [1]})),
    getObservationsForEntity: jest.fn(() => ({})),
}));

describe('checkRequiredObservations', () => {
    it('should return true when there is a valid observation', () => {
        const observationStatement = `Publishing domain: rixdata.net
Author: Rix Data NL B.V.
Time: Sun, 17 Dec 2023 19:49:24 GMT
Format version: 4
Statement content: 
	Type: Observation
	Confidence: 0.9
	Reliability policy: https://stated.rixdata.net/statements/MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads
	Subject: Mines ParisTech
	Subject identity reference: tl608pqqFWeLMBPnMOdcAaofarU3dMEXoFEuzDc1hRw
	Observed property: ROR ID
	Observed value: https://ror.org/04y8cs423
`
        const parsedStatment = parseStatement({statement: observationStatement, allowNoVersion: true})
        const parsedObservation = parseObservation(parsedStatment.content)
        const statementDBObject = {
            id: 0,
            statement: observationStatement, hash_b64: 'hash', source_node_id: 0, verification_method: VerificationMethodDB.Api, hidden: false,
            author: parsedStatment.author, domain: parsedStatment.domain, content: parsedStatment.content, tags: '', type: StatementTypeDB.Statement,
            content_hash_b64: '', first_verification_time: parsedStatment.time, latest_verification_time: parsedStatment.time,
            proclaimed_publication_time: parsedStatment.time, supersededStatement: parsedStatment.supersededStatement, referenced_statement: null,
            derived_entity_created: false, derived_entity_creation_retry_count: 0, superseded_statement: null,
            content_hash: ''
        }
        expect(checkRequiredObservations({requiredProperty: '_', requiredPropertyValue: 'https://ror.org/04y8cs423', observations: [statementDBObject]})
        ).toBe(false)
        expect(checkRequiredObservations({requiredProperty: 'ROR ID', requiredPropertyValue: '_', observations: [statementDBObject]})
        ).toBe(false)
        expect(checkRequiredObservations({requiredProperty: 'ROR ID', requiredPropertyValue: 'https://ror.org/04y8cs423', observations: [statementDBObject]})
        ).toBe(true)
        expect(checkRequiredObservations({requiredProperty: '_', observations: [statementDBObject]})
        ).toBe(false)
        expect(checkRequiredObservations({requiredProperty: 'ROR ID', observations: [statementDBObject]})
        ).toBe(true)
    });
});
