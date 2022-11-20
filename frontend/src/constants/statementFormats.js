// copied from frotend to backend directory via 'npm run build'

// TODO: use named matching groups, (did not work in the js bundle)

const examples = {
normalStatementWithTags: `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
tags: hashtag1, hashtag2
content: hello world
`,
domainVerification: `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
content: 
	type: domain verification
	description: We verified the following information about an organisation.
	organisation name: Walmart Inc.
	headquarter country: United States of America
	legal form: U.S. corporation
	domain of primary website: walmart.com
	headquarter province or state: Arkansas
	headquarter city: Bentonville
`,
response: `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
content: 
	type: response
	to: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
	response: No, we don't want that.
`,
dispute: `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
content: 
	type: dispute statement
	description: We are convinced that the referenced statement is false.
	hash of referenced statement: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
`,
poll:`domain: rixdata.net
time: Thu, 17 Nov 2022 13:38:20 GMT
content: 
	type: poll
	poll type: majority vote wins
	country scope: United Kingdom of Great Britain and Northern Ireland (the)
	legal entity scope: limited liability corporation
	decision is finalized when the following nodes agree: rixdata.net
	voting deadline: Thu, 01 Dec 2022 13:38:26 GMT
	poll: Should the UK join the EU
	option 1: Yes
	option 2: No
`,
voteReferencingOption: `domain: rixdata.net
time: Thu, 17 Nov 2022 20:13:46 GMT
content: 
	type: vote
	poll hash: ia46YWbESPsqPalWu/cAkpH7BVT9lJb5GR1wKRsz9gI=
	poll: Should the UK join the EU
	vote: Yes
`,
freeTextVote: `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
content: 
	type: vote
	poll: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
	vote: keep the money
`,
rating:`domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
content: 
	type: trustworthiness rating
	description: Based on doing business with the following organisation we give the following rating.
	organisation name: AMBOSS GmbH
	organisation domain: amboss.com
	our rating (out of 5 stars): 5
	comment: 
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
	const statement = "domain: " + domain + "\n" + 
            "time: " + time + "\n" + 
            (tags.length > 0 ? "tags: " + tags.join(', ') + "\n" : '') +
            "content: " +  content;
	return statement
}
export const parseStatement = (s) => {
	const statementRegex= new RegExp(''
	+ /^domain: ([^\n]+?)\n/.source
	+ /time: ([^\n]+?)\n/.source
	+ /(?:tags: ([^\n]*?)\n)?/.source
	+ /content: ([\s\S]+?)$/.source
	);
	const m = s.match(statementRegex)
	return m ? {
		domain: m[1],
		time: m[2],
		tags: m[3],
		content: m[4],
	} : {}
}
export const parseContent = (s) => {
	const contentRegex= new RegExp(''
	+ /^\n\ttype: ([^\n]+?)\n/.source
	+ /([\s\S]+?)$/.source
	+ /|^([\s\S]+?)$/.source
	)
	const m = s.match(contentRegex)
	return m ? {
		type: m[1],
		typedContent: m[2],
		content: m[3]
	} : {}
}
export const buildPollContent = ({country, city, legalEntity, domainScope, nodes, votingDeadline, poll, options}) => {
	const content = "\n" + 
	"\t" + "type: poll" + "\n" +
	"\t" + "poll type: majority vote wins" + "\n" +
	(country ? "\t" + "country scope: " + country + "\n" : "") +
	(city ? "\t" + "city scope: " + city + "\n" : "") +
	(legalEntity ? "\t" + "legal entity scope: " + legalEntity + "\n" : "") +
	(domainScope.length > 0 ? "\t" + "domain scope: " + domainScope.join(', ') + "\n" : "") +
	"\t" + "decision is finalized when the following nodes agree: " + nodes + "\n" +
	"\t" + "voting deadline: " + new Date(votingDeadline).toUTCString() + "\n" +
	"\t" + "poll: " + poll + "\n" +
	(options.length > 0 ? "\t" + "option 1: " + options[0] + "\n" : "") +
	(options.length > 1 ? "\t" + "option 2: " + options[1] + "\n" : "") +
	(options.length > 2 ? "\t" + "option 3: " + options[2] + "\n" : "") +
	(options.length > 3 ? "\t" + "option 4: " + options[3] + "\n" : "") +
	(options.length > 4 ? "\t" + "option 5: " + options[4] + "\n" : "") +
	""
	return content
}
export const parsePoll = (s) => {
	const pollRegex= new RegExp(''
	+ /^\tpoll type: (?<pollType>[^\n]+?)\n/.source 
	+ /(?:\tcountry scope: (?<country>[^\n]+?)\n)?/.source
	+ /(?:\tcity scope: (?<city>[^\n]+?)\n)?/.source
	+ /(?:\tlegal entity scope: (?<legalEntity>[^\n]+?)\n)?/.source
	+ /(?:\tdomain scope: (?<domainScope>[^\n]+?)\n)?/.source
	+ /\tdecision is finalized when the following nodes agree: (?<judges>[^\n]+?)\n/.source 
	+ /\tvoting deadline: (?<deadline>[^\n]+?)\n/.source 
	+ /\tpoll: (?<poll>[^\n]+?)\n/.source 
	+ /(?:\toption 1: (?<option1>[^\n]+?)\n)?/.source
	+ /(?:\toption 2: (?<option2>[^\n]+?)\n)?/.source
	+ /(?:\toption 3: (?<option3>[^\n]+?)\n)?/.source
	+ /(?:\toption 4: (?<option4>[^\n]+?)\n)?/.source
	+ /(?:\toption 5: (?<option5>[^\n]+?)\n)?/.source
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
	"\t" + "type: domain verification" + "\n" +
	"\t" + "description: We verified the following information about an organisation." + "\n" +
	"\t" + "organisation name: " + verifyName + "\n" +
	"\t" + "headquarter country: " + country + "\n" +
	"\t" + "legal entity: " + legalEntity + "\n" +
	"\t" + "domain of primary website: " + verifyDomain + "\n" +
	(province ? "\t" + "headquarter province or state: " + province + "\n" : "") +
	(city ? "\t" + "headquarter city: " + city + "\n" : "") +
	""
	return content
}
export const parseDomainVerification = (s) => {
	const domainVerificationRegex= new RegExp(''
	+ /^\tdescription: We verified the following information about an organisation.\n/.source 
	+ /\torganisation name: (?<name>[^\n]+?)\n/.source 
	+ /\theadquarter country: (?<country>[^\n]+?)\n/.source
	+ /\tlegal form: (?<legalForm>[^\n]+?)\n/.source
	+ /\tdomain of primary website: (?<domain>[^\n]+?)\n/.source
	+ /(?:\theadquarter province or state: (?<province>[^\n]+?)\n)?/.source
	+ /(?:\theadquarter city: (?<city>[^\n]+?)\n)?/.source
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
	+ /^\tpoll hash: (?<pollHash>[^\n]+?)\n/.source 
	+ /\tpoll: (?<poll>[^\n]+?)\n/.source 
	+ /\tvote: (?<vote>[^\n]+?)\n/.source 
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
    continue
	console.log(e)
	try{
		const content = parseContent(parseStatement(e).content)
		console.log(content)

		if(content && content.typedContent == statementTypes.domainVerification){

				console.log(parseDomainVerification(content.typedContent))

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
