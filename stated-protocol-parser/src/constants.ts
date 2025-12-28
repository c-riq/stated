export const legalForms = {
    local_government: 'local government',
    state_government: 'state government',
    foreign_affairs_ministry: 'foreign affairs ministry',
    corporation: 'corporation',
}

export const statementTypes = {
    statement: 'statement',
    quotation: 'quotation',
    organisationVerification: 'organisation_verification',
    personVerification: 'person_verification',
    poll: 'poll',
    vote: 'vote',
    response: 'response',
    disputeContent: 'dispute_statement_content',
    disputeAuthenticity: 'dispute_statement_authenticity',
    boycott: 'boycott',
    observation: 'observation',
    rating: 'rating',
    signPdf: "sign_pdf",
    bounty: "bounty",
    unsupported: "unsupported",
}

export const peopleCountBuckets = {
    "0": "0-10",
    "10": "10-100",
    "100": "100-1000",
    "1000": "1000-10,000",
    "10000": "10,000-100,000",
    "100000": "100,000+",
    "1000000": "1,000,000+",
    "10000000": "10,000,000+",
}

export const supportedLanguages = {
    en: 'en',
    es: 'es',
    ar: 'ar',
    zh: 'zh',
    fr: 'fr',
} as const

export type SupportedLanguage = typeof supportedLanguages[keyof typeof supportedLanguages]

export const UTCFormat: RegExp = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s\d{2}\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT/

export const pollKeys = /(Type: |The poll outcome is finalized when the following nodes agree: |Voting deadline: |Poll: |Option 1: |Option 2: |Option 3: |Option 4: |Option 5: |Allow free text votes: |Who can vote: |Description: |Country scope: |City scope: |Legal form scope: |Domain scope: |All entities with the following property: |As observed by: |Link to query defining who can vote: )/g

export const organisationVerificationKeys = /(Type: |Description: |Name: |English name: |Country: |Legal entity: |Legal form: |Department using the domain: |Owner of the domain: |Foreign domain used for publishing statements: |Province or state: |Business register number: |City: |Longitude: |Latitude: |Population: |Logo: |Employee count: |Reliability policy: |Confidence: )/g

export const personVerificationKeys = /(Type: |Description: |Name: |Date of birth: |City of birth: |Country of birth: |Job title: |Employer: |Owner of the domain: |Foreign domain used for publishing statements: |Picture: |Verification method: |Confidence: |Reliability policy: )/g

export const voteKeys = /(Type: |Poll id: |Poll: |Option: )/g

export const disputeAuthenticityKeys = /(Type: |Description: |Hash of referenced statement: |Confidence: |Reliability policy: )/g

export const disputeContentKeys = /(Type: |Description: |Hash of referenced statement: |Confidence: |Reliability policy: )/g

export const responseKeys = /(Type: |Hash of referenced statement: |Response: )/

export const PDFSigningKeys = /(Type: |Description: |PDF file hash: )/

export const ratingKeys = /(Type: |Subject type: |Subject name: |URL that identifies the subject: |Document file hash: |Rated quality: |Our rating: |Comment: )/

export const BountyKeys = /(Type: |In order to: |We will reward any entity that: |The reward is: |In case of dispute, bounty claims are judged by: |The judge will be paid per investigated case with a maxium of: )/

export const ObservationKeys = /(Type: |Approach: |Confidence: |Reliability policy: |Subject: |Subject identity reference: |Observation reference: |Observed property: |Observed value: )/

export const BoycottKeys = /(Type: |Description: |Subject: |Subject identity reference: )/