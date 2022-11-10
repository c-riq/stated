
// copied from frotend to backend directory via 'npm run build'

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
time: Sun, 04 Sep 2022 14:48:50 GMT
content: 
	type: poll
	poll type: majority vote wins
	scope: businesses who have either been verified by twitter and referenced their domain on their profile or whose domain is referenced in the wikidata dump of october 2022.
	poll: How should Rix Data deploy 1000 EUR in January 2022?
	option 1: Donate to Wikipedia (WIKIMEDIA FOUNDATION INC, IBAN: GB12CITI18500818796270)
`,
voteReferencingOption: `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
content: 
	type: vote
	poll: 5HKiyQXGV4xavq+Nn9RXi/ndUH+2BEux3ccFIjaSk/8=
	vote: option 1: Donate to Wikipedia (WIKIMEDIA FOUNDATION INC, IBAN: GB12CITI18500818796270)
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

const statementTypes = {
    statement: 'statement',
    domainVerification: 'domain verification',
    poll: 'poll',
    vote: 'vote',
    response: 'response',
    dispute: 'dispute statement',
    trustworthinessRating: 'trustworthiness rating'
}

const statementRegex= new RegExp(''
	+ /^domain: (?<domain>[^\n]+?)\n/.source
	+ /time: (?<time>[^\n]+?)\n/.source
	+ /(?:tags: (?<tags>[^\n]*?)\n)?/.source
	+ /content: (?<content>[\s\S]+?)$/.source
);

const contentRegex= new RegExp(''
	+ /^\n\ttype: (?<type>[^\n]+?)\n/.source
	+ /(?<typedContent>[\s\S]+?)$/.source
	+ /|^(?<content>[\s\S]+?)$/.source
);

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

for (let e of Object.values(examples) ){
    continue
	console.log(e)
	try{
		const content = e.match(statementRegex)
			.groups.content.match(contentRegex)
		console.log(content.groups)

		if(content && content.groups && content.groups.typedContent == statementTypes.domainVerification){

				console.log(e.match(statementRegex).groups.content
				.match(contentRegex).groups
				.typedContent.match(domainVerificationRegex)
					.groups)

		}
	} catch (e) {
		console.log(e)
	}
	
}

const forbiddenChars = s => /;|>|<|"|'|’|\\|\//.test(s)
const inValid256BitBase64 = s => !(/^[A-Za-z0-9+/]{30,60}[=]{0,2}$/.test(s))
const forbiddenStrings = a => 
	a.filter(i => 
		forbiddenChars('' + i) && inValid256BitBase64('' + i)
	)

module.exports = {
	domainVerificationRegex,
	statementRegex,
	contentRegex,
	statementTypes,
	forbiddenStrings,
	forbiddenChars
}
