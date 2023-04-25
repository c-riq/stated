

const { parseRating, parseStatement, 
    parseOrganisationVerification, 
    parsePersonVerification, parseDispute, 
    parseVote, parsePoll } = require('./statementFormats')

test('parse statement', () => {
	const statement = `Domain: localhost
Author: chris
Time: Tue, 18 Apr 2023 18:20:26 GMT
Tags: hashtag1, hashtag2
Content: hi`
	const parsedStatement = parseStatement(statement)
	expect(parsedStatement.content).toBe('hi');
});


test('parse rating', () => {
	let rating = `Domain: localhost
Author: chris
Time: Tue, 18 Apr 2023 18:20:26 GMT
Content: 
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

test('parse org verification', () => {
	let organisationVerification = `Domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
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



test('parse person verification', () => {
	let personVerification = `Domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
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


test('parse dispute', () => {
	let dispute = `Domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
	Type: Dispute statement
	Description: We are convinced that the referenced statement is not authentic.
	Hash of referenced statement: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
`
	const parsedStatement = parseStatement(dispute)
	const parsedDispute = parseDispute(parsedStatement.content)
	const hash = parsedDispute.hash_b64
	expect(hash).toBe('5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=');
});

test('parse poll', () => {
let poll = `Domain: rixdata.net
Author: Example Inc.
Time: Thu, 17 Nov 2022 13:38:20 GMT
Content: 
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

test('parse vote', () => {
	let dispute = `Domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
	Type: Vote
	Poll id: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
	Poll: ABC
	Option: XYZ
`
	const parsedStatement = parseStatement(dispute)
	const parsedVote = parseVote(parsedStatement.content)
	const option = parsedVote.option
	expect(option).toBe('XYZ');
});

