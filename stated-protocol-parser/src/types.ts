export type StatementTypeValue =
    | 'statement'
    | 'quotation'
    | 'organisation_verification'
    | 'person_verification'
    | 'poll'
    | 'vote'
    | 'response'
    | 'dispute_statement_content'
    | 'dispute_statement_authenticity'
    | 'boycott'
    | 'observation'
    | 'rating'
    | 'sign_pdf'
    | 'bounty'

export type Statement = {
    domain: string
    author: string
    time: Date
    tags?: string[]
    content: string
    representative?: string
    supersededStatement?: string
    formatVersion?: string
}

export type Quotation = {
    originalAuthor: string
    authorVerification: string
    originalTime?: string
    source?: string
    quotation?: string
    paraphrasedStatement?: string
    picture?: string
    confidence?: string
}

export type Poll = {
    country: string | undefined
    city: string | undefined
    legalEntity: string | undefined
    domainScope: string[] | undefined
    judges?: string
    deadline: Date | undefined
    poll: string
    scopeDescription?: string
    scopeQueryLink?: string
    options: string[]
    allowArbitraryVote?: boolean
    requiredProperty?: string
    requiredPropertyValue?: string
    requiredPropertyObserver?: string
    requiredMinConfidence?: number
}

export type OrganisationVerification = {
    name: string
    englishName?: string
    country: string
    city: string
    province: string
    legalForm: string
    department?: string
    domain: string
    foreignDomain: string
    serialNumber: string
    confidence?: number
    reliabilityPolicy?: string
    employeeCount?: string
    pictureHash?: string
    latitude?: number
    longitude?: number
    population?: string
}

export type withOwnDomain = {
    ownDomain: string
    foreignDomain?: string
}

export type withForeignDomain = {
    foreignDomain: string
    ownDomain?: string
}

export type PersonVerification = {
    name: string
    countryOfBirth: string
    cityOfBirth: string
    dateOfBirth: Date
    jobTitle?: string
    employer?: string
    verificationMethod?: string
    confidence?: number
    picture?: string
    reliabilityPolicy?: string
} & (withOwnDomain | withForeignDomain)

export type Vote = {
    pollHash: string
    poll: string
    vote: string
}

export type DisputeAuthenticity = {
    hash: string
    confidence?: number
    reliabilityPolicy?: string
}

export type DisputeContent = {
    hash: string
    confidence?: number
    reliabilityPolicy?: string
}

export type ResponseContent = {
    hash: string
    response: string
}

export type PDFSigning = {
    hash: string
}

export type RatingSubjectTypeValue =
    | 'Organisation'
    | 'Policy proposal'
    | 'Treaty draft'
    | 'Research publication'
    | 'Regulation'
    | 'Product'

export type Rating = {
    subjectType?: RatingSubjectTypeValue
    subjectName: string
    subjectReference?: string
    documentFileHash?: string
    rating: number
    quality?: string
    comment?: string
}

export type Bounty = {
    motivation?: string
    bounty: string
    reward: string
    judge: string
    judgePay?: string
}

export type Observation = {
    description?: string
    approach?: string
    confidence?: number
    reliabilityPolicy?: string
    subject: string
    subjectReference?: string
    observationReference?: string
    property: string
    value?: string
}

export type PollV3 = {
    country: string | undefined
    city: string | undefined
    legalEntity: string | undefined
    domainScope: string[] | undefined
    judges?: string
    deadline: Date
    poll: string
    scopeDescription?: string
    scopeQueryLink?: string
    scopeProperty?: string
    propertyScopeObserver?: string
    pollType?: string
    options: string[]
}

export type Boycott = {
    description?: string
    reliabilityPolicy?: string
    subject: string
    subjectReference?: string
}