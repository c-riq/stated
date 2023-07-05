/* eslint-disable no-useless-concat */
// copied from frotend to backend directory via 'npm run build'

// TODO: use named matching groups, (did not work in the js bundle)

import {countries} from './constants/country_names_iso3166'
import {legalForms} from './constants/legalForms'
import {cities} from './constants/cities'
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
	signPdf: "sign_pdf"
}
export const employeeCounts = {"0": "0-10", "10": "10-100", "100": "100-1000", "1000": "1000-10,000", "10000": "10,000-100,000", "100000": "100,000+"}
export const minEmployeeCountToRange = (n) => {
	if(n >= 100000) return employeeCounts["100000"]
	if(n >= 10000) return employeeCounts["10000"]
	if(n >= 1000) return employeeCounts["1000"]
	if(n >= 100) return employeeCounts["100"]
	if(n >= 10) return employeeCounts["10"]
	if(n >= 0) return employeeCounts["0"]
}
export const buildStatement = ({domain, author, time, tags = [], content, representative = ''}) => {
	if(content.match(/\nPublishing domain: /)) throw(new Error("Statement must not contain 'Publishing domain: ', as this marks the beginning of a new statement."))
	if(content.match(/\n\n/)) throw(new Error("Statement must not contain two line breaks in a row, as this is used for separating statements."))
	const statement = "Publishing domain: " + domain + "\n" +
			"Author: " + (author || "") + "\n" + // organisation name
			(representative?.length > 0 ? "Authorized signing representative: " + (representative || "") + "\n" : '') +
			"Time: " + time + "\n" +
            (tags.length > 0 ? "Tags: " + tags.join(', ') + "\n" : '') +
            "Statement content: " +  content;
	return statement
}
export const parseStatement = (s) => {
	if(s.match(/\n\n/)) return {error: "Statements cannot contain two line breaks in a row, as this is used for separating statements."}
	const statementRegex= new RegExp(''
	+ /^Publishing domain: ([^\n]+?)\n/.source
	+ /Author: ([^\n]+?)\n/.source
	+ /(?:Authorized signing representative: ([^\n]*?)\n)?/.source
	+ /Time: ([^\n]+?)\n/.source
	+ /(?:Tags: ([^\n]*?)\n)?/.source
	+ /Statement content: (?:(\n\tType: ([^\n]+?)\n[\s\S]+?$)|([\s\S]+?$))/.source
	);
	const m = s.match(statementRegex)
	return m ? {
		domain: m[1],
		author: m[2],
		representative: m[3],
		time: m[4],
		tags: m[5],
		content: m[6] || m[8],
		type: m[7] ? m[7].toLowerCase().replace(' ','_') : undefined,
	} : {error: 'Invalid statement format'}
}
export const buildQuotationContent = ({originalAuthor, authorVerification, originalTime, source,
		quotation, paraphrasedStatement, picture, confidence}) => {
	if(quotation && quotation.match(/\n/)) throw(new Error("Quotation must not contain line breaks."))
	const content = "\n" +
	"\t" + "Type: Quotation" + "\n" +
	"\t" + "Original author: " + originalAuthor + "\n" +
	"\t" + "Author verification: " + authorVerification + "\n" +
	"\t" + "Original publication time: " + originalTime + "\n" +
	"\t" + "Source: " + source + "\n" +
	(picture?.length > 0 ? "Picture proof: " + (picture || "") + "\n" : '') +
	(confidence?.length > 0 ? "Confidence: " + (confidence || "") + "\n" : '') +
	(quotation?.length > 0 ? "Quotation: " + (quotation || "") + "\n" : '') +
	(paraphrasedStatement?.length > 0 ? "Paraphrased statement: " + (paraphrasedStatement || "") + "\n" : '') +
	""
	return content
}
export const parseQuotation = (s) => {
	const voteRegex= new RegExp(''
	+ /^\n\tType: Quotation\n/.source
	+ /\tOriginal author: (?<originalAuthor>[^\n]+?)\n/.source
	+ /\tAuthor verification: (?<authorVerification>[^\n]+?)\n/.source
	+ /\tOriginal publication time: (?<originalTime>[^\n]+?)\n/.source
	+ /\tSource: (?<source>[^\n]+?)\n/.source
	+ /(?:\tPicture proof: (?<picture>[^\n]+?)\n)?/.source
	+ /(?:\tConfidence: (?<confidence>[^\n]+?)\n)?/.source
	+ /(?:\tQuotation: (?<quotation>[^\n]+?)\n)?/.source
	+ /(?:\tParaphrased statement: (?:(\n\t\tType: ([^\n]+?)\n[\s\S]+?)|([\s\S]+?)))/.source
	+ /$/.source
	);
	const m = s.match(voteRegex)
	return m ? {
		originalAuthor: m[1],
		authorVerification: m[2],
		originalTime: m[3],
		source: m[4],
		picture: m[5],
		confidence: m[6],
		quotation: m[7],
		content: m[9] ? m[8].replace(/\t\t/g, "	") : m[10],
		type: m[9] ? m[9].toLowerCase().replace(' ','_') : undefined,
	} : {error : "Invalid quotation Format"}
}
export const buildPollContent = ({country, city, legalEntity, domainScope, nodes, votingDeadline, poll, options}) => {
	const content = "\n" +
	"\t" + "Type: Poll" + "\n" +
	"\t" + "Poll type: Majority vote wins" + "\n" +
	(country ? "\t" + "Country scope: " + country + "\n" : "") +
	(city ? "\t" + "City scope: " + city + "\n" : "") +
	(legalEntity ? "\t" + "Legal entity scope: " + legalEntity + "\n" : "") +
	(domainScope.length > 0 ? "\t" + "Domain scope: " + domainScope.join(', ') + "\n" : "") +
	"\t" + "The decision is finalized when the following nodes agree: " + nodes + "\n" +
	"\t" + "Voting deadline: " + new Date(votingDeadline).toUTCString() + "\n" +
	"\t" + "Poll: " + poll + "\n" +
	(options.length > 0 ? "\t" + "Option 1: " + options[0] + "\n" : "") +
	(options.length > 1 ? "\t" + "Option 2: " + options[1] + "\n" : "") +
	(options.length > 2 ? "\t" + "Option 3: " + options[2] + "\n" : "") +
	(options.length > 3 ? "\t" + "Option 4: " + options[3] + "\n" : "") +
	(options.length > 4 ? "\t" + "Option 5: " + options[4] + "\n" : "") +
	""
	return content
}
export const parsePoll = (s) => {
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
	const m = s.match(pollRegex)
	return m ? {
		pollType: m[1],
		country: m[2],
		city: m[3],
		legalEntity: m[4],
		domainScope: m[5],
		judges: m[6],
		deadline: m[7],
		poll: m[8],
		option1: m[9],
		option2: m[10],
		option3: m[11],
		option4: m[12],
		option5: m[13]
	} : {error : "Invalid poll format"}
}

export const buildOrganisationVerificationContent = (
		{verifyName, englishName = '', country, city, province, legalEntity, verifyDomain, foreignDomain, serialNumber,
		verificationMethod, confidence = '', supersededVerificationHash = '', pictureHash = '',
		reliabilityPolicy = '', employeeCount = ''}) => {
	/* Omit any fields that may have multiple values */
	console.log(verifyName, country, city, province, legalEntity, verifyDomain)
	if(!verifyName || !country || !legalEntity || (!verifyDomain && !foreignDomain)) throw new Error("Missing required fields")
	// if(city && !cities.cities.map(c => c[1]).includes(city)) throw new Error("Invalid city " + city)
	if(!countries.countries.map(c => c[0]).includes(country)) throw new Error("Invalid country " + country)
	if(province && !subdivisions.map(c => c[2]).includes(province)) throw new Error("Invalid province " + province)
	if(!Object.values(legalForms).includes(legalEntity)) throw new Error("Invalid legal entity " + legalEntity)
	if(employeeCount && !Object.values(employeeCounts).includes(employeeCount)) throw new Error("Invalid employee count " + employeeCount)
	if(confidence && !confidence?.match(/^[0-9.]+$/)) throw new Error("Invalid confidence " + confidence)

	return "\n" +
	"\t" + "Type: Organisation verification" + "\n" +
	"\t" + "Description: We verified the following information about an organisation." + "\n" +
	"\t" + "Name: " + verifyName + "\n" + // Full name as in business register
	(englishName ? "\t" + "English name: " + englishName + "\n" : "") + // wikidata english name if available
	"\t" + "Country: " + country + "\n" + // ISO 3166-1 english
	"\t" + "Legal entity: " + legalEntity + "\n" +
	(verifyDomain ? "\t" + "Owner of the domain: " + verifyDomain + "\n" : "") +
	(foreignDomain ? "\t" + "Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
	(province ? "\t" + "Province or state: " + province + "\n" : "") + // UN/LOCODE
	(serialNumber ? "\t" + "Business register number: " + serialNumber + "\n" : "") +
	(city ? "\t" + "City: " + city + "\n" : "") + // wikidata english name, if available
	(pictureHash ? "\t" + "Logo: " + pictureHash + "\n" : "") +
	(verificationMethod ? "\t" + "Verification method: " + verificationMethod + "\n" : "") +
	(supersededVerificationHash ? "\t" + "Superseded verification: " + supersededVerificationHash + "\n" : "") +
	(employeeCount ? "\t" + "Employee count: " + employeeCount + "\n" : "") +
	(reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
	(confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
	""
}

export const parseOrganisationVerification = (s) => {
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
	+ /(?:\tEmployee count: (?<employeeCount>[01\,\+\-]+?)\n)?/.source
	+ /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
	+ /(?:\tConfidence: (?<confidence>[0-9\.]+?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(organisationVerificationRegex)
	return m ? {
		name: m[1],
		englishName: m[2],
		country: m[3],
		legalForm: m[4],
		domain: m[5],
		foreignDomain: m[6],
		province: m[7],
		serialNumber: m[8],
		city: m[9],
		employeeCount: m[10],
		reliabilityPolicy: m[11],
		confidence: m[12] && parseFloat(m[12]),
	} : {error: "Invalid organisation verification format"}
}

export const buildPersonVerificationContent = (
		{verifyName, birthCountry, birthCity, verifyDomain = null, foreignDomain = null,
		birthDate, job = null, employer = null, verificationMethod = null, confidence = null,
		supersededVerificationHash = null, pictureHash = null, reliabilityPolicy= null}) => {
	console.log(verifyName, birthCountry, birthCity, verifyDomain, foreignDomain, birthDate)
	if(!verifyName || !birthCountry || !birthCity || !birthDate || (!verifyDomain && !foreignDomain)) return ""
	let content = "\n" +
		"\t" + "Type: Person verification" + "\n" +
		"\t" + "Description: We verified the following information about a person." + "\n" +
		"\t" + "Name: " + verifyName + "\n" +
		"\t" + "Date of birth: " + new Date(birthDate).toUTCString().split(' ').filter((i,j)=>[1,2,3].includes(j)).join(' ') + "\n" +
		"\t" + "City of birth: " + birthCity + "\n" +
		"\t" + "Country of birth: " + birthCountry + "\n" +
		(job ? "\t" + "Job title: " + job + "\n" : "") +
		(employer ? "\t" + "Employer: " + employer + "\n" : "") +
		(verifyDomain ? "\t" + "Owner of the domain: " + verifyDomain + "\n" : "") +
		(foreignDomain ? "\t" + "Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
		(pictureHash ? "\t" + "Picture: " + pictureHash + "\n" : "") +
		(verificationMethod ? "\t" + "Verification method: " + verificationMethod + "\n" : "") +
		(supersededVerificationHash ? "\t" + "Superseded verification: " + supersededVerificationHash + "\n" : "") +
		(confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
		(reliabilityPolicy ? "\t" + "Reliability policy: " + reliabilityPolicy + "\n" : "") +
		""
	console.log(content)
	return content
}

export const parsePersonVerification = (s) => {
	const domainVerificationRegex= new RegExp(''
	+ /^\n\tType: Person verification\n/.source
	+ /\tDescription: We verified the following information about a person.\n/.source
	+ /\tName: (?<name>[^\n]+?)\n/.source
	+ /\tDate of birth: (?<dateOfBirth>[^\n]+?)\n/.source
	+ /\tCity of birth: (?<cityOfBirth>[^\n]+?)\n/.source
	+ /\tCountry of birth: (?<countryOfBirth>[^\n]+?)\n/.source
	+ /(?:\tJob title: (?<job>[^\n]+?)\n)?/.source
	+ /(?:\tEmployer: (?<employer>[^\n]+?)\n)?/.source
	+ /(?:\tOwner of the domain: (?<domain>[^\n]+?)\n)?/.source
	+ /(?:\tForeign domain used for publishing statements: (?<foreignDomain>[^\n]+?)\n)?/.source
	+ /(?:\tPicture: (?<picture>[^\n]+?)\n)?/.source
	+ /(?:\tVerification method: (?<verificationMethod>[^\n]+?)\n)?/.source
	+ /(?:\tSuperseded verification: (?<supersededVerification>[^\n]+?)\n)?/.source
	+ /(?:\tConfidence: (?<confidence>[^\n]+?)\n)?/.source
	+ /(?:\tReliability policy: (?<reliabilityPolicy>[^\n]+?)\n)?/.source
	+ /$/.source
	);
	console.log(s)
	const m = s.match(domainVerificationRegex)
	return m ? {
		name: m[1],
		dateOfBirth: m[2],
		cityOfBirth: m[3],
		countryOfBirth: m[4],
		jobTitle: m[5],
		employer: m[6],
		ownDomain: m[7],
		foreignDomain: m[8],
		picture: m[9],
		verificationMethod: m[10],
		supersededVerification: m[11],
		confidence: m[12] && parseFloat(m[12]),
		reliabilityPolicy: m[13]
	} : {error: "Invalid person verification format"}
}

export const buildVoteContent = ({hash_b64, poll, vote}) => {
	const content = "\n" +
	"\t" + "Type: Vote" + "\n" +
	"\t" + "Poll id: " + hash_b64 + "\n" +
	"\t" + "Poll: " + poll + "\n" +
	"\t" + "Option: " + vote + "\n" +
	""
	return content
}
export const parseVote = (s) => {
	const voteRegex= new RegExp(''
	+ /^\n\tType: Vote\n/.source
	+ /\tPoll id: (?<pollHash>[^\n]+?)\n/.source
	+ /\tPoll: (?<poll>[^\n]+?)\n/.source
	+ /\tOption: (?<option>[^\n]+?)\n/.source
	+ /$/.source
	);
	const m = s.match(voteRegex)
	return m ? {
		pollHash: m[1],
		poll: m[2],
		option: m[3]
	} : {error : "Invalid vote Format"}
}
export const buildDisputeContent = ({hash_b64}) => {
	const content = "\n" +
	"\t" + "Type: Dispute statement" + "\n" +
	"\t" + "Description: We are convinced that the referenced statement is not authentic.\n" +
	"\t" + "Hash of referenced statement: " + hash_b64 + "\n" +
	""
	return content
}
export const parseDispute = (s) => {
	const disputeRegex= new RegExp(''
	+ /^\n\tType: Dispute statement\n/.source
	+ /\tDescription: We are convinced that the referenced statement is not authentic.\n/.source
	+ /\tHash of referenced statement: (?<hash_b64>[^\n]+?)\n/.source
	+ /$/.source
	);
	const m = s.match(disputeRegex)
	return m ? {
		hash_b64: m[1]
	} : {error: "Invalid dispute format"}
}
export const buildPDFSigningContent = ({hash_b64}) => {
	const content = "\n" +
	"\t" + "Type: Sign PDF" + "\n" +
	"\t" + "Description: We hereby digitally sign the referenced PDF file.\n" +
	"\t" + "PDF file hash: " + hash_b64 + "\n" +
	""
	return content
}
export const parsePDFSigning = (s) => {
	const signingRegex= new RegExp(''
	+ /^\n\tType: Sign PDF\n/.source
	+ /\tDescription: We hereby digitally sign the referenced PDF file.\n/.source
	+ /\tPDF file hash: (?<hash_b64>[^\n]+?)\n/.source
	+ /$/.source
	);
	const m = s.match(signingRegex)
	return m ? {
		hash_b64: m[1]
	} : {error: "Invalid PDF signing format"}
}

export const buildRating = ({organisation, domain, rating, comment}) => {
	const content = "\n" +
	"\t" + "Type: Rating" + "\n" +
	"\t" + "Organisation name: " + organisation + "\n" +
	"\t" + "Organisation domain: " + domain + "\n" +
	"\t" + "Our rating: " + rating + "\n" +
	(comment ? "\t" + "Comment: " + comment + "\n" : "") +
	""
	return content
}
export const parseRating = (s) => {
	const ratingRegex= new RegExp(''
	+ /^\n\tType: Rating\n/.source
	+ /\tOrganisation name: (?<organisation>[^\n]*?)\n/.source
	+ /\tOrganisation domain: (?<domain>[^\n]*?)\n/.source
	+ /\tOur rating: (?<rating>[1-5])\/5 Stars\n/.source
	+ /(?:\tComment: (?<comment>[^\n]*?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(ratingRegex)
	return m ? {
		organisation: m[1],
		domain: m[2],
		rating: m[3],
		comment: m[4]
	} : {error: "Invalid rating format"}
}

export const forbiddenChars = s => /;|>|<|"|'|’|\\/.test(s)
export const inValid256BitBase64 = s => !(/^[A-Za-z0-9+/]{30,60}[=]{0,2}$/.test(s))
export const forbiddenStrings = a =>
	a.filter(i =>
		forbiddenChars('' + i) && inValid256BitBase64('' + i)
	)
