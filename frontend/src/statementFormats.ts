/* eslint-disable no-useless-concat */
// copied from frotend to backend directory via 'npm run build'

// TODO: use named matching groups, (did not work in the js bundle)

import {countries} from './constants/country_names_iso3166'
import {legalForms} from './constants/legalForms'
//import {cities} from './constants/cities'
import {subdivisions} from './constants/provinces_un_locode'

export const statementTypes = {
    statement: 'statement',
    quotation: 'quotation',
    organisationVerification: 'organisation_verification',
    personVerification: 'person_verification',
    poll: 'poll',
    vote: 'vote',
    response: 'response',
    dispute: 'dispute_statement',
    rating: 'rating',
	signPdf: "sign_pdf",
	bounty: "bounty",
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
	const statement = "Publishing domain: " + domain + "\n" +
			"Author: " + (author || "") + "\n" + // organisation name
			(representative && representative?.length > 0 ? "Authorized signing representative: " + (representative || "") + "\n" : '') +
			"Time: " + time + "\n" +
            (tags && tags.length > 0 ? "Tags: " + tags.join(', ') + "\n" : '') +
			(supersededStatement && supersededStatement?.length > 0 ? "Superseded statement: " + (supersededStatement || "") + "\n" : '') +
            "Statement content: " +  content;
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
	+ /Statement content: (?:(?<typedContent>\n\tType: (?<type>[^\n]+?)\n[\s\S]+?$)|(?<content>[\s\S]+?$))/.source
	);
	const m = s.match(statementRegex)?.groups
	if(!m) throw new Error("Invalid statement format")
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
	originalTime: string,
	source: string,
	quotation: string,
	paraphrasedStatement: string,
	picture: string,
	confidence: string
}
export const buildQuotationContent = ({originalAuthor, authorVerification, originalTime, source,
		quotation, paraphrasedStatement, picture, confidence}: quotation) => {
	if(quotation && quotation.match(/\n/)) throw(new Error("Quotation must not contain line breaks."))
	const content = "\n" +
	"\t" + "Type: Quotation" + "\n" +
	"\t" + "Original author: " + originalAuthor + "\n" +
	"\t" + "Author verification: " + authorVerification + "\n" +
	"\t" + "Original publication time: " + originalTime + "\n" +
	"\t" + "Source: " + source + "\n" +
	(picture?.length > 0 ? "\t" + "Picture proof: " + (picture || "") + "\n" : '') +
	(confidence?.length > 0 ? "\t" + "Confidence: " + (confidence || "") + "\n" : '') +
	(quotation?.length > 0 ? "\t" + "Quotation: " + (quotation || "") + "\n" : '') +
	(paraphrasedStatement?.length > 0 ? "\t" + "Paraphrased statement: " + 
		(paraphrasedStatement || "").replace('\n\t', '\n\t\t') + "\n" : '') +
	""
	return content
}
export const parseQuotation = (s: string): quotation & {type: string|undefined} => {
	const voteRegex= new RegExp(''
	+ /^\n\tType: Quotation\n/.source
	+ /\tOriginal author: (?<originalAuthor>[^\n]+?)\n/.source
	+ /\tAuthor verification: (?<authorVerification>[^\n]+?)\n/.source
	+ /\tOriginal publication time: (?<originalTime>[^\n]+?)\n/.source
	+ /\tSource: (?<source>[^\n]+?)\n/.source
	+ /(?:\tPicture proof: (?<picture>[^\n]+?)\n)?/.source
	+ /(?:\tConfidence: (?<confidence>[^\n]+?)\n)?/.source
	+ /(?:\tQuotation: (?<quotation>[^\n]+?)\n)?/.source
	+ /(?:\tParaphrased statement: (?:(?<paraphrasedTypedStatement>\n\t\tType: (?<type>[^\n]+?)\n[\s\S]+?)|(?<paraphrasedStatement>[\s\S]+?)))/.source
	+ /$/.source
	);
	const m = s.match(voteRegex)?.groups
	if(!m) throw new Error("Invalid quotation format")
	return {
		originalAuthor: m['originalAuthor'],
		authorVerification: m['authorVerification'],
		originalTime: m['originalTime'],
		source: m['source'],
		picture: m['picture'],
		confidence: m['confidence'],
		quotation: m['quotation'],
		paraphrasedStatement: (m['paraphrasedStatement']||m['paraphrasedTypedStatement']?.replace(/\t\t/g, "	")),
		type: m['type']?.toLowerCase().replace(' ','_'),
	}
}
type poll = {
	country: string|undefined,
	city: string|undefined,
	legalEntity: string|undefined,
	domainScope: string[]|undefined,
	judges: string,
	deadline: Date,
	poll: string,
	options: string[]
}
export const buildPollContent = ({country, city, legalEntity, domainScope, judges, deadline, poll, options}: poll) => {
	const content = "\n" +
	"\t" + "Type: Poll" + "\n" +
	"\t" + "Poll type: Majority vote wins" + "\n" +
	(country ? "\t" + "Country scope: " + country + "\n" : "") +
	(city ? "\t" + "City scope: " + city + "\n" : "") +
	(legalEntity ? "\t" + "Legal entity scope: " + legalEntity + "\n" : "") +
	(domainScope && domainScope?.length > 0 ? "\t" + "Domain scope: " + domainScope.join(', ') + "\n" : "") +
	"\t" + "The decision is finalized when the following nodes agree: " + judges + "\n" +
	"\t" + "Voting deadline: " + deadline.toUTCString() + "\n" +
	"\t" + "Poll: " + poll + "\n" +
	(options.length > 0 ? "\t" + "Option 1: " + options[0] + "\n" : "") +
	(options.length > 1 ? "\t" + "Option 2: " + options[1] + "\n" : "") +
	(options.length > 2 ? "\t" + "Option 3: " + options[2] + "\n" : "") +
	(options.length > 3 ? "\t" + "Option 4: " + options[3] + "\n" : "") +
	(options.length > 4 ? "\t" + "Option 5: " + options[4] + "\n" : "") +
	""
	return content
}
export const parsePoll = (s: string):poll &{pollType:string} => {
	const pollRegex= new RegExp(''
	+ /^\n\tType: Poll\n/.source
	+ /\tPoll type: (?<pollType>[^\n]+?)\n/.source
	+ /(?:\tCountry scope: (?<country>[^\n]+?)\n)?/.source
	+ /(?:\tCity scope: (?<city>[^\n]+?)\n)?/.source
	+ /(?:\tLegal entity scope: (?<legalEntity>[^\n]+?)\n)?/.source
	+ /(?:\tDomain scope: (?<domainScope>[^\n]+?)\n)?/.source
	+ /\tThe decision is finalized when the following nodes agree: (?<judges>[^\n]+?)\n/.source
	+ /\tVoting deadline: (?<deadline>[^\n]+?)\n/.source
	+ /\tPoll: (?<poll>[^\n]+?)\n/.source
	+ /(?:\tOption 1: (?<option1>[^\n]+?)\n)?/.source
	+ /(?:\tOption 2: (?<option2>[^\n]+?)\n)?/.source
	+ /(?:\tOption 3: (?<option3>[^\n]+?)\n)?/.source
	+ /(?:\tOption 4: (?<option4>[^\n]+?)\n)?/.source
	+ /(?:\tOption 5: (?<option5>[^\n]+?)\n)?/.source
	+ /$/.source)
	const m = s.match(pollRegex)?.groups
	if(!m) throw new Error("Invalid poll format")
	const options = [m.option1, m.option2, m.option3, m.option4, m.option5].filter(o => o)
	const domainScope = m.domainScope?.split(', ')
	const deadlineStr = m.deadline
	if(!deadlineStr.match(UTCFormat)) throw new Error("Invalid poll: deadline must be in UTC" + deadlineStr)
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
type organisationVerification = {
	name: string,
	englishName?: string,
	country: string,
	city: string,
	province: string,
	legalForm: string,
	domain: string,
	foreignDomain: string,
	serialNumber: string,
	confidence?: number,
	reliabilityPolicy?: string,
	employeeCount?: string,
	pictureHash?: string
}

export const buildOrganisationVerificationContent = (
		{name, englishName, country, city, province, legalForm, domain, foreignDomain, serialNumber,
		confidence, reliabilityPolicy, employeeCount, pictureHash} : organisationVerification) => {
	/* Omit any fields that may have multiple values */
	console.log(name, country, city, province, legalForm, domain)
	if(!name || !country || !legalForm || (!domain && !foreignDomain)) throw new Error("Missing required fields")
	// if(city && !cities.cities.map(c => c[1]).includes(city)) throw new Error("Invalid city " + city)
	const countryObject = countries.countries.find(c => c[0] === country)
	if(!countryObject) throw new Error("Invalid country " + country)
	if(province && !subdivisions.filter(c => c[0] === countryObject[1]).map(c => c[2]).includes(province)) throw new Error("Invalid province " + province + ", " + country)
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

export const organisationVerificationKeys = /(Type: |Description: |Name: |English name: |Country: |Legal entity: |Owner of the domain: |Foreign domain used for publishing statements: |Province or state: |Business register number: |City: |Logo: |Employee count: |Reliability policy: |Confidence: )/g

export const parseOrganisationVerification = (s:string):organisationVerification => {
	const organisationVerificationRegex= new RegExp(''
	+ /^\n\tType: Organisation verification\n/.source
	+ /\tDescription: We verified the following information about an organisation.\n/.source
	+ /\tName: (?<name>[^\n]+?)\n/.source
	+ /(?:\tEnglish name: (?<englishName>[^\n]+?)\n)?/.source
	+ /\tCountry: (?<country>[^\n]+?)\n/.source
	+ /\tLegal entity: (?<legalForm>[^\n]+?)\n/.source
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
	if(!m) throw new Error("Invalid organisation verification format")
	return {
		name: m[1],
		englishName: m[2],
		country: m[3],
		legalForm: m[4],
		domain: m[5],
		foreignDomain: m[6],
		province: m[7],
		serialNumber: m[8],
		city: m[9],
		pictureHash: m[10],
		employeeCount: m[11],
		reliabilityPolicy: m[12],
		confidence: m[13] ? parseFloat(m[13]) : undefined,
	}
}

type personVerification = {
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
	console.log(name, countryOfBirth, cityOfBirth, ownDomain, foreignDomain, dateOfBirth)
	if(!name || !countryOfBirth || !cityOfBirth || !dateOfBirth || (!ownDomain && !foreignDomain)) return ""
	let content = "\n" +
		"\t" + "Type: Person verification" + "\n" +
		"\t" + "Description: We verified the following information about a person." + "\n" +
		"\t" + "Name: " + name + "\n" +
		"\t" + "Date of birth: " + dateOfBirth.toString().split(' ').filter((i,j)=>[1,2,3].includes(j)).join(' ') + "\n" +
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
	console.log(content)
	return content
}

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
	console.log(s)
	const m = s.match(domainVerificationRegex)
	if(!m) throw new Error("Invalid person verification format")
	if(m[2] && !m[2].match(UTCFormat)) throw new Error("Invalid verification: birth date must be in UTC")
	return {
		name: m[1],
		dateOfBirth: new Date(m[2]),
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

type vote = {
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
export const parseVote = (s: string):vote => {
	const voteRegex= new RegExp(''
	+ /^\n\tType: Vote\n/.source
	+ /\tPoll id: (?<pollHash>[^\n]+?)\n/.source
	+ /\tPoll: (?<poll>[^\n]+?)\n/.source
	+ /\tOption: (?<vote>[^\n]+?)\n/.source
	+ /$/.source
	);
	const m = s.match(voteRegex)
	if(!m) throw new Error("Invalid vote format")
	return {
		pollHash: m[1],
		poll: m[2],
		vote: m[3]
	}
}
type dispute = {
	hash: string,
}
export const buildDisputeContent = ({hash}:dispute) => {
	const content = "\n" +
	"\t" + "Type: Dispute statement" + "\n" +
	"\t" + "Description: We are convinced that the referenced statement is not authentic.\n" +
	"\t" + "Hash of referenced statement: " + hash + "\n" +
	""
	return content
}
export const parseDispute = (s: string):dispute => {
	const disputeRegex= new RegExp(''
	+ /^\n\tType: Dispute statement\n/.source
	+ /\tDescription: We are convinced that the referenced statement is not authentic.\n/.source
	+ /\tHash of referenced statement: (?<hash>[^\n]+?)\n/.source
	+ /$/.source
	);
	const m = s.match(disputeRegex)
	if(!m) throw new Error("Invalid dispute format")
	return {
		hash: m[1]
	}
}
type PDFSigning = {
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
	if(!m) throw new Error("Invalid PDF signing format")
	return {
		hash: m[1]
	}
}
type rating = {
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
	if(!m) throw new Error("Invalid rating format")
	return {
		organisation: m[1],
		domain: m[2],
		rating: m[3],
		comment: m[4]
	}
}
type bounty = {
	motivation?: string,
	bounty: string,
	reward: string,
	judge: string,
	judgeRenumeration?: string,
}
export const BountyKeys = /(Type: |In order to: |We will reward any entity that: |The reward is: |In case of dispute, bounty claims are judged by: |The judge will be renumerated per investigated case with a maxium of: )/
export const buildBounty = ({motivation, bounty, reward, judge, judgeRenumeration}:bounty) => {
	const content = "\n" +
	"\t" + "Type: Bounty" + "\n" +
	(motivation ? "\t" + "In order to: " + motivation + "\n" : "") +
	"\t" + "We will reward any entity that: " + bounty + "\n" +
	"\t" + "The reward is: " + reward + "\n" +
	"\t" + "In case of dispute, bounty claims are judged by: " + judge + "\n" +
	(judgeRenumeration ? "\t" + "The judge will be renumerated per investigated case with a maxium of: " + judgeRenumeration + "\n" : "") +
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
	+ /(?:\tThe judge will be renumerated per investigated case with a maxium of: (?<judgeRenumeration>[^\n]*?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(bountyRegex)
	if(!m) throw new Error("Invalid bounty format")
	return {
		motivation: m[1],
		bounty: m[2],
		reward: m[3],
		judge: m[4],
		judgeRenumeration: m[5]
	}
}

export const forbiddenChars = (s: string) => /;|>|=|<|"|'|’|\\/.test(s)
export const forbiddenStrings = (a: string[]) =>
	a.filter(i =>
		forbiddenChars('' + i)
	)
