import { parseRating, parseStatement, parseOrganisationVerification, parsePDFSigning,
    parsePersonVerification, parseDisputeAuthenticity, parseDisputeContent, parseVote, parsePoll, parseQuotation,
	parseBounty, parseBoycott, parseObservation } from './statementFormats'

import { buildRating, buildStatement, buildBounty, buildDisputeAuthenticityContent, buildDisputeContentContent, buildPDFSigningContent, 
	buildPersonVerificationContent, buildPollContent, buildQuotationContent, buildVoteContent,
	buildOrganisationVerificationContent, buildBoycott, buildObservation } from './statementFormats'

const randomUnicodeString = () => Array.from(
	{ length: 20 }, () => String.fromCharCode(Math.floor(Math.random() * (65536)))
	).join('').replace(/[\n;>=<"'’\\]/g, '')

test('parse statement', () => {
	const statement = `Publishing domain: localhost
Author: chris
Time: Tue, 18 Apr 2023 18:20:26 GMT
Tags: hashtag1, hashtag2
Statement content: hi
`
	const parsedStatement = parseStatement(statement)
	expect(parsedStatement.content).toBe(`hi
`);
});

test('statement build & parse function compatibility: input=parse(build(input))', () => {
	const [domain, author, representative, content, supersededStatement] = Array.from({ length: 5 },randomUnicodeString)
	const tags = Array.from({ length: 4 },randomUnicodeString)
	const contentWithTrailingNewline = content + (content.match(/\n$/) ? '' : '\n')
	const time = new Date('Sun, 04 Sep 2022 14:48:50 GMT')
	const statementContent = buildStatement({domain, author, time, content: contentWithTrailingNewline, representative, supersededStatement, tags})
	const parsedStatement = parseStatement(statementContent)
	expect(parsedStatement.domain).toBe(domain)
	expect(parsedStatement.author).toBe(author)
	expect(parsedStatement.time.toUTCString()).toBe(time.toUTCString())
	expect(parsedStatement.content).toBe(contentWithTrailingNewline)
	expect(parsedStatement.representative).toBe(representative)
	expect(parsedStatement.supersededStatement).toBe(supersededStatement)
	expect(parsedStatement.tags?.sort()).toStrictEqual(tags.sort())
});


test('parse quotation', () => {
	let quotation = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Quotation
	Original author: XYZ Company Inc.
	Author verification: eXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE
	Original publication time: Sun, 04 Sep 2022 14:48:50 GMT
	Source: https://www.facebook.com/companyxzy/posts/XXXX
	Picture proof: 5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8
	Confidence: 0.9
	Quotation: we give example.com a 2/5 star rating
	Paraphrased statement: 
		Type: Rating
		Organisation name: example
		Organisation domain: example.com
		Our rating: 2/5 Stars
`
	const parsedStatement = parseStatement(quotation)
	const parsedQuotation = parseQuotation(parsedStatement.content)
	const type = parsedQuotation.type
	expect(type).toBe('rating');
});

test('quotation build & parse function compatibility: input=parse(build(input))', () => {
	const [originalAuthor, source, picture, 
		quotation, paraphrasedStatement] = Array.from({ length: 6 },randomUnicodeString)
	const authorVerification = 'yXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE'
	const originalTime = 'Sun, 04 Sep 2022 14:48:50 GMT'
	const confidence = '' + Math.random()
	const quotationContent = buildQuotationContent({originalAuthor, 
		authorVerification, originalTime, source, picture, confidence, quotation, 
		paraphrasedStatement})
	const parsedQuotation = parseQuotation(quotationContent)
	expect(parsedQuotation.originalAuthor).toBe(originalAuthor)
	expect(parsedQuotation.originalTime).toBe(originalTime)
	expect(parsedQuotation.source).toBe(source)
	expect(parsedQuotation.picture).toBe(picture)
	expect(parsedQuotation.confidence).toBe(confidence)
	expect(parsedQuotation.quotation).toBe(quotation)
	expect(parsedQuotation.paraphrasedStatement?.replace(/\n$/,'')).toBe(paraphrasedStatement)
	expect(parsedQuotation.authorVerification).toBe(authorVerification)
});

test('parse organisation verification', () => {
	let organisationVerification = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Organisation verification
	Description: We verified the following information about an organisation.
	Name: Walmart Inc.
	Country: United States of America
	Legal entity: U.S. corporation
	Owner of the domain: walmart.com
	Province or state: Arkansas
	City: Bentonville
`
	const parsedStatement = parseStatement(organisationVerification)
	const parsedOVerification = parseOrganisationVerification(parsedStatement.content)
	const name = parsedOVerification.name
	expect(name).toBe('Walmart Inc.');
});

test('organisation verification build & parse function compatibility: input=parse(build(input))', () => {
	const [name, englishName, city, domain, foreignDomain, serialNumber,
		reliabilityPolicy, pictureHash] = Array.from({ length: 8 },randomUnicodeString)
	const country = 'Germany'
	const province = 'Bayern'
	const legalForm = 'corporation'
	const employeeCount = '100-1000'
	const confidence = 0.8
	const verificationContent = buildOrganisationVerificationContent({
		name, englishName, country, city, province, legalForm, domain, pictureHash,
		foreignDomain, serialNumber, confidence, reliabilityPolicy, employeeCount })
	const parsedVerification = parseOrganisationVerification(verificationContent)
	expect(parsedVerification.name).toBe(name)
	expect(parsedVerification.englishName).toBe(englishName)
	expect(parsedVerification.country).toBe(country)
	expect(parsedVerification.city).toBe(city)
	expect(parsedVerification.province).toBe(province)
	expect(parsedVerification.legalForm).toBe(legalForm)
	expect(parsedVerification.domain).toBe(domain)
	expect(parsedVerification.foreignDomain).toBe(foreignDomain)
	expect(parsedVerification.serialNumber).toBe(serialNumber)
	expect(parsedVerification.confidence).toBe(confidence)
	expect(parsedVerification.pictureHash).toBe(pictureHash)
	expect(parsedVerification.reliabilityPolicy).toBe(reliabilityPolicy)
	expect(parsedVerification.employeeCount).toBe(employeeCount)

});


test('parse person verification', () => {
	let personVerification = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Person verification
	Description: We verified the following information about a person.
	Name: Barack Hossein Obama II
	Date of birth: 4 Aug 1961
	City of birth: Honolulu
	Country of birth: United States of America
	Owner of the domain: barackobama.com
`
	const parsedStatement = parseStatement(personVerification)
	const parsedPVerification = parsePersonVerification(parsedStatement.content)
	const name = parsedPVerification.name
	expect(name).toBe('Barack Hossein Obama II');
});

test('person verification build & parse function compatibility: input=parse(build(input))', () => {
	const [name, ownDomain, foreignDomain,
		jobTitle, employer, verificationMethod,
		picture, reliabilityPolicy] = Array.from({ length: 12 },randomUnicodeString)
	const countryOfBirth = 'Germany'
	const cityOfBirth = 'Berlin'
	const confidence = Math.random()
	const dateOfBirth = new Date(0)
	const personVerificationContent = buildPersonVerificationContent({ name, countryOfBirth, cityOfBirth, ownDomain, foreignDomain,
	dateOfBirth, jobTitle, employer, verificationMethod, confidence,
	picture, reliabilityPolicy })
	
	const parsedVerification = parsePersonVerification(personVerificationContent)
	expect(parsedVerification.name).toBe(name)
	expect(parsedVerification.ownDomain).toBe(ownDomain)
	expect(parsedVerification.foreignDomain).toBe(foreignDomain)
	expect(parsedVerification.dateOfBirth.toUTCString()).toBe(dateOfBirth.toUTCString())
	expect(parsedVerification.jobTitle).toBe(jobTitle)
	expect(parsedVerification.employer).toBe(employer)
	expect(parsedVerification.verificationMethod).toBe(verificationMethod)
	expect(parsedVerification.confidence).toBe(confidence)
	expect(parsedVerification.picture).toBe(picture)
	expect(parsedVerification.reliabilityPolicy).toBe(reliabilityPolicy)
	expect(parsedVerification.countryOfBirth).toBe(countryOfBirth)
	expect(parsedVerification.cityOfBirth).toBe(cityOfBirth)
});


test('parse rating', () => {
	let rating = `Publishing domain: localhost
Author: chris
Time: Tue, 18 Apr 2023 18:20:26 GMT
Statement content: 
	Type: Rating
	Organisation name: AMBOSS GmbH
	Organisation domain: amboss.com
	Our rating: 5/5 Stars
`
	const parsedStatement = parseStatement(rating)
	const parsedRating = parseRating(parsedStatement.content)
	const ratingNumber = parsedRating.rating
	expect(ratingNumber).toBe('5');
});

test('rating build & parse function compatibility: input=parse(build(input))', () => {
	const [organisation, domain, comment] = Array.from({ length: 3 },randomUnicodeString)
	const ratingInt = Math.ceil(Math.random() * 5)
	const rating = `${ratingInt}/5 Stars`
	const ratingContent = buildRating({organisation, domain, rating, comment})
	const parsedRating = parseRating(ratingContent)
	expect(parsedRating.organisation).toBe(organisation)
	expect(parsedRating.domain).toBe(domain)
	expect(parsedRating.rating).toBe('' + ratingInt)
	expect(parsedRating.comment).toBe(comment)
});

test('parse dispute authenticity', () => {
	let dispute = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Dispute statement authenticity
	Description: We think that the referenced statement is not authentic.
	Hash of referenced statement: 5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8
`
	const parsedStatement = parseStatement(dispute)
	const parsedDispute = parseDisputeAuthenticity(parsedStatement.content)
	const hash = parsedDispute.hash
	expect(hash).toBe('5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8');
});

test('dispute build & parse function compatibility: input=parse(build(input))', () => {
	const [hash] = Array.from({ length: 1 },randomUnicodeString)
	const disputeContent = buildDisputeAuthenticityContent({hash})
	const parsedDispute = parseDisputeAuthenticity(disputeContent)
	expect(parsedDispute.hash).toBe(hash)
});

test('parse dispute content', () => {
	let dispute = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Dispute statement content
	Description: We think that the content of the referenced statement is false.
	Hash of referenced statement: 5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8
	Confidence: 0.8
	Reliability policy: https://example.com/sdf
`
	const parsedStatement = parseStatement(dispute)
	const parsedDispute = parseDisputeContent(parsedStatement.content)
	const {hash, confidence, reliabilityPolicy} = parsedDispute
	expect(hash).toBe('5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8');
	expect(confidence).toBe(0.8);
	expect(reliabilityPolicy).toBe('https://example.com/sdf');
});

test('dispute content build & parse function compatibility: input=parse(build(input))', () => {
	const [hash] = Array.from({ length: 1 },randomUnicodeString)
	const disputeContentContent = buildDisputeContentContent({hash})
	const parsedDisputeContent = parseDisputeContent(disputeContentContent)
	expect(parsedDisputeContent.hash).toBe(hash)
});

test('parse poll', () => {
let poll = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Thu, 17 Nov 2022 13:38:20 GMT
Statement content: 
	Type: Poll
	Poll type: majority vote wins
	Country scope: United Kingdom of Great Britain and Northern Ireland (the)
	Legal entity scope: limited liability corporation
	The decision is finalized when the following nodes agree: rixdata.net
	Voting deadline: Thu, 01 Dec 2022 13:38:26 GMT
	Poll: Should the UK join the EU
	Option 1: Yes
	Option 2: No
`
	const parsedStatement = parseStatement(poll)
	const parsedPoll = parsePoll(parsedStatement.content)
	const pollTitle = parsedPoll.poll
	expect(pollTitle).toBe('Should the UK join the EU');
});

test('poll build & parse function compatibility: input=parse(build(input))', () => {
	const [country, city, legalEntity, judges, poll] = Array.from({ length: 8 },randomUnicodeString)
	const options = Array.from({ length: 2 },randomUnicodeString)
	const domainScope = ['rixdata.net']
	const deadline = new Date('Thu, 01 Dec 2022 13:38:26 GMT')
	const pollContent = buildPollContent({country, city, legalEntity, domainScope, judges, deadline, poll, pollType: undefined, options})
	const parsedPoll = parsePoll(pollContent)
	expect(parsedPoll.poll).toBe(poll)
	expect(parsedPoll.country).toBe(country)
	expect(parsedPoll.legalEntity).toBe(legalEntity)
	expect(parsedPoll.judges).toBe(judges)
	expect(parsedPoll.deadline.toUTCString()).toBe(deadline.toUTCString())
	expect(parsedPoll.options[0]).toEqual(options[0])
	expect(parsedPoll.options[1]).toEqual(options[1])
});

test('parse vote', () => {
	let vote = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Vote
	Poll id: 5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8
	Poll: ABC
	Option: XYZ
`
	const parsedStatement = parseStatement(vote)
	const parsedVote = parseVote(parsedStatement.content)
	const voteSelectedOption = parsedVote.vote
	expect(voteSelectedOption).toBe('XYZ');
});

test('vote build & parse function compatibility: input=parse(build(input))', () => {
	const [pollHash, poll, vote] = Array.from({ length: 3 },randomUnicodeString)
	const voteContent = buildVoteContent({pollHash, poll, vote})
	const parsedVote = parseVote(voteContent)
	expect(parsedVote.poll).toBe(poll)
	expect(parsedVote.pollHash).toBe(pollHash)
	expect(parsedVote.vote).toBe(vote)
});

test('parse pdf signing', () => {
	let signPdf = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Sign PDF
	Description: We hereby digitally sign the referenced PDF file.
	PDF file hash: 5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8
`
	const parsedStatement = parseStatement(signPdf)
	const parsedSignPdf = parsePDFSigning(parsedStatement.content)
	expect(parsedSignPdf.hash).toBe('5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8');
});

test('sign pdf build & parse function compatibility: input=parse(build(input))', () => {
	const hash = randomUnicodeString()
	const signPdfContent = buildPDFSigningContent({hash})
	const parsedSignPdf = parsePDFSigning(signPdfContent)
	expect(parsedSignPdf.hash).toBe(hash)
});


test('parse bounty', () => {
	let bounty = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Bounty
	In order to: Counteract corruption
	We will reward any entity that: Finds an incident of corruption at suppliers and corporate customers
	The reward is: (Annual money flows between our organisation and the affected organisation) * (Bribe sum / revenue of the organisation)
	In case of dispute, bounty claims are judged by: Global Witness Foundation
	The judge will be paid per investigated case with a maxium of: 10% of the prospective bounty
`
	const parsedStatement = parseStatement(bounty)
	const parsedBounty = parseBounty(parsedStatement.content)
	const bountyDescription = parsedBounty.bounty
	expect(bountyDescription).toBe('Finds an incident of corruption at suppliers and corporate customers');
});

test('bounty build & parse function compatibility: input=parse(build(input))', () => {
	const [motivation, bounty, reward, judge, judgePay] = Array.from({ length: 5 },randomUnicodeString)
	const bountyContent = buildBounty({motivation, bounty, reward, judge, judgePay})
	const parsedBounty = parseBounty(bountyContent)
	expect(parsedBounty.motivation).toBe(motivation)
	expect(parsedBounty.bounty).toBe(bounty)
	expect(parsedBounty.reward).toBe(reward)
	expect(parsedBounty.judge).toBe(judge)
	expect(parsedBounty.judgePay).toBe(judgePay)
});

test('parse observation', () => {
	let observation = `Publishing domain: rixdata.net
Author: Rix Data NL B.V.
Time: Wed, 16 Aug 2023 18:32:28 GMT
Tags: Russian invasion of Ukraine
Statement content: 
	Type: Observation
	Approach: A team of experts at the Yale Chief Executive Leadership Institute researched the response of international businesses to the Russian Invasion of Ukraine
	Confidence: 0.7
	Reliability policy: https://stated.rixdata.net/statement/MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads
	Subject: CISCO SYSTEMS, INC.
	Subject identity reference: https://stated.rixdata.net/statement/jvbqqbyjPCb2nP9xNfSnVL9r79c-qf1wewLt5BW-AL4
	Observation reference: https://www.yalerussianbusinessretreat.com/
	Observation: Stopped business in Russia
`
	const parsedStatement = parseStatement(observation)
	const parsedObservation = parseObservation(parsedStatement.content)
	const {confidence, reliabilityPolicy} = parsedObservation
	expect(confidence).toBe(0.7);
	expect(reliabilityPolicy).toBe('https://stated.rixdata.net/statement/MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads');
});

test('observation build & parse function compatibility: input=parse(build(input))', () => {
	const [approach, reliabilityPolicy, subject, subjectReference, observationReference, observation] = Array.from({ length: 6 },randomUnicodeString)
	const observationContent = buildObservation({approach, confidence: 0.7, reliabilityPolicy, subject, subjectReference, observationReference, observation})
	const parsedObservation = parseObservation(observationContent)
	expect(parsedObservation.approach).toBe(approach)
	expect(parsedObservation.confidence).toBe(0.7)
	expect(parsedObservation.reliabilityPolicy).toBe(reliabilityPolicy)
	expect(parsedObservation.subject).toBe(subject)
	expect(parsedObservation.subjectReference).toBe(subjectReference)
	expect(parsedObservation.observationReference).toBe(observationReference)
	expect(parsedObservation.observation).toBe(observation)
});

test('parse boycott', () => {
	let dispute = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content: 
	Type: Boycott
	Subject: example inc
`
	const parsedStatement = parseStatement(dispute)
	const parsedBoycott = parseBoycott(parsedStatement.content)
	const {subject} = parsedBoycott
	expect(subject).toBe('example inc');
});

test('boycott build & parse function compatibility: input=parse(build(input))', () => {
	const [description, subject, subjectReference] = Array.from({ length: 3 },randomUnicodeString)
	const boycottContent = buildBoycott({description, subject, subjectReference})
	const parsedBoycott = parseBoycott(boycottContent)
	expect(parsedBoycott.description).toBe(description)
	expect(parsedBoycott.subject).toBe(subject)
	expect(parsedBoycott.subjectReference).toBe(subjectReference)
});
