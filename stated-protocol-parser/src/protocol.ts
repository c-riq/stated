/* eslint-disable no-useless-concat */
import { legalForms, UTCFormat, peopleCountBuckets } from './constants'
import { monthIndex, birthDateFormat } from './utils'
import { verifySignature } from './signature.node'
import type {
    Statement,
    Poll,
    OrganisationVerification,
    PersonVerification,
    Vote,
    DisputeAuthenticity,
    DisputeContent,
    ResponseContent,
    PDFSigning,
    Rating,
    RatingSubjectTypeValue
} from './types'

const version = 5

export * from './types'
export * from './constants'
export * from './utils'

export const buildStatement = ({ domain, author, time, tags, content, representative, supersededStatement, translations }: Statement) => {
    if (content.match(/\nPublishing domain: /)) throw (new Error("Statement must not contain 'Publishing domain: ', as this marks the beginning of a new statement."))
    if (content.match(/\n\n/)) throw (new Error("Statement content must not contain two line breaks in a row, as this is used for separating statements."))
    if (typeof time !== 'object' || !time.toUTCString) throw (new Error("Time must be a Date object."))
    if (!domain) throw (new Error("Publishing domain missing."))
    
    // Validate translations if provided
    if (translations) {
        for (const [lang, translation] of Object.entries(translations)) {
            if (translation.match(/\nPublishing domain: /)) throw (new Error(`Translation for ${lang} must not contain 'Publishing domain: '.`))
            if (translation.match(/Translation [a-z]{2,3}:\n/)) throw (new Error(`Translation for ${lang} must not contain 'Translation XX:\\n' pattern.`))
        }
    }
    
    const translationLines = translations
        ? Object.entries(translations)
            .map(([lang, translation]) => `\nTranslation ${lang}:\n${translation}${translation.match(/\n$/) ? '' : "\n"}`)
            .join('')
        : '';
    
    const statement = "Publishing domain: " + domain + "\n" +
        "Author: " + (author || "") + "\n" +
        (representative && representative?.length > 0 ? "Authorized signing representative: " + (representative || "") + "\n" : '') +
        "Time: " + time.toUTCString() + "\n" +
        (tags && tags.length > 0 ? "Tags: " + tags.join(', ') + "\n" : '') +
        (supersededStatement && supersededStatement?.length > 0 ? "Superseded statement: " + (supersededStatement || "") + "\n" : '') +
        "Format version: " + version + "\n" +
        "Statement content:\n" + content + (content.match(/\n$/) ? '' : "\n") +
        translationLines;
    if (statement.length > 3000) throw (new Error("Statement must not be longer than 3,000 characters."))
    return statement
}

export const parseStatement = ({ statement: s }: { statement: string })
    : Statement & { type?: string, formatVersion: string } => {
    if (s.length > 3000) throw (new Error("Statement must not be longer than 3,000 characters."))
    // Check for double line breaks before translations section
    const beforeTranslations = s.split(/\nTranslation [a-z]{2,3}:\n/)[0]
    if (beforeTranslations.match(/\n\n/)) throw new Error("Statements cannot contain two line breaks in a row before translations, as this is used for separating statements.")
    
    // Check if statement has signature fields
    const signatureRegex = /^([\s\S]+?)---\nStatement hash: ([A-Za-z0-9_-]+)\nPublic key: ([A-Za-z0-9_-]+)\nSignature: ([A-Za-z0-9_-]+)\nAlgorithm: ([^\n]+)\n$/
    const signatureMatch = s.match(signatureRegex)
    
    let statementToVerify = s
    let publicKey: string | undefined
    let signature: string | undefined
    
    if (signatureMatch) {
        statementToVerify = signatureMatch[1]
        const statementHash = signatureMatch[2]
        publicKey = signatureMatch[3]
        signature = signatureMatch[4]
        const algorithm = signatureMatch[5]
        
        // Verify algorithm
        if (algorithm !== 'Ed25519') {
            throw new Error("Unsupported signature algorithm: " + algorithm)
        }
        
        // Verify statement hash
        const { sha256 } = require('./hash.node')
        const computedHash = sha256(statementToVerify)
        if (computedHash !== statementHash) {
            throw new Error("Statement hash mismatch")
        }
        
        // Verify signature
        const isValid = verifySignature(statementToVerify, signature, publicKey)
        if (!isValid) {
            throw new Error("Invalid cryptographic signature")
        }
    }
    
    const statementRegex = new RegExp(''
        + /^Publishing domain: (?<domain>[^\n]+?)\n/.source
        + /Author: (?<author>[^\n]+?)\n/.source
        + /(?:Authorized signing representative: (?<representative>[^\n]*?)\n)?/.source
        + /Time: (?<time>[^\n]+?)\n/.source
        + /(?:Tags: (?<tags>[^\n]*?)\n)?/.source
        + /(?:Superseded statement: (?<supersededStatement>[^\n]*?)\n)?/.source
        + /(?:Format version: (?<formatVersion>[^\n]*?)\n)?/.source
        + /Statement content:\n(?:(?<typedContent>\tType: (?<type>[^\n]+?)\n[\s\S]+?)(?=\nTranslation [a-z]{2,3}:\n|$)|(?<content>[\s\S]+?))(?=\nTranslation [a-z]{2,3}:\n|$)/.source
        + /(?<translations>(?:\nTranslation [a-z]{2,3}:\n[\s\S]+?)*)/.source
        + /$/.source
    );
    const match = statementToVerify.match(statementRegex)
    if (!match) throw new Error("Invalid statement format:" + s)
    
    const m: Partial<Statement> & { type?: string, formatVersion: string, timeStr: string, tagsStr: string, translationsStr?: string } = {
        domain: match[1], author: match[2], representative: match[3], timeStr: match[4], tagsStr: match[5],
        supersededStatement: match[6], formatVersion: match[7], content: match[8] || match[10],
        type: match[9] ? match[9].toLowerCase().replace(' ', '_') : undefined,
        translationsStr: match[11]
    }
    if (!(m['timeStr'].match(UTCFormat))) throw new Error("Invalid statement format: time must be in UTC")
    if (!m['domain']) throw new Error("Invalid statement format: domain is required")
    if (!m['author']) throw new Error("Invalid statement format: author is required")
    if (!m['content']) throw new Error("Invalid statement format: statement content is required")
    if (!m['formatVersion']) throw new Error("Invalid statement format: format version is required")
    if (m['formatVersion'] !== '5') throw new Error(`Invalid statement format: only version 5 is supported, got version ${m['formatVersion']}`)

    const tags = m['tagsStr']?.split(', ')
    const time = new Date(m['timeStr'])
    
    // Parse translations
    let translations: Record<string, string> | undefined = undefined
    if (m['translationsStr'] && m['translationsStr'].length > 0) {
        translations = {}
        // Split by translation markers to get individual translations
        const translationParts = m['translationsStr'].split(/\nTranslation ([a-z]{2,3}):\n/).filter(part => part.length > 0)
        // Process pairs: [lang1, content1, lang2, content2, ...]
        for (let i = 0; i < translationParts.length; i += 2) {
            if (i + 1 < translationParts.length) {
                const lang = translationParts[i]
                // Trim trailing newlines
                const translation = translationParts[i + 1].replace(/\n+$/, '')
                translations[lang] = translation
            }
        }
    }
    
    return {
        domain: m['domain'],
        author: m['author'],
        representative: m['representative'],
        time,
        tags: (tags && tags.length > 0) ? tags : undefined,
        supersededStatement: m['supersededStatement'],
        formatVersion: m['formatVersion'],
        content: m['content'],
        type: m['type']?.toLowerCase().replace(' ', '_'),
        translations: translations && Object.keys(translations).length > 0 ? translations : undefined,
    }
}

export const buildPollContent = ({ country, city, legalEntity, domainScope, judges, deadline, poll,
    scopeDescription, scopeQueryLink, options, allowArbitraryVote, requiredProperty: propertyScope, requiredPropertyObserver: propertyScopeObserver }: Poll) => {
    if (!poll) throw (new Error("Poll must contain a poll question."))
    const scopeContent =
        (scopeDescription ? "\t\t" + "Description: " + scopeDescription + "\n" : "") +
        (country ? "\t\t" + "Country scope: " + country + "\n" : "") +
        (city ? "\t\t" + "City scope: " + city + "\n" : "") +
        (legalEntity ? "\t\t" + "Legal form scope: " + legalEntity + "\n" : "") +
        (domainScope && domainScope?.length > 0 ? "\t\t" + "Domain scope: " + domainScope.join(', ') + "\n" : "") +
        (propertyScope ? "\t\t" + "All entities with the following property: " + propertyScope + "\n" : "") +
        (propertyScopeObserver ? "\t\t" + "As observed by: " + propertyScopeObserver + "\n" : "") +
        (scopeQueryLink ? "\t\t" + "Link to query defining who can vote: " + scopeQueryLink + "\n" : "")
    if (scopeContent.length > 0 && !scopeDescription) throw (new Error("Poll must contain a description of who can vote."))
    const content = "\t" + "Type: Poll" + "\n" +
        (judges ? "\t" + "The poll outcome is finalized when the following nodes agree: " + judges + "\n" : "") +
        (deadline ? "\t" + "Voting deadline: " + deadline.toUTCString() + "\n" : "") +
        "\t" + "Poll: " + poll + "\n" +
        (options.length > 0 && options[0] ? "\t" + "Option 1: " + options[0] + "\n" : "") +
        (options.length > 1 && options[1] ? "\t" + "Option 2: " + options[1] + "\n" : "") +
        (options.length > 2 && options[2] ? "\t" + "Option 3: " + options[2] + "\n" : "") +
        (options.length > 3 && options[3] ? "\t" + "Option 4: " + options[3] + "\n" : "") +
        (options.length > 4 && options[4] ? "\t" + "Option 5: " + options[4] + "\n" : "") +
        ((allowArbitraryVote === true || allowArbitraryVote === false) ? ("\t" + "Allow free text votes: " + (allowArbitraryVote ? 'Yes' : 'No') + "\n") : "") +
        (scopeContent ? "\t" + "Who can vote: \n" + scopeContent : "") +
        ""
    return content
}

export const parsePoll = (s: string, version?: string): Poll => {
    if (version !== '5') throw new Error("Invalid version " + version)
    const pollRegex = new RegExp(''
        + /^\tType: Poll\n/.source
        + /(?:\tThe poll outcome is finalized when the following nodes agree: (?<judges>[^\n]+?)\n)?/.source
        + /(?:\tVoting deadline: (?<deadline>[^\n]+?)\n)?/.source
        + /\tPoll: (?<poll>[^\n]+?)\n/.source
        + /(?:\tOption 1: (?<option1>[^\n]+?)\n)?/.source
        + /(?:\tOption 2: (?<option2>[^\n]+?)\n)?/.source
        + /(?:\tOption 3: (?<option3>[^\n]+?)\n)?/.source
        + /(?:\tOption 4: (?<option4>[^\n]+?)\n)?/.source
        + /(?:\tOption 5: (?<option5>[^\n]+?)\n)?/.source
        + /(?:\tAllow free text votes: (?<allowArbitraryVote>Yes|No)\n)?/.source
        + /(?:\tWho can vote: (?<whoCanVote>\n[\s\S]+?\n))?/.source
        + /$/.source)
    let m: any = s.match(pollRegex)
    if (!m) throw new Error("Invalid poll format: " + s)

    m = {
        judges: m[1], deadline: m[2], poll: m[3],
        option1: m[4], option2: m[5], option3: m[6], option4: m[7], option5: m[8],
        allowArbitraryVote: m[9],
        whoCanVote: m[10]
    }
    const whoCanVoteParsed: Partial<Poll> & { domainScopeStr?: string } = {}
    if (m.whoCanVote) {
        const whoCanVoteRegex = new RegExp(''
            + /^\n\t\tDescription: (?<scopeDescription>[^\n]+?)\n/.source
            + /(?:\t\tCountry scope: (?<countryScope>[^\n]+?)\n)?/.source
            + /(?:\t\tCity scope: (?<cityScope>[^\n]+?)\n)?/.source
            + /(?:\t\tLegal form scope: (?<legalEntity>[^\n]+?)\n)?/.source
            + /(?:\t\tDomain scope: (?<domainScope>[^\n]+?)\n)?/.source
            + /(?:\t\tAll entities with the following property: (?<propertyScope>[^\n]+?)\n)?/.source
            + /(?:\t\tAs observed by: (?<propertyScopeObserver>[^\n]+?)\n)?/.source
            + /(?:\t\tLink to query defining who can vote: (?<scopeQueryLink>[^\n]+?)\n)?/.source
            + /$/.source)
        let m2: any = m.whoCanVote.match(whoCanVoteRegex)
        if (!m2) throw new Error("Invalid who can vote section: " + m.whoCanVote)
        whoCanVoteParsed['scopeDescription'] = m2[1]
        whoCanVoteParsed['country'] = m2[2]
        whoCanVoteParsed['city'] = m2[3]
        whoCanVoteParsed['legalEntity'] = m2[4]
        whoCanVoteParsed['domainScopeStr'] = m2[5]
        whoCanVoteParsed['requiredProperty'] = m2[6]
        whoCanVoteParsed['requiredPropertyObserver'] = m2[7]
        whoCanVoteParsed['scopeQueryLink'] = m2[8]
    }
    const options = [m.option1, m.option2, m.option3, m.option4, m.option5].filter(o => o)
    const domainScope = (whoCanVoteParsed.domainScopeStr as string | undefined)?.split(', ')
    const allowArbitraryVote = (m['allowArbitraryVote'] === 'Yes' ? true :
        (m['allowArbitraryVote'] === 'No' ? false : undefined))
    const deadlineStr = m.deadline
    if (deadlineStr && !deadlineStr.match(UTCFormat)) throw new Error("Invalid poll, deadline must be in UTC: " + deadlineStr)
    return {
        judges: m['judges'],
        deadline: deadlineStr ? new Date(deadlineStr) : undefined,
        poll: m['poll'],
        options,
        allowArbitraryVote,
        country: whoCanVoteParsed['country'],
        scopeDescription: whoCanVoteParsed['scopeDescription'],
        requiredProperty: whoCanVoteParsed['requiredProperty'],
        requiredPropertyObserver: whoCanVoteParsed['requiredPropertyObserver'],
        scopeQueryLink: whoCanVoteParsed['scopeQueryLink'],
        city: whoCanVoteParsed['city'],
        legalEntity: whoCanVoteParsed['legalEntity'],
        domainScope: (domainScope && domainScope.length > 0) ? domainScope : undefined,
    }
}

export const buildOrganisationVerificationContent = (
    { name, englishName, country, city, province, legalForm, department, domain, foreignDomain, serialNumber,
        confidence, reliabilityPolicy, employeeCount, pictureHash, latitude, longitude, population }: OrganisationVerification) => {
    if (!name || !country || !legalForm || (!domain && !foreignDomain)) throw new Error("Missing required fields")
    if (!Object.values(legalForms).includes(legalForm)) throw new Error("Invalid legal form " + legalForm)
    if (employeeCount && !Object.values(peopleCountBuckets).includes(employeeCount)) throw new Error("Invalid employee count " + employeeCount)
    if (population && !Object.values(peopleCountBuckets).includes(population)) throw new Error("Invalid population " + population)
    if (confidence && !('' + confidence)?.match(/^[0-9.]+$/)) throw new Error("Invalid confidence " + confidence)

    return "\t" + "Type: Organisation verification" + "\n" +
        "\t" + "Description: We verified the following information about an organisation." + "\n" +
        "\t" + "Name: " + name + "\n" +
        (englishName ? "\t" + "English name: " + englishName + "\n" : "") +
        "\t" + "Country: " + country + "\n" +
        "\t" + "Legal form: " + legalForm + "\n" +
        (domain ? "\t" + "Owner of the domain: " + domain + "\n" : "") +
        (foreignDomain ? "\t" + "Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
        (department ? "\t" + "Department using the domain: " + department + "\n" : "") +
        (province ? "\t" + "Province or state: " + province + "\n" : "") +
        (serialNumber ? "\t" + "Business register number: " + serialNumber + "\n" : "") +
        (city ? "\t" + "City: " + city + "\n" : "") +
        (latitude ? "\t" + "Latitude: " + latitude + "\n" : "") +
        (longitude ? "\t" + "Longitude: " + longitude + "\n" : "") +
        (population ? "\t" + "Population: " + population + "\n" : "") +
        (pictureHash ? "\t" + "Logo: " + pictureHash + "\n" : "") +
        (employeeCount ? "\t" + "Employee count: " + employeeCount + "\n" : "") +
        (reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
        (confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
        ""
}

export const parseOrganisationVerification = (s: string): OrganisationVerification => {
    const organisationVerificationRegex = new RegExp(''
        + /^\tType: Organisation verification\n/.source
        + /\tDescription: We verified the following information about an organisation.\n/.source
        + /\tName: (?<name>[^\n]+?)\n/.source
        + /(?:\tEnglish name: (?<englishName>[^\n]+?)\n)?/.source
        + /\tCountry: (?<country>[^\n]+?)\n/.source
        + /\tLegal (?:form|entity): (?<legalForm>[^\n]+?)\n/.source
        + /(?:\tOwner of the domain: (?<domain>[^\n]+?)\n)?/.source
        + /(?:\tForeign domain used for publishing statements: (?<foreignDomain>[^\n]+?)\n)?/.source
        + /(?:\tDepartment using the domain: (?<department>[^\n]+?)\n)?/.source
        + /(?:\tProvince or state: (?<province>[^\n]+?)\n)?/.source
        + /(?:\tBusiness register number: (?<serialNumber>[^\n]+?)\n)?/.source
        + /(?:\tCity: (?<city>[^\n]+?)\n)?/.source
        + /(?:\tLatitude: (?<latitude>[^\n]+?)\n)?/.source
        + /(?:\tLongitude: (?<longitude>[^\n]+?)\n)?/.source
        + /(?:\tPopulation: (?<population>[^\n]+?)\n)?/.source
        + /(?:\tLogo: (?<pictureHash>[^\n]+?)\n)?/.source
        + /(?:\tEmployee count: (?<employeeCount>[01,+-]+?)\n)?/.source
        + /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
        + /(?:\tConfidence: (?<confidence>[0-9.]+?))?/.source
        + /\n?$/.source
    );
    const m = s.match(organisationVerificationRegex)
    if (!m) throw new Error("Invalid organisation verification format: " + s)
    return {
        name: m[1],
        englishName: m[2],
        country: m[3],
        legalForm: m[4],
        domain: m[5],
        foreignDomain: m[6],
        department: m[7],
        province: m[8],
        serialNumber: m[9],
        city: m[10],
        latitude: m[11] ? parseFloat(m[11]) : undefined,
        longitude: m[12] ? parseFloat(m[12]) : undefined,
        population: m[13],
        pictureHash: m[14],
        employeeCount: m[15],
        reliabilityPolicy: m[16],
        confidence: m[17] ? parseFloat(m[17]) : undefined,
    }
}

export const buildPersonVerificationContent = (
    { name, countryOfBirth, cityOfBirth, ownDomain, foreignDomain,
        dateOfBirth, jobTitle, employer, verificationMethod, confidence,
        picture, reliabilityPolicy }: PersonVerification) => {
    if (!name || !countryOfBirth || !cityOfBirth || !dateOfBirth || (!ownDomain && !foreignDomain)) {
        console.log("Missing required fields: ", { name, countryOfBirth, cityOfBirth, dateOfBirth, ownDomain, foreignDomain })
        return ""
    }
    const [day, month, year] = dateOfBirth.toUTCString().split(' ').filter((i, j) => [1, 2, 3].includes(j))
    let content = "\t" + "Type: Person verification" + "\n" +
        "\t" + "Description: We verified the following information about a person." + "\n" +
        "\t" + "Name: " + name + "\n" +
        "\t" + "Date of birth: " + [day.replace(/$0/, ''), month, year].join(' ') + "\n" +
        "\t" + "City of birth: " + cityOfBirth + "\n" +
        "\t" + "Country of birth: " + countryOfBirth + "\n" +
        (jobTitle ? "\t" + "Job title: " + jobTitle + "\n" : "") +
        (employer ? "\t" + "Employer: " + employer + "\n" : "") +
        (ownDomain ? "\t" + "Owner of the domain: " + ownDomain + "\n" : "") +
        (foreignDomain ? "\t" + "Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
        (picture ? "\t" + "Picture: " + picture + "\n" : "") +
        (verificationMethod ? "\t" + "Verification method: " + verificationMethod + "\n" : "") +
        (confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
        (reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
        ""
    return content
}

export const parsePersonVerification = (s: string): PersonVerification => {
    const domainVerificationRegex = new RegExp(''
        + /^\tType: Person verification\n/.source
        + /\tDescription: We verified the following information about a person.\n/.source
        + /\tName: (?<name>[^\n]+?)\n/.source
        + /\tDate of birth: (?<dateOfBirth>[^\n]+?)\n/.source
        + /\tCity of birth: (?<cityOfBirth>[^\n]+?)\n/.source
        + /\tCountry of birth: (?<countryOfBirth>[^\n]+?)\n/.source
        + /(?:\tJob title: (?<jobTitle>[^\n]+?)\n)?/.source
        + /(?:\tEmployer: (?<employer>[^\n]+?)\n)?/.source
        + /(?:\tOwner of the domain: (?<domain>[^\n]+?)\n)?/.source
        + /(?:\tForeign domain used for publishing statements: (?<foreignDomain>[^\n]+?)\n)?/.source
        + /(?:\tPicture: (?<picture>[^\n]+?)\n)?/.source
        + /(?:\tVerification method: (?<verificationMethod>[^\n]+?)\n)?/.source
        + /(?:\tConfidence: (?<confidence>[^\n]+?)\n)?/.source
        + /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
        + /$/.source
    );
    const m = s.match(domainVerificationRegex)
    if (!m) throw new Error("Invalid person verification format: " + s)
    if (m[2] && !m[2].match(birthDateFormat)) throw new Error("Invalid birth date format: " + m[2])
    let { d, month, y } = m[2].match(birthDateFormat)?.groups || {}
    if (!d || !month || !y) throw new Error("Invalid birth date format: " + m[2])
    return {
        name: m[1],
        dateOfBirth: new Date(Date.UTC(parseInt(y), monthIndex(month), parseInt(d))),
        cityOfBirth: m[3],
        countryOfBirth: m[4],
        jobTitle: m[5],
        employer: m[6],
        ownDomain: m[7],
        foreignDomain: m[8],
        picture: m[9],
        verificationMethod: m[10],
        confidence: m[11] ? parseFloat(m[11]) : undefined,
        reliabilityPolicy: m[12]
    }
}

export const buildVoteContent = ({ pollHash, poll, vote }: Vote) => {
    const content = "\t" + "Type: Vote" + "\n" +
        "\t" + "Poll id: " + pollHash + "\n" +
        "\t" + "Poll: " + poll + "\n" +
        "\t" + "Option: " + vote + "\n" +
        ""
    return content
}

export const parseVote = (s: string): Vote => {
    const voteRegex = new RegExp(''
        + /^\tType: Vote\n/.source
        + /\tPoll id: (?<pollHash>[^\n]+?)\n/.source
        + /\tPoll: (?<poll>[^\n]+?)\n/.source
        + /\tOption: (?<vote>[^\n]+?)\n/.source
        + /$/.source
    );
    const m = s.match(voteRegex)
    if (!m) throw new Error("Invalid vote format: " + s)
    return {
        pollHash: m[1],
        poll: m[2],
        vote: m[3]
    }
}

export const buildDisputeAuthenticityContent = ({ hash, confidence, reliabilityPolicy }: DisputeAuthenticity) => {
    const content = "\t" + "Type: Dispute statement authenticity" + "\n" +
        "\t" + "Description: We think that the referenced statement is not authentic.\n" +
        "\t" + "Hash of referenced statement: " + hash + "\n" +
        (confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
        (reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
        ""
    return content
}

export const parseDisputeAuthenticity = (s: string): DisputeAuthenticity => {
    const disputeRegex = new RegExp(''
        + /^\tType: Dispute statement authenticity\n/.source
        + /\tDescription: We think that the referenced statement is not authentic.\n/.source
        + /\tHash of referenced statement: (?<hash>[^\n]+?)\n/.source
        + /(?:\tConfidence: (?<confidence>[^\n]*?)\n)?/.source
        + /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
        + /$/.source
    );
    const m = s.match(disputeRegex)
    if (!m) throw new Error("Invalid dispute authenticity format: " + s)
    return {
        hash: m[1],
        confidence: m[2] ? parseFloat(m[2]) : undefined,
        reliabilityPolicy: m[3]
    }
}

export const buildDisputeContentContent = ({ hash, confidence, reliabilityPolicy }: DisputeContent) => {
    const content = "\t" + "Type: Dispute statement content" + "\n" +
        "\t" + "Description: We think that the content of the referenced statement is false.\n" +
        "\t" + "Hash of referenced statement: " + hash + "\n" +
        (confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
        (reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
        ""
    return content
}

export const parseDisputeContent = (s: string): DisputeContent => {
    const disputeRegex = new RegExp(''
        + /^\tType: Dispute statement content\n/.source
        + /\tDescription: We think that the content of the referenced statement is false.\n/.source
        + /\tHash of referenced statement: (?<hash>[^\n]+?)\n/.source
        + /(?:\tConfidence: (?<confidence>[^\n]*?)\n)?/.source
        + /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
        + /$/.source
    );
    const m = s.match(disputeRegex)
    if (!m) throw new Error("Invalid dispute content format: " + s)
    return {
        hash: m[1],
        confidence: m[2] ? parseFloat(m[2]) : undefined,
        reliabilityPolicy: m[3]
    }
}

export const buildResponseContent = ({ hash, response }: ResponseContent) => {
    const content = "\t" + "Type: Response" + "\n" +
        "\t" + "Hash of referenced statement: " + hash + "\n" +
        "\t" + "Response: " + response + "\n" +
        ""
    return content
}

export const parseResponseContent = (s: string): ResponseContent => {
    const disputeRegex = new RegExp(''
        + /^\n\tType: Response\n/.source
        + /\tHash of referenced statement: (?<hash>[^\n]+?)\n/.source
        + /\tResponse: (?<response>[^\n]*?)\n/.source
        + /$/.source
    );
    const m = s.match(disputeRegex)
    if (!m) throw new Error("Invalid response content format: " + s)
    return {
        hash: m[1],
        response: m[2]
    }
}

export const buildPDFSigningContent = ({ hash }: PDFSigning) => {
    const content = "\n" +
        "\t" + "Type: Sign PDF" + "\n" +
        "\t" + "Description: We hereby digitally sign the referenced PDF file.\n" +
        "\t" + "PDF file hash: " + hash + "\n" +
        ""
    return content
}

export const parsePDFSigning = (s: string): PDFSigning => {
    const signingRegex = new RegExp(''
        + /^\n\tType: Sign PDF\n/.source
        + /\tDescription: We hereby digitally sign the referenced PDF file.\n/.source
        + /\tPDF file hash: (?<hash>[^\n]+?)\n/.source
        + /$/.source
    );
    const m = s.match(signingRegex)
    if (!m) throw new Error("Invalid PDF signing format: " + s)
    return {
        hash: m[1]
    }
}

export const buildRating = ({ subjectName, subjectType, subjectReference, documentFileHash, rating, quality, comment }: Rating) => {
    if (![1, 2, 3, 4, 5].includes(rating)) throw new Error("Invalid rating: " + rating)
    const content = "\t" + "Type: Rating" + "\n" +
        (subjectType ? "\t" + "Subject type: " + subjectType + "\n" : "") +
        "\t" + "Subject name: " + subjectName + "\n" +
        (subjectReference ? "\t" + "URL that identifies the subject: " + subjectReference + "\n" : "") +
        (documentFileHash ? "\t" + "Document file hash: " + documentFileHash + "\n" : "") +
        (quality ? "\t" + "Rated quality: " + quality + "\n" : "") +
        "\t" + "Our rating: " + rating + "/5 Stars\n" +
        (comment ? "\t" + "Comment: " + comment + "\n" : "") +
        ""
    return content
}

export const parseRating = (s: string): Rating => {
    const ratingRegex = new RegExp(''
        + /^\tType: Rating\n/.source
        + /(?:\tSubject type: (?<subjectType>[^\n]*?)\n)?/.source
        + /\tSubject name: (?<subjectName>[^\n]*?)\n/.source
        + /(?:\tURL that identifies the subject: (?<subjectReference>[^\n]*?)\n)?/.source
        + /(?:\tDocument file hash: (?<documentFileHash>[^\n]*?)\n)?/.source
        + /(?:\tRated quality: (?<quality>[^\n]*?)\n)?/.source
        + /\tOur rating: (?<rating>[1-5])\/5 Stars\n/.source
        + /(?:\tComment: (?<comment>[\s\S]+?)\n)?/.source
        + /$/.source
    );
    const m = s.match(ratingRegex)
    if (!m) throw new Error("Invalid rating format: " + s)
    const rating = parseInt(m[6])
    if (![1, 2, 3, 4, 5].includes(rating)) throw new Error("Invalid rating: " + m[6])
    if (m[1] && !['Organisation', 'Policy proposal', 'Regulation',
        'Treaty draft', 'Product', 'Research publication'].includes(m[1])) throw new Error("Invalid subject type: " + m[1])
    if (!m[2]) throw new Error("Missing subject name")
    return {
        subjectType: m[1] as RatingSubjectTypeValue,
        subjectName: m[2],
        subjectReference: m[3],
        documentFileHash: m[4],
        quality: m[5],
        rating,
        comment: m[7]
    }
}
