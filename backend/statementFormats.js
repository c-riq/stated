// copied from frotend to backend directory via 'npm run build'

// TODO: use named matching groups, (did not work in the js bundle)

const examples = {
normalStatementWithTags: `Domain: rixdata.net
Time: Sun, 04 Sep 2022 14:48:50 GMT
Tags: hashtag1, hashtag2
Content: hello world
`,
domainVerification: `Domain: rixdata.net
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
	Type: domain verification
	Description: We verified the following information about an organisation.
	Organisation name: Walmart Inc.
	Headquarter country: United States of America
	Legal entity: U.S. corporation
	Domain of primary website: walmart.com
	Headquarter province or state: Arkansas
	Headquarter city: Bentonville
`,
response: `Domain: rixdata.net
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
	Type: response
	To: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
	Response: No, we don't want that.
`,
dispute: `Domain: rixdata.net
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
	Type: dispute statement
	Description: We are convinced that the referenced statement is false.
	Hash of referenced statement: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
`,
poll:`Domain: rixdata.net
Time: Thu, 17 Nov 2022 13:38:20 GMT
Content: 
	Type: poll
	Poll type: majority vote wins
	Country scope: United Kingdom of Great Britain and Northern Ireland (the)
	Legal entity scope: limited liability corporation
	Decision is finalized when the following nodes agree: rixdata.net
	Voting deadline: Thu, 01 Dec 2022 13:38:26 GMT
	Poll: Should the UK join the EU
	Option 1: Yes
	Option 2: No
`,
voteReferencingOption: `Domain: rixdata.net
Time: Thu, 17 Nov 2022 20:13:46 GMT
Content: 
	Type: vote
	Poll id: ia46YWbESPsqPalWu/cAkpH7BVT9lJb5GR1wKRsz9gI=
	Poll: Should the UK join the EU
	Vote: Yes
`,
freeTextVote: `Domain: rixdata.net
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
	Type: vote
	Poll id: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
	Vote: keep the money
`,
rating:`Domain: rixdata.net
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
	Type: trustworthiness rating
	Description: Based on doing business with the following organisation we give the following rating.
	Organisation name: AMBOSS GmbH
	Organisation domain: amboss.com
	Our rating (out of 5 stars): 5
	Comment: 
`
}

export const statementTypes = {
    statement: 'statement',
    domainVerification: 'domain verification',
    poll: 'poll',
    vote: 'vote',
    response: 'response',
    dispute: 'dispute statement',
    trustworthinessRating: 'trustworthiness rating'
}
export const buildStatement = ({domain, time, tags, content}) => {
	tags = tags || []
	const statement = "Domain: " + domain + "\n" + 
            "Time: " + time + "\n" + 
            (tags.length > 0 ? "Tags: " + tags.join(', ') + "\n" : '') +
            "Content: " +  content;
	return statement
}
export const parseStatement = (s) => {
	const statementRegex= new RegExp(''
	+ /^Domain: ([^\n]+?)\n/.source
	+ /Time: ([^\n]+?)\n/.source
	+ /(?:Tags: ([^\n]*?)\n)?/.source
	+ /Content: (?:(\n\tType: ([^\n]+?)\n[\s\S]+?$)|([\s\S]+?$))/.source
	);
	const m = s.match(statementRegex)
	return m ? {
		domain: m[1],
		time: m[2],
		tags: m[3],
		content: m[4] || m[6],
		type: m[5],
	} : {}
}
export const buildPollContent = ({country, city, legalEntity, domainScope, nodes, votingDeadline, poll, options}) => {
	const content = "\n" + 
	"\t" + "Type: poll" + "\n" +
	"\t" + "Poll type: majority vote wins" + "\n" +
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
	+ /^\n\tType: poll\n/.source 
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
	} : {}
}

export const buildDomainVerificationContent = ({verifyName, country, city, province, legalEntity, verifyDomain}) => {
	const content = "\n" + 
	"\t" + "Type: domain verification" + "\n" +
	"\t" + "Description: We verified the following information about an organisation." + "\n" +
	"\t" + "Organisation name: " + verifyName + "\n" +
	"\t" + "Headquarter country: " + country + "\n" +
	"\t" + "Legal entity: " + legalEntity + "\n" +
	"\t" + "Domain of primary website: " + verifyDomain + "\n" +
	(province ? "\t" + "Headquarter province or state: " + province + "\n" : "") +
	(city ? "\t" + "Headquarter city: " + city + "\n" : "") +
	""
	return content
}
export const parseDomainVerification = (s) => {
	const domainVerificationRegex= new RegExp(''
	+ /^\n\tType: domain verification\n/.source 
	+ /\tDescription: We verified the following information about an organisation.\n/.source 
	+ /\tOrganisation name: (?<name>[^\n]+?)\n/.source 
	+ /\tHeadquarter country: (?<country>[^\n]+?)\n/.source
	+ /\tLegal entity: (?<legalForm>[^\n]+?)\n/.source
	+ /\tDomain of primary website: (?<domain>[^\n]+?)\n/.source
	+ /(?:\tHeadquarter province or state: (?<province>[^\n]+?)\n)?/.source
	+ /(?:\tHeadquarter city: (?<city>[^\n]+?)\n)?/.source
	+ /$/.source
	);
	const m = s.match(domainVerificationRegex)
	return m ? {
		name: m[1],
		country: m[2],
		legalForm: m[3],
		domain: m[4],
		province: m[5],
		city: m[6]
	} : {}
}
export const buildVoteContent = ({hash_b64, poll, vote}) => {
	const content = "\n" + 
	"\t" + "type: vote" + "\n" +
	"\t" + "poll id: " + hash_b64 + "\n" +
	"\t" + "poll: " + poll + "\n" +
	"\t" + "vote: " + vote + "\n" +
	""
	return content
}
export const parseVote = (s) => {
	const voteRegex= new RegExp(''
	+ /^\n\tType: vote\n/.source 
	+ /\tPoll id: (?<pollHash>[^\n]+?)\n/.source 
	+ /\tPoll: (?<poll>[^\n]+?)\n/.source 
	+ /\tVote: (?<vote>[^\n]+?)\n/.source 
	+ /$/.source
	);
	const m = s.match(voteRegex)
	return m ? {
		pollHash: m[1],
		poll: m[2],
		vote: m[3]
	} : {}
}

for (let e of Object.values(examples) ){
    //continue
	console.log(e)
	try{
		const {content, type} = parseStatement(e)
		console.log(content)
		if(content && type == statementTypes.domainVerification){
			console.log(parseDomainVerification(content))
		}
	} catch (e) {
		console.log(e)
	}
}

export const forbiddenChars = s => /;|>|<|"|'|’|\\/.test(s)
export const inValid256BitBase64 = s => !(/^[A-Za-z0-9+/]{30,60}[=]{0,2}$/.test(s))
export const forbiddenStrings = a => 
	a.filter(i => 
		forbiddenChars('' + i) && inValid256BitBase64('' + i)
	)
