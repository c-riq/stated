/* eslint-disable no-useless-concat */
// copied from frotend to backend directory via 'npm run build'

import {legalForms} from './constants/legalForms'

// eslint-disable-next-line
const version = 2

export type statementTypeValue = 'statement' | 'quotation' | 'organisation_verification' | 'person_verification' | 'poll' | 'vote' | 'response' | 'dispute_statement_content' | 'dispute_statement_authenticity' | 'boycott' | 'observation' | 'rating' | 'sign_pdf' | 'bounty'
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
export const employeeCounts = {"0": "0-10", "10": "10-100", "100": "100-1000", "1000": "1000-10,000", "10000": "10,000-100,000", "100000": "100,000+"}
export const minEmployeeCountToRange = (n: number) => {
	if(n >= 100000) return employeeCounts["100000"]
	if(n >= 10000) return employeeCounts["10000"]
	if(n >= 1000) return employeeCounts["1000"]
	if(n >= 100) return employeeCounts["100"]
	if(n >= 10) return employeeCounts["10"]
	if(n >= 0) return employeeCounts["0"]
}

const UTCFormat:RegExp = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s\d{2}\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT/

export type statement = {
	domain: string,
	author: string,
	time: Date,
	tags?: string[],
	content: string,
	representative?: string,
	supersededStatement?: string,
} 
export const buildStatement = ({domain, author, time, tags, content, representative, supersededStatement}: statement) => {
	if(content.match(/\nPublishing domain: /)) throw(new Error("Statement must not contain 'Publishing domain: ', as this marks the beginning of a new statement."))
	if(content.match(/\n\n/)) throw(new Error("Statement must not contain two line breaks in a row, as this is used for separating statements."))
	if(typeof time !== 'object' || !time.toUTCString) throw(new Error("Time must be a Date object."))
	const statement = "Publishing domain: " + domain + "\n" +
			"Author: " + (author || "") + "\n" + // organisation name
			(representative && representative?.length > 0 ? "Authorized signing representative: " + (representative || "") + "\n" : '') +
			"Time: " + time.toUTCString() + "\n" +
            (tags && tags.length > 0 ? "Tags: " + tags.join(', ') + "\n" : '') +
			(supersededStatement && supersededStatement?.length > 0 ? "Superseded statement: " + (supersededStatement || "") + "\n" : '') +
            "Statement content: " + content + (content.match(/\n$/) ? '' : "\n");
	return statement
}
export const parseStatement = (s: string):statement & { type: string } => {
	if(s.match(/\n\n/)) throw new Error("Statements cannot contain two line breaks in a row, as this is used for separating statements.")
	const statementRegex= new RegExp(''
	+ /^Publishing domain: (?<domain>[^\n]+?)\n/.source
	+ /Author: (?<author>[^\n]+?)\n/.source
	+ /(?:Authorized signing representative: (?<representative>[^\n]*?)\n)?/.source
	+ /Time: (?<time>[^\n]+?)\n/.source
	+ /(?:Tags: (?<tags>[^\n]*?)\n)?/.source
	+ /(?:Superseded statement: (?<supersededStatement>[^\n]*?)\n)?/.source
	+ /Statement content: (?:(?<typedContent>\n\tType: (?<type>[^\n]+?)\n[\s\S]+?\n$)|(?<content>[\s\S]+?\n$))/.source
	);
	let m: any = s.match(statementRegex)
	if(!m) throw new Error("Invalid statement format:" + s)
	// if(m?.groups) {m = m.groups}
	else{
		m = {domain: m[1], author: m[2], representative: m[3], time: m[4], tags: m[5],
			supersededStatement: m[6], content: m[7] || m[9],
			type: m[8] ? m[8].toLowerCase().replace(' ','_') : undefined}
	}
	if(!(m['time'].match(UTCFormat))) throw new Error("Invalid statement format: time must be in UTC")
	if(!m['domain']) throw new Error("Invalid statement format: domain is required")
	if(!m['author']) throw new Error("Invalid statement format: author is required")
	if(!m['content'] && !m['typedContent']) throw new Error("Invalid statement format: statement content is required")

	const tags = m['tags']?.split(', ')
	const time = new Date(m['time'])
	return {
		domain: m['domain'],
		author: m['author'],
		representative: m['representative'],
		time,
		tags: (tags && tags.length > 0) ? tags : undefined,
		supersededStatement: m['supersededStatement'],
		content: m['content'] || m['typedContent'],
		type: m['type']?.toLowerCase().replace(' ','_'),
	}
}

type quotation = {
	originalAuthor: string,
	authorVerification: string,
	originalTime?: string,
	source?: string,
	quotation?: string,
	paraphrasedStatement?: string,
	picture?: string,
	confidence?: string
}
export const buildQuotationContent = ({originalAuthor, authorVerification, originalTime, source,
		quotation, paraphrasedStatement, picture, confidence}: quotation) => {
	if(quotation && quotation.match(/\n/)) throw(new Error("Quotation must not contain line breaks."))
	if(!paraphrasedStatement && !quotation) throw(new Error("Quotation must contain either a quotation or a paraphrased statement."))
	const content = "\n" +
	"\t" + "Type: Quotation" + "\n" +
	"\t" + "Original author: " + originalAuthor + "\n" +
	"\t" + "Author verification: " + authorVerification + "\n" +
	(originalTime && originalTime?.length > 0 ? "\t" + "Original publication time: " + originalTime + "\n" : "") +
	(source && source?.length > 0 ? "\t" + "Source: " + (source || "") + "\n" : '') +
	(picture && picture.length > 0 ? "\t" + "Picture proof: " + (picture || "") + "\n" : '') +
	(confidence && confidence?.length > 0 ? "\t" + "Confidence: " + (confidence || "") + "\n" : '') +
	(quotation && quotation?.length > 0 ? "\t" + "Quotation: " + (quotation || "") + "\n" : '') +
	(paraphrasedStatement && paraphrasedStatement?.length > 0 ? "\t" + "Paraphrased statement: " + 
	(paraphrasedStatement || "").replace(/\n\t([^\t])/, '\n\t\t($1)') + "\n" : '') +
	""
	return content
}
export const parseQuotation = (s: string): quotation & {type: string|undefined} => {
	const voteRegex= new RegExp(''
	+ /^\n\tType: Quotation\n/.source
	+ /\tOriginal author: (?<originalAuthor>[^\n]+?)\n/.source
	+ /\tAuthor verification: (?<authorVerification>[^\n]+?)\n/.source
	+ /(?:\tOriginal publication time: (?<originalTime>[^\n]+?)\n)?/.source
	+ /(?:\tSource: (?<source>[^\n]+?)\n)?/.source
	+ /(?:\tPicture proof: (?<picture>[^\n]+?)\n)?/.source
	+ /(?:\tConfidence: (?<confidence>[^\n]+?)\n)?/.source
	+ /(?:\tQuotation: (?<quotation>[^\n]+?)\n)?/.source
	+ /(?:\tParaphrased statement: (?:(?<paraphrasedTypedStatement>\n\t\tType: (?<type>[^\n]+?)\n[\s\S]+?)|(?<paraphrasedStatement>[\s\S]+?)))/.source
	+ /$/.source
	);
	let m: any = s.match(voteRegex)
	if(!m) throw new Error("Invalid quotation format: " + s)
	// if(m?.groups) {m = m.groups}
	else{
		m = {originalAuthor: m[1], authorVerification: m[2], originalTime: m[3], source: m[4],
			picture: m[5], confidence: m[6], quotation: m[7], paraphrasedStatement: m[8] || m[10],
			type: m[9] ? m[9].toLowerCase().replace(' ','_') : undefined}
	}
	return {
		originalAuthor: m['originalAuthor'],
		authorVerification: m['authorVerification'],
		originalTime: m['originalTime'],
		source: m['source'],
		picture: m['picture'],
		confidence: m['confidence'],
		quotation: m['quotation'],
		paraphrasedStatement: (m['paraphrasedStatement']||m['paraphrasedTypedStatement']?.replace(/\n\t\t/g, "\n\t")),
		type: m['type']?.toLowerCase().replace(' ','_'),
	}
}
export type poll = {
	country: string|undefined,
	city: string|undefined,
	legalEntity: string|undefined,
	domainScope: string[]|undefined,
	judges?: string,
	deadline: Date,
	poll: string,
	pollType?: string,
	options: string[]
}
export const buildPollContent = ({country, city, legalEntity, domainScope, judges, deadline, poll, pollType, options}: poll) => {
	if(!poll) throw(new Error("Poll must contain a poll question."))
	const content = "\n" +
	"\t" + "Type: Poll" + "\n" +
	(pollType ? "\t" + "Poll type: " + pollType + "\n" : "") +
	(country ? "\t" + "Country scope: " + country + "\n" : "") +
	(city ? "\t" + "City scope: " + city + "\n" : "") +
	(legalEntity ? "\t" + "Legal entity scope: " + legalEntity + "\n" : "") +
	(domainScope && domainScope?.length > 0 ? "\t" + "Domain scope: " + domainScope.join(', ') + "\n" : "") +
	(judges ? "\t" + "The decision is finalized when the following nodes agree: " + judges + "\n" : "") +
	(deadline ?"\t" + "Voting deadline: " + deadline.toUTCString() + "\n" : "") +
	"\t" + "Poll: " + poll + "\n" +
	(options.length > 0 && options[0] ? "\t" + "Option 1: " + options[0] + "\n" : "") +
	(options.length > 1 && options[1] ? "\t" + "Option 2: " + options[1] + "\n" : "") +
	(options.length > 2 && options[2] ? "\t" + "Option 3: " + options[2] + "\n" : "") +
	(options.length > 3 && options[3] ? "\t" + "Option 4: " + options[3] + "\n" : "") +
	(options.length > 4 && options[4] ? "\t" + "Option 5: " + options[4] + "\n" : "") +
	""
	return content
}
export const parsePoll = (s: string):poll &{pollType:string} => {
	const pollRegex= new RegExp(''
	+ /^\n\tType: Poll\n/.source
	+ /(?:\tPoll type: (?<pollType>[^\n]+?)\n)?/.source
	+ /(?:\tCountry scope: (?<country>[^\n]+?)\n)?/.source
	+ /(?:\tCity scope: (?<city>[^\n]+?)\n)?/.source
	+ /(?:\tLegal entity scope: (?<legalEntity>[^\n]+?)\n)?/.source
	+ /(?:\tDomain scope: (?<domainScope>[^\n]+?)\n)?/.source
	+ /(?:\tThe decision is finalized when the following nodes agree: (?<judges>[^\n]+?)\n)?/.source
	+ /(?:\tVoting deadline: (?<deadline>[^\n]+?)\n)?/.source
	+ /\tPoll: (?<poll>[^\n]+?)\n/.source
	+ /(?:\tOption 1: (?<option1>[^\n]+?)\n)?/.source
	+ /(?:\tOption 2: (?<option2>[^\n]+?)\n)?/.source
	+ /(?:\tOption 3: (?<option3>[^\n]+?)\n)?/.source
	+ /(?:\tOption 4: (?<option4>[^\n]+?)\n)?/.source
	+ /(?:\tOption 5: (?<option5>[^\n]+?)\n)?/.source
	+ /$/.source)
	let m:any = s.match(pollRegex)
	if(!m) throw new Error("Invalid poll format: " + s)
	// if(m?.groups) {m = m.groups}
	else{
		m = {pollType: m[1], country: m[2], city: m[3], legalEntity: m[4], domainScope: m[5],
			judges: m[6], deadline: m[7], poll: m[8], option1: m[9], option2: m[10], option3: m[11],
			option4: m[12], option5: m[13]}
	}
	const options = [m.option1, m.option2, m.option3, m.option4, m.option5].filter(o => o)
	const domainScope = m.domainScope?.split(', ')
	const deadlineStr = m.deadline
	if(!deadlineStr.match(UTCFormat)) throw new Error("Invalid poll, deadline must be in UTC: " + deadlineStr)
	return {
		pollType: m['pollType'],
		country: m['country'],
		city: m['city'],
		legalEntity: m['legalEntity'],
		domainScope: (domainScope && domainScope.length > 0) ? domainScope : undefined,
		judges: m['judges'],
		deadline: new Date(deadlineStr),
		poll: m['poll'],
		options
	}
}
export type organisationVerification = {
	name: string,
	englishName?: string,
	country: string,
	city: string,
	province: string,
	legalForm: string,
	parent?: string,
	domain: string,
	foreignDomain: string,
	serialNumber: string,
	confidence?: number,
	reliabilityPolicy?: string,
	employeeCount?: string,
	pictureHash?: string
}

export const buildOrganisationVerificationContent = (
		{name, englishName, country, city, province, legalForm, parent, domain, foreignDomain, serialNumber,
		confidence, reliabilityPolicy, employeeCount, pictureHash} : organisationVerification) => {
	/* Omit any fields that may have multiple values */
	if(!name || !country || !legalForm || (!domain && !foreignDomain)) throw new Error("Missing required fields")
	// if(city && !cities.cities.map(c => c[1]).includes(city)) throw new Error("Invalid city " + city)
	//const countryObject = countries.countries.find(c => c[0] === country)
	//if(!countryObject) throw new Error("Invalid country " + country)
	//if(province && !subdivisions.filter(c => c[0] === countryObject[1]).map(c => c[2]).includes(province)) throw new Error("Invalid province " + province + ", " + country)
	if(!Object.values(legalForms).includes(legalForm)) throw new Error("Invalid legal entity " + legalForm)
	if(employeeCount && !Object.values(employeeCounts).includes(employeeCount)) throw new Error("Invalid employee count " + employeeCount)
	if(confidence && !(''+confidence)?.match(/^[0-9.]+$/)) throw new Error("Invalid confidence " + confidence)

	return "\n" +
	"\t" + "Type: Organisation verification" + "\n" +
	"\t" + "Description: We verified the following information about an organisation." + "\n" +
	"\t" + "Name: " + name + "\n" + // Full name as in business register
	(englishName ? "\t" + "English name: " + englishName + "\n" : "") + // wikidata english name if available
	"\t" + "Country: " + country + "\n" + // ISO 3166-1 english
	"\t" + "Legal entity: " + legalForm + "\n" +
	(parent ? "\t" + "Parent: " + parent + "\n" : "") + // for departments
	(domain ? "\t" + "Owner of the domain: " + domain + "\n" : "") +
	(foreignDomain ? "\t" + "Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
	(province ? "\t" + "Province or state: " + province + "\n" : "") + // UN/LOCODE
	(serialNumber ? "\t" + "Business register number: " + serialNumber + "\n" : "") +
	(city ? "\t" + "City: " + city + "\n" : "") + // wikidata english name, if available
	(pictureHash ? "\t" + "Logo: " + pictureHash + "\n" : "") +
	(employeeCount ? "\t" + "Employee count: " + employeeCount + "\n" : "") +
	(reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
	(confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
	""
}

export const organisationVerificationKeys = /(Type: |Description: |Name: |English name: |Country: |Legal entity: |Parent: |Owner of the domain: |Foreign domain used for publishing statements: |Province or state: |Business register number: |City: |Logo: |Employee count: |Reliability policy: |Confidence: )/g

export const parseOrganisationVerification = (s:string):organisationVerification => {
	const organisationVerificationRegex= new RegExp(''
	+ /^\n\tType: Organisation verification\n/.source
	+ /\tDescription: We verified the following information about an organisation.\n/.source
	+ /\tName: (?<name>[^\n]+?)\n/.source
	+ /(?:\tEnglish name: (?<englishName>[^\n]+?)\n)?/.source
	+ /\tCountry: (?<country>[^\n]+?)\n/.source
	+ /\tLegal entity: (?<legalForm>[^\n]+?)\n/.source
	+ /(?:\tParent: (?<parent>[^\n]+?)\n)?/.source
	+ /(?:\tOwner of the domain: (?<domain>[^\n]+?)\n)?/.source
	+ /(?:\tForeign domain used for publishing statements: (?<foreignDomain>[^\n]+?)\n)?/.source
	+ /(?:\tProvince or state: (?<province>[^\n]+?)\n)?/.source
	+ /(?:\tBusiness register number: (?<serialNumber>[^\n]+?)\n)?/.source
	+ /(?:\tCity: (?<city>[^\n]+?)\n)?/.source
	+ /(?:\tLogo: (?<pictureHash>[^\n]+?)\n)?/.source
	+ /(?:\tEmployee count: (?<employeeCount>[01,+-]+?)\n)?/.source
	+ /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
	+ /(?:\tConfidence: (?<confidence>[0-9.]+?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(organisationVerificationRegex)
	if(!m) throw new Error("Invalid organisation verification format: " + s)
	return {
		name: m[1],
		englishName: m[2],
		country: m[3],
		legalForm: m[4],
		parent: m[5],
		domain: m[6],
		foreignDomain: m[7],
		province: m[8],
		serialNumber: m[9],
		city: m[10],
		pictureHash: m[11],
		employeeCount: m[12],
		reliabilityPolicy: m[13],
		confidence: m[14] ? parseFloat(m[14]) : undefined,
	}
}

export type personVerification = {
	name: string,
	countryOfBirth: string,
	cityOfBirth: string,
	ownDomain?: string,
	foreignDomain?: string,
	dateOfBirth: Date,
	jobTitle?: string,
	employer?: string,
	verificationMethod?: string,
	confidence?: number,
	picture?: string,
	reliabilityPolicy?: string,
}

export const buildPersonVerificationContent = (
		{name, countryOfBirth, cityOfBirth, ownDomain, foreignDomain,
		dateOfBirth, jobTitle, employer, verificationMethod, confidence,
		picture, reliabilityPolicy}:personVerification) => {
	if(!name || !countryOfBirth || !cityOfBirth || !dateOfBirth || (!ownDomain && !foreignDomain)) return ""
	const [day, month, year] = dateOfBirth.toUTCString().split(' ').filter((i,j)=>[1,2,3].includes(j))
	let content = "\n" +
		"\t" + "Type: Person verification" + "\n" +
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

const monthIndex = (month:string) => ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(month.toLowerCase().substr(0,3))
const birthDateFormat:RegExp = /(?<d>\d{1,2})\s(?<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?<y>\d{4})/

export const parsePersonVerification = (s: string):personVerification => {
	const domainVerificationRegex= new RegExp(''
	+ /^\n\tType: Person verification\n/.source
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
	if(!m) throw new Error("Invalid person verification format: " + s)
	if(m[2] && !m[2].match(birthDateFormat)) throw new Error("Invalid birth date format: " + m[2])
	let {d, month, y} = m[2].match(birthDateFormat)?.groups || {}
	if(!d || !month || !y) throw new Error("Invalid birth date format: " + m[2])
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

export type vote = {
	pollHash: string,
	poll: string,
	vote: string,
}

export const buildVoteContent = ({pollHash, poll, vote}:vote) => {
	const content = "\n" +
	"\t" + "Type: Vote" + "\n" +
	"\t" + "Poll id: " + pollHash + "\n" +
	"\t" + "Poll: " + poll + "\n" +
	"\t" + "Option: " + vote + "\n" +
	""
	return content
}
export const voteKeys = /(Type: |Poll id: |Poll: |Option: )/g

export const parseVote = (s: string):vote => {
	const voteRegex= new RegExp(''
	+ /^\n\tType: Vote\n/.source
	+ /\tPoll id: (?<pollHash>[^\n]+?)\n/.source
	+ /\tPoll: (?<poll>[^\n]+?)\n/.source
	+ /\tOption: (?<vote>[^\n]+?)\n/.source
	+ /$/.source
	);
	const m = s.match(voteRegex)
	if(!m) throw new Error("Invalid vote format: " + s)
	return {
		pollHash: m[1],
		poll: m[2],
		vote: m[3]
	}
}

export type disputeAuthenticity = {
	hash: string,
	confidence?: number,
	reliabilityPolicy?: string,
}
export const buildDisputeAuthenticityContent = ({hash, confidence, reliabilityPolicy}:disputeAuthenticity) => {
	const content = "\n" +
	"\t" + "Type: Dispute statement authenticity" + "\n" +
	"\t" + "Description: We think that the referenced statement is not authentic.\n" +
	"\t" + "Hash of referenced statement: " + hash + "\n" +
	(confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
	(reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
	""
	return content
}
export const parseDisputeAuthenticity = (s: string):disputeAuthenticity => {
	const disputeRegex= new RegExp(''
	+ /^\n\tType: Dispute statement authenticity\n/.source
	+ /\tDescription: We think that the referenced statement is not authentic.\n/.source
	+ /\tHash of referenced statement: (?<hash>[^\n]+?)\n/.source
	+ /(?:\tConfidence: (?<confidence>[^\n]*?)\n)?/.source
	+ /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(disputeRegex)
	if(!m) throw new Error("Invalid dispute authenticity format: " + s)
	return {
		hash: m[1],
		confidence: m[2] ? parseFloat(m[2]) : undefined,
		reliabilityPolicy: m[3]
	}
}
export type disputeContent = {
	hash: string,
	confidence?: number,
	reliabilityPolicy?: string,
}
export const buildDisputeContentContent = ({hash, confidence, reliabilityPolicy}:disputeContent) => {
	const content = "\n" +
	"\t" + "Type: Dispute statement content" + "\n" +
	"\t" + "Description: We think that the content of the referenced statement is false.\n" +
	"\t" + "Hash of referenced statement: " + hash + "\n" +
	(confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
	(reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
	""
	return content
}
export const parseDisputeContent = (s: string):disputeContent => {
	const disputeRegex= new RegExp(''
	+ /^\n\tType: Dispute statement content\n/.source
	+ /\tDescription: We think that the content of the referenced statement is false.\n/.source
	+ /\tHash of referenced statement: (?<hash>[^\n]+?)\n/.source
	+ /(?:\tConfidence: (?<confidence>[^\n]*?)\n)?/.source
	+ /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(disputeRegex)
	if(!m) throw new Error("Invalid dispute content format: " + s)
	return {
		hash: m[1],
		confidence: m[2] ? parseFloat(m[2]) : undefined,
		reliabilityPolicy: m[3]
	}
}
export type responseContent = {
	hash: string,
	response: string,
}
export const buildResponseContent = ({hash, response}:responseContent) => {
	const content = "\n" +
	"\t" + "Type: Response" + "\n" +
	"\t" + "Hash of referenced statement: " + hash + "\n" +
	"\t" + "Response: " + response + "\n" +
	""
	return content
}
export const parseResponseContent = (s: string):responseContent => {
	const disputeRegex= new RegExp(''
	+ /^\n\tType: Response\n/.source
	+ /\tHash of referenced statement: (?<hash>[^\n]+?)\n/.source
	+ /\tResponse: (?<response>[^\n]*?)\n/.source
	+ /$/.source
	);
	const m = s.match(disputeRegex)
	if(!m) throw new Error("Invalid response content format: " + s)
	return {
		hash: m[1],
		response: m[2]
	}
}
export type PDFSigning = {
	hash: string,
}
export const PDFSigningKeys = /(Type: |Description: |PDF file hash: )/
export const buildPDFSigningContent = ({hash}:PDFSigning) => {
	const content = "\n" +
	"\t" + "Type: Sign PDF" + "\n" +
	"\t" + "Description: We hereby digitally sign the referenced PDF file.\n" +
	"\t" + "PDF file hash: " + hash + "\n" +
	""
	return content
}
export const parsePDFSigning = (s: string):PDFSigning => {
	const signingRegex= new RegExp(''
	+ /^\n\tType: Sign PDF\n/.source
	+ /\tDescription: We hereby digitally sign the referenced PDF file.\n/.source
	+ /\tPDF file hash: (?<hash>[^\n]+?)\n/.source
	+ /$/.source
	);
	const m = s.match(signingRegex)
	if(!m) throw new Error("Invalid PDF signing format: " + s)
	return {
		hash: m[1]
	}
}
export type rating = {
	organisation: string,
	domain: string,
	rating: string,
	comment?: string,
}
export const ratingKeys = /(Type: |Organisation name: |Organisation domain: |Our rating: |Comment: )/

export const buildRating = ({organisation, domain, rating, comment}:rating) => {
	const content = "\n" +
	"\t" + "Type: Rating" + "\n" +
	"\t" + "Organisation name: " + organisation + "\n" +
	"\t" + "Organisation domain: " + domain + "\n" +
	"\t" + "Our rating: " + rating + "\n" +
	(comment ? "\t" + "Comment: " + comment + "\n" : "") +
	""
	return content
}
export const parseRating = (s: string):rating => {
	const ratingRegex= new RegExp(''
	+ /^\n\tType: Rating\n/.source
	+ /\tOrganisation name: (?<organisation>[^\n]*?)\n/.source
	+ /\tOrganisation domain: (?<domain>[^\n]*?)\n/.source
	+ /\tOur rating: (?<rating>[1-5])\/5 Stars\n/.source
	+ /(?:\tComment: (?<comment>[^\n]*?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(ratingRegex)
	if(!m) throw new Error("Invalid rating format: " + s)
	return {
		organisation: m[1],
		domain: m[2],
		rating: m[3],
		comment: m[4]
	}
}
export type bounty = {
	motivation?: string,
	bounty: string,
	reward: string,
	judge: string,
	judgePay?: string,
}
export const BountyKeys = /(Type: |In order to: |We will reward any entity that: |The reward is: |In case of dispute, bounty claims are judged by: |The judge will be paid per investigated case with a maxium of: )/
export const buildBounty = ({motivation, bounty, reward, judge, judgePay}:bounty) => {
	const content = "\n" +
	"\t" + "Type: Bounty" + "\n" +
	(motivation ? "\t" + "In order to: " + motivation + "\n" : "") +
	"\t" + "We will reward any entity that: " + bounty + "\n" +
	"\t" + "The reward is: " + reward + "\n" +
	"\t" + "In case of dispute, bounty claims are judged by: " + judge + "\n" +
	(judgePay ? "\t" + "The judge will be paid per investigated case with a maxium of: " + judgePay + "\n" : "") +
	""
	return content
}
export const parseBounty = (s: string):bounty => {
	const bountyRegex= new RegExp(''
	+ /^\n\tType: Bounty\n/.source
	+ /(?:\tIn order to: (?<motivation>[^\n]*?)\n)?/.source
	+ /\tWe will reward any entity that: (?<bounty>[^\n]*?)\n/.source
	+ /\tThe reward is: (?<reward>[^\n]*?)\n/.source
	+ /\tIn case of dispute, bounty claims are judged by: (?<judge>[^\n]*?)\n/.source
	+ /(?:\tThe judge will be paid per investigated case with a maxium of: (?<judgePay>[^\n]*?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(bountyRegex)
	if(!m) throw new Error("Invalid bounty format: " + s)
	return {
		motivation: m[1],
		bounty: m[2],
		reward: m[3],
		judge: m[4],
		judgePay: m[5]
	}
}
export type observation = {
	description?: string,
	approach?: string,
	confidence?: number,
	reliabilityPolicy?: string,
	subject: string,
	subjectReference?: string,
	observationReference?: string,
	property: string,
	value: string,
}
export const ObservationKeys = /(Type: |Approach: |Confidence: |Reliability policy: |Subject: |Subject identity reference: |Observation reference: |Observed property: |Observed value: )/
export const buildObservation = ({approach, confidence, reliabilityPolicy, subject, subjectReference, observationReference, property, value}: observation) => {
	const content = "\n" +
	"\t" + "Type: Observation" + "\n" +
	(approach ? "\t" + "Approach: " + approach + "\n" : "") +
	(confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
	(reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
	"\t" + "Subject: " + subject + "\n" +
	(subjectReference ? "\t" + "Subject identity reference: " + subjectReference + "\n" : "") +
	(observationReference ? "\t" + "Observation reference: " + observationReference + "\n" : "") +
	"\t" + "Observed property: " + property + "\n" +
	"\t" + "Observed value: " + value + "\n" +
	""
	return content
}
export const parseObservation = (s: string):observation => {
	const observationRegex= new RegExp(''
	+ /^\n\tType: Observation\n/.source
	+ /(?:\tApproach: (?<approach>[^\n]*?)\n)?/.source
	+ /(?:\tConfidence: (?<confidence>[^\n]*?)\n)?/.source
	+ /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
	+ /\tSubject: (?<subject>[^\n]*?)\n/.source
	+ /(?:\tSubject identity reference: (?<subjectReference>[^\n]*?)\n)?/.source
	+ /(?:\tObservation reference: (?<observationReference>[^\n]*?)\n)?/.source
	+ /\tObserved property: (?<property>[^\n]*?)\n/.source
	+ /\tObserved value: (?<value>[\s\S]+?)\n/.source
	+ /$/.source
	);
	const m = s.match(observationRegex)
	if(!m) throw new Error("Invalid observation format: " + s)
	return {
		approach: m[1],
		confidence: m[2] ? parseFloat(m[2]) : undefined,
		reliabilityPolicy: m[3],
		subject: m[4],
		subjectReference: m[5],
		observationReference: m[6],
		property: m[7],
		value: m[8]
	}
}


export type boycott = {
	description?: string,
	reliabilityPolicy?: string,
	subject: string,
	subjectReference?: string,
}
export const BoycottKeys = /(Type: |Description: |Subject: |Subject identity reference: )/
export const buildBoycott = ({description, subject, subjectReference}: boycott) => {
	const content = "\n" +
	"\t" + "Type: Boycott" + "\n" +
	(description ? "\t" + "Description: " + description + "\n" : "") +
	"\t" + "Subject: " + subject + "\n" +
	(subjectReference ? "\t" + "Subject identity reference: " + subjectReference + "\n" : "") +
	""
	return content
}
export const parseBoycott = (s: string):boycott => {
	const observationRegex= new RegExp(''
	+ /^\n\tType: Boycott\n/.source
	+ /(?:\tDescription: (?<description>[^\n]*?)\n)?/.source
	+ /\tSubject: (?<subject>[^\n]*?)\n/.source
	+ /(?:\tSubject identity reference: (?<subjectReference>[^\n]*?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(observationRegex)
	if(!m) throw new Error("Invalid observation format: " + s)
	return {
		description: m[1],
		subject: m[2],
		subjectReference: m[3],
	}
}

export const forbiddenChars = (s: string) => /;|>|<|"|'|’|\\/.test(s)
export const forbiddenStrings = (a: string[]) =>
	a.filter(i =>
		forbiddenChars('' + i)
	)
