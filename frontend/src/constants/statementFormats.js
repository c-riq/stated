
// copied from frotend to backend directory via 'npm run build'


const exampleStatement = `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
tags: hashtag1, hashtag2
content: hello world
`

const exampleStatement2 = `domain: rixdata.net
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
`

var statementRegex= new RegExp(''
    + /^domain: (?<domain>[^\n]+?)\n/.source
    + /time: (?<time>[^\n]+?)\n/.source
    + /(?:tags: (?<tags>[^\n]*?)\n)?/.source
    + /content: (?<content>[\s\S]+?)$/.source
);

var contentRegex= new RegExp(''
    + /^\n\ttype: (?<type>[^\n]+?)\n/.source
    + /(?<typedContent>[\s\S]+?)$/.source
    + /|^(?<content>[\s\S]+?)$/.source
);

const domainVerificationType = 'domain verification'

console.log(exampleStatement.match(statementRegex)
    .groups.content.match(contentRegex)
    .groups)

var domainVerificationRegex= new RegExp(''
  + /^\tdescription: We verified the following information about an organisation.\n/.source 
  + /\torganisation name: (?<name>[^\n]+?)\n/.source 
  + /\theadquarter country: (?<country>[^\n]+?)\n/.source
  + /\tlegal form: (?<legalForm>[^\n]+?)\n/.source
  + /\tdomain of primary website: (?<domain>[^\n]+?)\n/.source
  + /(?:\theadquarter province or state: (?<province>[^\n]+?)\n)?/.source
  + /(?:\theadquarter city: (?<city>[^\n]+?)\n)?/.source
  + /$/.source
);

console.log(exampleStatement2.match(statementRegex).groups.content
    .match(contentRegex).groups
    .typedContent.match(domainVerificationRegex)
        .groups)

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
    domainVerificationType,
    forbiddenStrings,
    forbiddenChars
}
