
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
	organisation name: Walmart Inc.
	legal form: U.S. corporation
	domain of primary website: walmart.com
	headquarter city: Bentonville
	headquarter province/state: Arkansas
	headquarter country: United States of America
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


console.log(exampleStatement.match(statementRegex))
console.log(exampleStatement2.match(statementRegex))
console.log('content__', String(exampleStatement2.match(statementRegex).groups.content),  String(exampleStatement2.match(statementRegex).groups.content).match(contentRegex))

console.log('content__', String(exampleStatement.match(statementRegex).groups.content),  String(exampleStatement.match(statementRegex).groups.content).match(contentRegex))



const example = 
`	description: We verified the following information about an organisation.
	organisation name: Walmart Inc.
	legal form: U.S. corporation
	domain of primary website: walmart.com
	headquarter city: Bentonville
	headquarter province/state: Arkansas
	headquarter country: United States of America
`

var domainVerificationRegex= new RegExp(''
  + /^\tdescription: We verified the following information about an organisation.\n/.source 
  + /\torganisation name: (?<name>[^\n]+?)\n/.source 
  + /(?:\tlegal form: (?<legalForm>[^\n]+?)\n)?/.source 
  + /\tdomain of primary website: (?<domain>[^\n]+?)\n/.source
  + /(?:\theadquarter city: (?<city>[^\n]+?)\n)?/.source
  + /(?:\theadquarter province\/state: (?<province>[^\n]+?)\n)?/.source
  + /\theadquarter country: (?<country>[^\n]+?)\n$/.source
);

console.log(example.match(domainVerificationRegex))
let groups = example.match(domainVerificationRegex).groups;
console.log(groups)

module.exports = {
    domainVerificationRegex,
    statementRegex,
    domainVerificationType
}