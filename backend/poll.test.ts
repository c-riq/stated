
import {describe, jest, expect, it} from '@jest/globals';
jest.disableAutomock()
import { checkRequiredObservations, isVoteQualified, parseAndCreateVote } from './poll'
import { parseObservation, parseOrganisationVerification, parsePoll, parseStatement, parseVote } from './statementFormats';



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

type OrganisationVerificationDB = {
    id: number;
    statement_hash: string;
    verifier_domain: string;
    verified_domain: string | null;
    foreign_domain: string | null;
    name: string;
    legal_entity_type: string;
    serial_number: string | null;
    country: string;
    province: string | null;
    city: string | null;
    department: string | null;
    confidence: number | null;
};

type StatementDB = {
    id: number;
    type: StatementTypeDB;
    domain: string;
    author: string;
    statement: string;
    proclaimed_publication_time: Date | null;
    hash_b64: string;
    referenced_statement: string | null;
    tags: string | null;
    content: string;
    content_hash: string;
    source_node_id: number | null;
    first_verification_time: Date | null;
    latest_verification_time: Date | null;
    verification_method: VerificationMethodDB | null;
    derived_entity_created: boolean;
    derived_entity_creation_retry_count: number | null;
    superseded_statement: string | null;
};

enum VerificationMethodDB {
    Api = "api",
    Dns = "dns",
}

const dummyDBValues = {
    id: 0, hash_b64: 'hash', source_node_id: 0, verification_method: VerificationMethodDB.Api, hidden: false, tags: '', type: StatementTypeDB.Statement,
    content_hash_b64: '', first_verification_time: new Date(), latest_verification_time: new Date(),
    proclaimed_publication_time: new Date(), supersededStatement: '', referenced_statement: null,
    derived_entity_created: false, derived_entity_creation_retry_count: 0, superseded_statement: null,
    content_hash: ''
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
        const statementDBObject = {...dummyDBValues,
            statement: observationStatement,
            author: parsedStatment.author, domain: parsedStatment.domain, content: parsedStatment.content,
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

describe('isVoteQualified', () => {
    it('should return true when the required country, legal form are met', async () => {
        const pollStatement = `Publishing domain: localhost
Author: localhost
Time: Thu, 11 Jan 2024 20:34:02 GMT
Format version: 4
Statement content: 
	Type: Poll
	Voting deadline: Thu, 25 Jan 5024 20:34:05 GMT
	Poll: Is this a boring poll?
	Option 1: Yes
	Option 2: No
	Allow free text votes: No
	Who can vote: 
		Description: All corporations in Copenhagen
		Country scope: Denmark
		City scope: Copenhagen
		Legal form scope: corporation
`
        const parsedPollStatment = parseStatement({statement: pollStatement, allowNoVersion: true})
        const parsedPoll = parsePoll(parsedPollStatment.content)
        const pollDBObject = {...dummyDBValues,
            statement: pollStatement, author: parsedPollStatment.author, domain: parsedPollStatment.domain, content: parsedPollStatment.content,
            poll_hash: '', deadline: parsedPoll.deadline, allow_arbitrary_vote: parsedPoll.allowArbitraryVote,
            participants_entity_type: parsedPoll.legalEntity, participants_country: parsedPoll.country, participants_city: parsedPoll.city,
            options: parsedPoll.options, required_property: parsedPoll.requiredProperty, required_property_value: parsedPoll.requiredPropertyValue,
            required_property_observer: parsedPoll.requiredPropertyObserver, required_property_domain: null,
            statement_hash: '', proclaimed_publication_time: new Date()
        }
        const voteStatement = `Publishing domain: localhost
Author: localhost
Time: Thu, 11 Jan 2024 20:47:39 GMT
Format version: 4
Statement content: 
	Type: Vote
	Poll id: xW4v7VmNOh2iYYonqfRDh2JPo00JMLrl4-vZAXsY4oc
	Poll: Is this a boring poll?
	Option: Yes
`
        const parsedVoteStatment = parseStatement({statement: voteStatement, allowNoVersion: true})
        const parsedVote = parseVote(parsedVoteStatment.content)
        const verificationStatement = `Publishing domain: localhost
Author: localhost
Time: Thu, 11 Jan 2024 20:59:35 GMT
Format version: 4
Statement content: 
	Type: Organisation verification
	Description: We verified the following information about an organisation.
	Name: localhost
	Country: Denmark
	Legal form: corporation
	Owner of the domain: localhost
	Business register number: 123
	City: Copenhagen
	Reliability policy: https://link
	Confidence: 0.99
`
        const parsedVerificationStatment = parseStatement({statement: verificationStatement, allowNoVersion: true})
        const verification = parseOrganisationVerification(parsedVerificationStatment.content)
        const statementDBObject: OrganisationVerificationDB & StatementDB = {...dummyDBValues,
            statement: verificationStatement, author: parsedVerificationStatment.author, verifier_domain: parsedVerificationStatment.domain, domain: parsedVerificationStatment.domain, content: parsedVerificationStatment.content,
            verified_domain: verification.domain, name: verification.name, legal_entity_type: verification.legalForm, country: verification.country, city: verification.city,
            serial_number: verification.serialNumber, confidence: verification.confidence as number,
            foreign_domain: verification.foreignDomain, province: verification.province, department: null && verification.department,
            statement_hash: '', proclaimed_publication_time: new Date()
        }
        expect(await isVoteQualified({vote: parsedVote, poll: pollDBObject, verification: statementDBObject, proclaimed_publication_time: new Date(0)})).toBe(true)
        expect(await isVoteQualified({vote: parsedVote, poll: pollDBObject, verification: statementDBObject, proclaimed_publication_time: new Date(170500850900000)})).toBe(false)


        const statementDBObjectWrongCountry: OrganisationVerificationDB & StatementDB = {...dummyDBValues,
            statement: verificationStatement, author: parsedVerificationStatment.author, verifier_domain: parsedVerificationStatment.domain, domain: parsedVerificationStatment.domain, content: parsedVerificationStatment.content,
            verified_domain: verification.domain, name: verification.name, legal_entity_type: verification.legalForm, country: 'Sweden', city: verification.city,
            serial_number: verification.serialNumber, confidence: verification.confidence as number,
            foreign_domain: verification.foreignDomain, province: verification.province, department: null && verification.department,
            statement_hash: '', proclaimed_publication_time: new Date()
        }
        expect(await isVoteQualified({vote: parsedVote, poll: pollDBObject, verification: statementDBObjectWrongCountry, proclaimed_publication_time: new Date(0)})).toBe(false)

        const statementDBObjectWrongLegalForm: OrganisationVerificationDB & StatementDB = {...dummyDBValues,
            statement: verificationStatement, author: parsedVerificationStatment.author, verifier_domain: parsedVerificationStatment.domain, domain: parsedVerificationStatment.domain, content: parsedVerificationStatment.content,
            verified_domain: verification.domain, name: verification.name, legal_entity_type: 'local government', country: verification.country, city: verification.city,
            serial_number: verification.serialNumber, confidence: verification.confidence as number,
            foreign_domain: verification.foreignDomain, province: verification.province, department: null && verification.department,
            statement_hash: '', proclaimed_publication_time: new Date()
        }
        expect(await isVoteQualified({vote: parsedVote, poll: pollDBObject, verification: statementDBObjectWrongLegalForm, proclaimed_publication_time: new Date(0)})).toBe(false)

        const statementDBObjectWrongCity: OrganisationVerificationDB & StatementDB = {...dummyDBValues,
            statement: verificationStatement, author: parsedVerificationStatment.author, verifier_domain: parsedVerificationStatment.domain, domain: parsedVerificationStatment.domain, content: parsedVerificationStatment.content,
            verified_domain: verification.domain, name: verification.name, legal_entity_type: verification.legalForm, country: verification.country, city: 'Aarhus',
            serial_number: verification.serialNumber, confidence: verification.confidence as number,
            foreign_domain: verification.foreignDomain, province: verification.province, department: null && verification.department,
            statement_hash: '', proclaimed_publication_time: new Date()
        }
        expect(await isVoteQualified({vote: parsedVote, poll: pollDBObject, verification: statementDBObjectWrongCity, proclaimed_publication_time: new Date(0)})).toBe(false)

    });
});

describe('parseAndCreateVote', () => {
    it('should create a unqualified vote if scope requirements are not met', async () => {
        // TODO: proper test 
        const voteContent = `
	Type: Vote
	Poll id: xW4v7VmNOh2iYYonqfRDh2JPo00JMLrl4-vZAXsY4oc
	Poll: Is this a boring poll?
	Option: Yes
`
        const result = await parseAndCreateVote({statement_hash: '_', domain: '_', author: '_', content: voteContent, proclaimed_publication_time: new Date(0)})
        expect(result).toStrictEqual({rows: [1]})
    }
    );
});
