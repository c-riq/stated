/* eslint-disable no-useless-concat */
// copied from frotend to backend directory via 'npm run build'

// TODO: use named matching groups, (did not work in the js bundle)

import {countries} from './country_names_iso3166'
import {legalForms} from './legalForms'
import {cities} from './cities'
import {subdivisions} from './provinces_un_locode'

export const statementTypes = {
    statement: 'statement',
    organisationVerification: 'organisation_verification',
    personVerification: 'person_verification',
    poll: 'poll',
    vote: 'vote',
    response: 'response',
    dispute: 'dispute_statement',
    rating: 'rating',
	signPdf: "sign_pdf"
}
export const buildStatement = ({domain, author, time, tags = [], content}) => {
	const statement = "Domain: " + domain + "\n" +
			"Author: " + (author || "") + "\n" +
			"Time: " + time + "\n" +
            (tags.length > 0 ? "Tags: " + tags.join(', ') + "\n" : '') +
            "Content: " +  content;
	return statement
}
export const parseStatement = (s) => {
	const statementRegex= new RegExp(''
	+ /^Domain: ([^\n]+?)\n/.source
	+ /Author: ([^\n]+?)\n/.source
	+ /Time: ([^\n]+?)\n/.source
	+ /(?:Tags: ([^\n]*?)\n)?/.source
	+ /Content: (?:(\n\tType: ([^\n]+?)\n[\s\S]+?$)|([\s\S]+?$))/.source
	);
	const m = s.match(statementRegex)
	return m ? {
		domain: m[1],
		author: m[2],
		time: m[3],
		tags: m[4],
		content: m[5] || m[7],
		type: m[6] ? m[6].toLowerCase().replace(' ','_') : undefined,
	} : {error: 'Invalid statement format'}
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
		{verifyName, country, city, province, legalEntity, verifyDomain, foreignDomain, serialNumber,
		verificationMethod, confidence, supersededVerificationHash, pictureHash}) => {
	/* Omit any fields that may have multiple values */
	console.log(verifyName, country, city, province, legalEntity, verifyDomain)
	if(!verifyName || !country || !legalEntity || (!verifyDomain && !foreignDomain)) throw new Error("Missing required fields")
	if(city && !cities.cities.map(c => c[1]).includes(city)) throw new Error("Invalid city")
	if(!countries.countries.map(c => c[0]).includes(country)) throw new Error("Invalid country")
	if(province && !subdivisions.map(c => c[2]).includes(province)) throw new Error("Invalid country")
	if(!legalForms.legalForms.map(l=> l[2]).includes(legalEntity)) throw new Error("Invalid legal entity")

	return "\n" +
	"\t" + "Type: Organisation verification" + "\n" +
	"\t" + "Description: We verified the following information about an organisation." + "\n" +
	"\t" + "Name: " + verifyName + "\n" + // Full name, as in business register
	"\t" + "Country: " + country + "\n" + // ISO 3166-1 english
	"\t" + "Legal entity: " + legalEntity + "\n" +
	(verifyDomain ? "\t" + "Owner of the domain: " + verifyDomain + "\n" : "") +
	(foreignDomain ? "\t" + "Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
	(province ? "\t" + "Province or state: " + province + "\n" : "") + // UN/LOCODE
	(serialNumber ? "\t" + "Business register number: " + serialNumber + "\n" : "") +
	(city ? "\t" + "City: " + city + "\n" : "") +
	(pictureHash ? "\t" + "Logo: " + pictureHash + "\n" : "") +
	(verificationMethod ? "\t" + "Verification method: " + verificationMethod + "\n" : "") +
	(supersededVerificationHash ? "\t" + "Superseded verification: " + supersededVerificationHash + "\n" : "") +
	(confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
	""
}

export const parseOrganisationVerification = (s) => {
	const organisationVerificationRegex= new RegExp(''
	+ /^\n\tType: Organisation verification\n/.source
	+ /\tDescription: We verified the following information about an organisation.\n/.source
	+ /\tName: (?<name>[^\n]+?)\n/.source
	+ /\tCountry: (?<country>[^\n]+?)\n/.source
	+ /\tLegal entity: (?<legalForm>[^\n]+?)\n/.source
	+ /(?:\tOwner of the domain: (?<domain>[^\n]+?)\n)?/.source
	+ /(?:\tForeign domain used for publishing statements: (?<foreignDomain>[^\n]+?)\n)?/.source
	+ /(?:\tProvince or state: (?<province>[^\n]+?)\n)?/.source
	+ /(?:\tBusiness register number: (?<serialNumber>[^\n]+?)\n)?/.source
	+ /(?:\tVAT number: (?<VATNumber>[^\n]+?)\n)?/.source
	+ /(?:\tISIN: (?<ISINNumber>[^\n]+?)\n)?/.source
	+ /(?:\tCity: (?<city>[^\n]+?)\n)?/.source
	+ /$/.source
	);
	console.log(s)
	const m = s.match(organisationVerificationRegex)
	return m ? {
		name: m[1],
		country: m[2],
		legalForm: m[3],
		domain: m[4],
		foreignDomain: m[5],
		province: m[6],
		serialNumber: m[7],
		city: m[8]
	} : {error: "Invalid organisation verification format"}
}

export const buildPersonVerificationContent = (
		{verifyName, birthCountry, birthCity, verifyDomain = null, foreignDomain = null,
		birthDate, job = null, employer = null, verificationMethod = null, confidence = null,
		supersededVerificationHash = null, pictureHash = null}) => {
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
		confidence: m[12]
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
