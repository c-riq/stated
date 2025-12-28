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

export const parseStatement = ({ statement: input }: { statement: string })
    : Statement & { type?: string, formatVersion: string } => {
    if (input.length > 3000) throw (new Error("Statement must not be longer than 3,000 characters."))
    const beforeTranslations = input.split(/\nTranslation [a-z]{2,3}:\n/)[0]
    if (beforeTranslations.match(/\n\n/)) throw new Error("Statements cannot contain two line breaks in a row before translations, as this is used for separating statements.")
    
    const signatureRegex = new RegExp(''
        + /^(?<statement>[\s\S]+?)---\n/.source
        + /Statement hash: (?<statementHash>[A-Za-z0-9_-]+)\n/.source
        + /Public key: (?<publicKey>[A-Za-z0-9_-]+)\n/.source
        + /Signature: (?<signature>[A-Za-z0-9_-]+)\n/.source
        + /Algorithm: (?<algorithm>[^\n]+)\n/.source
        + /$/.source
    )
    const signatureMatch = input.match(signatureRegex)
    
    let statementToVerify = input
    let publicKey: string | undefined
    let signature: string | undefined
    
    if (signatureMatch && signatureMatch.groups) {
        statementToVerify = signatureMatch.groups.statement
        const statementHash = signatureMatch.groups.statementHash
        publicKey = signatureMatch.groups.publicKey
        signature = signatureMatch.groups.signature
        const algorithm = signatureMatch.groups.algorithm
        
        if (algorithm !== 'Ed25519') {
            throw new Error("Unsupported signature algorithm: " + algorithm)
        }
        
        const { sha256 } = require('./hash.node')
        const computedHash = sha256(statementToVerify)
        if (computedHash !== statementHash) {
            throw new Error("Statement hash mismatch")
        }
        
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
        + /Statement content:\n(?:(?<typedContent>    Type: (?<type>[^\n]+?)\n[\s\S]+?)(?=\nTranslation [a-z]{2,3}:\n|$)|(?<content>[\s\S]+?))(?=\nTranslation [a-z]{2,3}:\n|$)/.source
        + /(?<translations>(?:\nTranslation [a-z]{2,3}:\n[\s\S]+?)*)/.source
        + /$/.source
    );
    const match = statementToVerify.match(statementRegex)
    if (!match || !match.groups) throw new Error("Invalid statement format:" + input)
    
    const { domain, author, representative, time: timeStr, tags: tagsStr, supersededStatement,
            formatVersion, content, typedContent, type, translations: translationsStr } = match.groups
    
    const parsed = {
        domain, author, representative, timeStr, tagsStr, supersededStatement, formatVersion,
        content: content || typedContent,
        type: type ? type.toLowerCase().replace(' ', '_') : undefined,
        translationsStr
    }
    if (!(parsed.timeStr.match(UTCFormat))) throw new Error("Invalid statement format: time must be in UTC")
    if (!parsed.domain) throw new Error("Invalid statement format: domain is required")
    if (!parsed.author) throw new Error("Invalid statement format: author is required")
    if (!parsed.content) throw new Error("Invalid statement format: statement content is required")
    if (!parsed.formatVersion) throw new Error("Invalid statement format: format version is required")
    if (parsed.formatVersion !== '5') throw new Error(`Invalid statement format: only version 5 is supported, got version ${parsed.formatVersion}`)

    const tags = parsed.tagsStr?.split(', ')
    const time = new Date(parsed.timeStr)
    
    let translations: Record<string, string> | undefined = undefined
    if (parsed.translationsStr && parsed.translationsStr.length > 0) {
        translations = {}
        const translationParts = parsed.translationsStr.split(/\nTranslation ([a-z]{2,3}):\n/).filter(part => part.length > 0)
        for (let i = 0; i < translationParts.length; i += 2) {
            if (i + 1 < translationParts.length) {
                const lang = translationParts[i]
                const translation = translationParts[i + 1].replace(/\n+$/, '')
                translations[lang] = translation
            }
        }
    }
    
    return {
        domain: parsed.domain,
        author: parsed.author,
        representative: parsed.representative,
        time,
        tags: (tags && tags.length > 0) ? tags : undefined,
        supersededStatement: parsed.supersededStatement,
        formatVersion: parsed.formatVersion,
        content: parsed.content,
        type: parsed.type?.toLowerCase().replace(' ', '_'),
        translations: translations && Object.keys(translations).length > 0 ? translations : undefined,
    }
}

export const buildPollContent = ({ deadline, poll, scopeDescription, options, allowArbitraryVote }: Poll) => {
    if (!poll) throw new Error("Poll must contain a poll question.")
    if (poll.includes('\n')) throw new Error("Poll question must be single line.")
    if (scopeDescription && scopeDescription.includes('\n')) throw new Error("Scope description must be single line.")
    options.forEach((option, index) => {
        if (option && option.includes('\n')) throw new Error(`Option ${index + 1} must be single line.`)
    })
    const content = "    Type: Poll\n" +
        (deadline ? "    Voting deadline: " + deadline.toUTCString() + "\n" : "") +
        "    Poll: " + poll + "\n" +
        (options.length > 0 && options[0] ? "    Option 1: " + options[0] + "\n" : "") +
        (options.length > 1 && options[1] ? "    Option 2: " + options[1] + "\n" : "") +
        (options.length > 2 && options[2] ? "    Option 3: " + options[2] + "\n" : "") +
        (options.length > 3 && options[3] ? "    Option 4: " + options[3] + "\n" : "") +
        (options.length > 4 && options[4] ? "    Option 5: " + options[4] + "\n" : "") +
        ((allowArbitraryVote === true || allowArbitraryVote === false) ? ("    Allow free text votes: " + (allowArbitraryVote ? 'Yes' : 'No') + "\n") : "") +
        (scopeDescription ? "    Who can vote: " + scopeDescription + "\n" : "")
    return content
}

export const parsePoll = (content: string, version?: string): Poll => {
    if (version !== '5') throw new Error("Invalid version " + version)
    const pollRegex = new RegExp(''
        + /^    Type: Poll\n/.source
        + /(?:    Voting deadline: (?<deadline>[^\n]+?)\n)?/.source
        + /    Poll: (?<poll>[^\n]+?)\n/.source
        + /(?:    Option 1: (?<option1>[^\n]+?)\n)?/.source
        + /(?:    Option 2: (?<option2>[^\n]+?)\n)?/.source
        + /(?:    Option 3: (?<option3>[^\n]+?)\n)?/.source
        + /(?:    Option 4: (?<option4>[^\n]+?)\n)?/.source
        + /(?:    Option 5: (?<option5>[^\n]+?)\n)?/.source
        + /(?:    Allow free text votes: (?<allowArbitraryVote>Yes|No)\n)?/.source
        + /(?:    Who can vote: (?<scopeDescription>[^\n]+?)\n)?/.source
        + /$/.source)
    const match = content.match(pollRegex)
    if (!match || !match.groups) throw new Error("Invalid poll format: " + content)

    const { deadline, poll, option1, option2, option3, option4, option5,
            allowArbitraryVote: allowArbitraryVoteStr, scopeDescription } = match.groups
    
    const options = [option1, option2, option3, option4, option5].filter(o => o)
    const allowArbitraryVote = (allowArbitraryVoteStr === 'Yes' ? true :
        (allowArbitraryVoteStr === 'No' ? false : undefined))
    const deadlineStr = deadline
    if (deadlineStr && !deadlineStr.match(UTCFormat)) throw new Error("Invalid poll, deadline must be in UTC: " + deadlineStr)
    return {
        deadline: deadlineStr ? new Date(deadlineStr) : undefined,
        poll,
        options,
        allowArbitraryVote,
        scopeDescription,
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

    return "    Type: Organisation verification\n" +
        "    Description: We verified the following information about an organisation.\n" +
        "    Name: " + name + "\n" +
        (englishName ? "    English name: " + englishName + "\n" : "") +
        "    Country: " + country + "\n" +
        "    Legal form: " + legalForm + "\n" +
        (domain ? "    Owner of the domain: " + domain + "\n" : "") +
        (foreignDomain ? "    Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
        (department ? "    Department using the domain: " + department + "\n" : "") +
        (province ? "    Province or state: " + province + "\n" : "") +
        (serialNumber ? "    Business register number: " + serialNumber + "\n" : "") +
        (city ? "    City: " + city + "\n" : "") +
        (latitude ? "    Latitude: " + latitude + "\n" : "") +
        (longitude ? "    Longitude: " + longitude + "\n" : "") +
        (population ? "    Population: " + population + "\n" : "") +
        (pictureHash ? "    Logo: " + pictureHash + "\n" : "") +
        (employeeCount ? "    Employee count: " + employeeCount + "\n" : "") +
        (reliabilityPolicy ? "    Reliability policy: " + reliabilityPolicy + "\n" : "") +
        (confidence ? "    Confidence: " + confidence + "\n" : "")
}

export const parseOrganisationVerification = (content: string): OrganisationVerification => {
    const organisationVerificationRegex = new RegExp(''
        + /^    Type: Organisation verification\n/.source
        + /    Description: We verified the following information about an organisation.\n/.source
        + /    Name: (?<name>[^\n]+?)\n/.source
        + /(?:    English name: (?<englishName>[^\n]+?)\n)?/.source
        + /    Country: (?<country>[^\n]+?)\n/.source
        + /    Legal (?:form|entity): (?<legalForm>[^\n]+?)\n/.source
        + /(?:    Owner of the domain: (?<domain>[^\n]+?)\n)?/.source
        + /(?:    Foreign domain used for publishing statements: (?<foreignDomain>[^\n]+?)\n)?/.source
        + /(?:    Department using the domain: (?<department>[^\n]+?)\n)?/.source
        + /(?:    Province or state: (?<province>[^\n]+?)\n)?/.source
        + /(?:    Business register number: (?<serialNumber>[^\n]+?)\n)?/.source
        + /(?:    City: (?<city>[^\n]+?)\n)?/.source
        + /(?:    Latitude: (?<latitude>[^\n]+?)\n)?/.source
        + /(?:    Longitude: (?<longitude>[^\n]+?)\n)?/.source
        + /(?:    Population: (?<population>[^\n]+?)\n)?/.source
        + /(?:    Logo: (?<pictureHash>[^\n]+?)\n)?/.source
        + /(?:    Employee count: (?<employeeCount>[01,+-]+?)\n)?/.source
        + /(?:    Reliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
        + /(?:    Confidence: (?<confidence>[0-9.]+?))?/.source
        + /\n?$/.source
    );
    const match = content.match(organisationVerificationRegex)
    if (!match || !match.groups) throw new Error("Invalid organisation verification format: " + content)
    
    const { name, englishName, country, legalForm, domain, foreignDomain, department, province,
            serialNumber, city, latitude, longitude, population, pictureHash, employeeCount,
            reliabilityPolicy, confidence } = match.groups
    
    return {
        name, englishName, country, legalForm, domain, foreignDomain, department, province,
        serialNumber, city,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        population, pictureHash, employeeCount, reliabilityPolicy,
        confidence: confidence ? parseFloat(confidence) : undefined,
    }
}

export const buildPersonVerificationContent = (
    { name, countryOfBirth, cityOfBirth, ownDomain, foreignDomain,
        dateOfBirth, jobTitle, employer, verificationMethod, confidence,
        picture, reliabilityPolicy }: PersonVerification) => {
    if (!name || !countryOfBirth || !cityOfBirth || !dateOfBirth || (!ownDomain && !foreignDomain)) {
        return ""
    }
    const [day, month, year] = dateOfBirth.toUTCString().split(' ').filter((i, j) => [1, 2, 3].includes(j))
    let content = "    Type: Person verification\n" +
        "    Description: We verified the following information about a person.\n" +
        "    Name: " + name + "\n" +
        "    Date of birth: " + [day.replace(/$0/, ''), month, year].join(' ') + "\n" +
        "    City of birth: " + cityOfBirth + "\n" +
        "    Country of birth: " + countryOfBirth + "\n" +
        (jobTitle ? "    Job title: " + jobTitle + "\n" : "") +
        (employer ? "    Employer: " + employer + "\n" : "") +
        (ownDomain ? "    Owner of the domain: " + ownDomain + "\n" : "") +
        (foreignDomain ? "    Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
        (picture ? "    Picture: " + picture + "\n" : "") +
        (verificationMethod ? "    Verification method: " + verificationMethod + "\n" : "") +
        (confidence ? "    Confidence: " + confidence + "\n" : "") +
        (reliabilityPolicy ? "    Reliability policy: " + reliabilityPolicy + "\n" : "")
    return content
}

export const parsePersonVerification = (content: string): PersonVerification => {
    const domainVerificationRegex = new RegExp(''
        + /^    Type: Person verification\n/.source
        + /    Description: We verified the following information about a person.\n/.source
        + /    Name: (?<name>[^\n]+?)\n/.source
        + /    Date of birth: (?<dateOfBirth>[^\n]+?)\n/.source
        + /    City of birth: (?<cityOfBirth>[^\n]+?)\n/.source
        + /    Country of birth: (?<countryOfBirth>[^\n]+?)\n/.source
        + /(?:    Job title: (?<jobTitle>[^\n]+?)\n)?/.source
        + /(?:    Employer: (?<employer>[^\n]+?)\n)?/.source
        + /(?:    Owner of the domain: (?<domain>[^\n]+?)\n)?/.source
        + /(?:    Foreign domain used for publishing statements: (?<foreignDomain>[^\n]+?)\n)?/.source
        + /(?:    Picture: (?<picture>[^\n]+?)\n)?/.source
        + /(?:    Verification method: (?<verificationMethod>[^\n]+?)\n)?/.source
        + /(?:    Confidence: (?<confidence>[^\n]+?)\n)?/.source
        + /(?:    Reliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
        + /$/.source
    );
    const match = content.match(domainVerificationRegex)
    if (!match || !match.groups) throw new Error("Invalid person verification format: " + content)
    
    const { name, dateOfBirth: dateOfBirthStr, cityOfBirth, countryOfBirth, jobTitle, employer,
            domain, foreignDomain, picture, verificationMethod, confidence, reliabilityPolicy } = match.groups
    
    if (dateOfBirthStr && !dateOfBirthStr.match(birthDateFormat)) throw new Error("Invalid birth date format: " + dateOfBirthStr)
    let { d, month, y } = dateOfBirthStr.match(birthDateFormat)?.groups || {}
    if (!d || !month || !y) throw new Error("Invalid birth date format: " + dateOfBirthStr)
    
    return {
        name,
        dateOfBirth: new Date(Date.UTC(parseInt(y), monthIndex(month), parseInt(d))),
        cityOfBirth, countryOfBirth, jobTitle, employer,
        ownDomain: domain,
        foreignDomain, picture, verificationMethod,
        confidence: confidence ? parseFloat(confidence) : undefined,
        reliabilityPolicy
    }
}

export const buildVoteContent = ({ pollHash, poll, vote }: Vote) => {
    const content = "    Type: Vote\n" +
        "    Poll id: " + pollHash + "\n" +
        "    Poll:\n" + poll + "\n" +
        "    Option:\n" + vote + "\n"
    return content
}

export const parseVote = (content: string): Vote => {
    const voteRegex = new RegExp(''
        + /^    Type: Vote\n/.source
        + /    Poll id: (?<pollHash>[^\n]+?)\n/.source
        + /    Poll:\n(?<poll>[^\n]+?)\n/.source
        + /    Option:\n(?<vote>[^\n]+?)\n/.source
        + /$/.source
    );
    const match = content.match(voteRegex)
    if (!match || !match.groups) throw new Error("Invalid vote format: " + content)
    
    const { pollHash, poll, vote } = match.groups
    return { pollHash, poll, vote }
}

export const buildDisputeAuthenticityContent = ({ hash, confidence, reliabilityPolicy }: DisputeAuthenticity) => {
    const content = "    Type: Dispute statement authenticity\n" +
        "    Description: We think that the referenced statement is not authentic.\n" +
        "    Hash of referenced statement: " + hash + "\n" +
        (confidence ? "    Confidence: " + confidence + "\n" : "") +
        (reliabilityPolicy ? "    Reliability policy: " + reliabilityPolicy + "\n" : "")
    return content
}

export const parseDisputeAuthenticity = (content: string): DisputeAuthenticity => {
    const disputeRegex = new RegExp(''
        + /^    Type: Dispute statement authenticity\n/.source
        + /    Description: We think that the referenced statement is not authentic.\n/.source
        + /    Hash of referenced statement: (?<hash>[^\n]+?)\n/.source
        + /(?:    Confidence: (?<confidence>[^\n]*?)\n)?/.source
        + /(?:    Reliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
        + /$/.source
    );
    const match = content.match(disputeRegex)
    if (!match || !match.groups) throw new Error("Invalid dispute authenticity format: " + content)
    
    const { hash, confidence, reliabilityPolicy } = match.groups
    return {
        hash,
        confidence: confidence ? parseFloat(confidence) : undefined,
        reliabilityPolicy
    }
}

export const buildDisputeContentContent = ({ hash, confidence, reliabilityPolicy }: DisputeContent) => {
    const content = "    Type: Dispute statement content\n" +
        "    Description: We think that the content of the referenced statement is false.\n" +
        "    Hash of referenced statement: " + hash + "\n" +
        (confidence ? "    Confidence: " + confidence + "\n" : "") +
        (reliabilityPolicy ? "    Reliability policy: " + reliabilityPolicy + "\n" : "")
    return content
}

export const parseDisputeContent = (content: string): DisputeContent => {
    const disputeRegex = new RegExp(''
        + /^    Type: Dispute statement content\n/.source
        + /    Description: We think that the content of the referenced statement is false.\n/.source
        + /    Hash of referenced statement: (?<hash>[^\n]+?)\n/.source
        + /(?:    Confidence: (?<confidence>[^\n]*?)\n)?/.source
        + /(?:    Reliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
        + /$/.source
    );
    const match = content.match(disputeRegex)
    if (!match || !match.groups) throw new Error("Invalid dispute content format: " + content)
    
    const { hash, confidence, reliabilityPolicy } = match.groups
    return {
        hash,
        confidence: confidence ? parseFloat(confidence) : undefined,
        reliabilityPolicy
    }
}

export const buildResponseContent = ({ hash, response }: ResponseContent) => {
    const content = "    Type: Response\n" +
        "    Hash of referenced statement: " + hash + "\n" +
        "    Response:\n" + response + "\n"
    return content
}

export const parseResponseContent = (content: string): ResponseContent => {
    const disputeRegex = new RegExp(''
        + /^\n    Type: Response\n/.source
        + /    Hash of referenced statement: (?<hash>[^\n]+?)\n/.source
        + /    Response:\n(?<response>[^\n]*?)\n/.source
        + /$/.source
    );
    const match = content.match(disputeRegex)
    if (!match || !match.groups) throw new Error("Invalid response content format: " + content)
    
    const { hash, response } = match.groups
    return { hash, response }
}

export const buildPDFSigningContent = ({ hash }: PDFSigning) => {
    const content = "\n" +
        "    Type: Sign PDF\n" +
        "    Description: We hereby digitally sign the referenced PDF file.\n" +
        "    PDF file hash: " + hash + "\n"
    return content
}

export const parsePDFSigning = (content: string): PDFSigning => {
    const signingRegex = new RegExp(''
        + /^\n    Type: Sign PDF\n/.source
        + /    Description: We hereby digitally sign the referenced PDF file.\n/.source
        + /    PDF file hash: (?<hash>[^\n]+?)\n/.source
        + /$/.source
    );
    const match = content.match(signingRegex)
    if (!match || !match.groups) throw new Error("Invalid PDF signing format: " + content)
    
    const { hash } = match.groups
    return { hash }
}

export const buildRating = ({ subjectName, subjectType, subjectReference, documentFileHash, rating, quality, comment }: Rating) => {
    if (![1, 2, 3, 4, 5].includes(rating)) throw new Error("Invalid rating: " + rating)
    const content = "    Type: Rating\n" +
        (subjectType ? "    Subject type: " + subjectType + "\n" : "") +
        "    Subject name: " + subjectName + "\n" +
        (subjectReference ? "    URL that identifies the subject: " + subjectReference + "\n" : "") +
        (documentFileHash ? "    Document file hash: " + documentFileHash + "\n" : "") +
        (quality ? "    Rated quality: " + quality + "\n" : "") +
        "    Our rating: " + rating + "/5 Stars\n" +
        (comment ? "    Comment:\n" + comment + "\n" : "")
    return content
}

export const parseRating = (content: string): Rating => {
    const ratingRegex = new RegExp(''
        + /^    Type: Rating\n/.source
        + /(?:    Subject type: (?<subjectType>[^\n]*?)\n)?/.source
        + /    Subject name: (?<subjectName>[^\n]*?)\n/.source
        + /(?:    URL that identifies the subject: (?<subjectReference>[^\n]*?)\n)?/.source
        + /(?:    Document file hash: (?<documentFileHash>[^\n]*?)\n)?/.source
        + /(?:    Rated quality: (?<quality>[^\n]*?)\n)?/.source
        + /    Our rating: (?<rating>[1-5])\/5 Stars\n/.source
        + /(?:    Comment:\n(?<comment>[\s\S]+?)\n)?/.source
        + /$/.source
    );
    const match = content.match(ratingRegex)
    if (!match || !match.groups) throw new Error("Invalid rating format: " + content)
    
    const { subjectType, subjectName, subjectReference, documentFileHash, quality,
            rating: ratingStr, comment } = match.groups
    
    const rating = parseInt(ratingStr)
    if (![1, 2, 3, 4, 5].includes(rating)) throw new Error("Invalid rating: " + ratingStr)
    if (subjectType && !['Organisation', 'Policy proposal', 'Regulation',
        'Treaty draft', 'Product', 'Research publication'].includes(subjectType)) throw new Error("Invalid subject type: " + subjectType)
    if (!subjectName) throw new Error("Missing subject name")
    
    return {
        subjectType: subjectType as RatingSubjectTypeValue,
        subjectName,
        subjectReference,
        documentFileHash,
        quality,
        rating,
        comment
    }
}
