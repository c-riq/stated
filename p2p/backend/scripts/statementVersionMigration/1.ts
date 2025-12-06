/* eslint-disable no-useless-concat */
// copied from frotend to backend directory via 'npm run build'

import * as v2 from "./2"

const version = 1

export type statementTypeValue = 'statement' | 'quotation' | 'organisation_verification' | 'person_verification' | 'poll' | 'vote' | 'response' | 'dispute_statement_content' | 'dispute_statement_authenticity' | 'boycott' | 'observation' | 'rating' | 'sign_pdf' | 'bounty'
export const statementTypes = {
    statement: 'statement',
    quotation: 'quotation',
    organisationVerification: 'organisation_verification',
    personVerification: 'person_verification',
    poll: 'poll',
    vote: 'vote',
    response: 'response',
    disputeContent: 'dispute_statement_content',
    disputeAuthenticity: 'dispute_statement_authenticity',
	boycott: 'boycott',
	observation: 'observation',
    rating: 'rating',
	signPdf: "sign_pdf",
	bounty: "bounty",
	unsupported: "unsupported",
}

export const buildStatement = ({domain, author, time, tags = [], content}: 
    {domain: string, author: string, time: string, tags?: string[], content:string}) => {
	const statement = "Domain: " + domain + "\n" +
			"Author: " + (author || "") + "\n" +
			"Time: " + time + "\n" +
            (tags.length > 0 ? "Tags: " + tags.join(', ') + "\n" : '') +
            "Content: " +  content;
	return statement
}
export const parseStatement = (s: string) => {
	const statementRegex= new RegExp(''
	+ /^Publishing domain: ([^\n]+?)\n/.source
	+ /Author: ([^\n]+?)\n/.source
	+ /Time: ([^\n]+?)\n/.source
	+ /(?:Tags: ([^\n]*?)\n)?/.source
	+ /Statement content: (?:(\n\tType: ([^\n]+?)\n[\s\S]+?$)|([\s\S]+?$))/.source
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

export const v1toV2 = (statement: string, supersededStatement:string) => {
	/*
	- GMT time format (.toUTCString)
	- required trailing newline after content
	*/
	const parsed = parseStatement(statement)
	if (parsed.error) throw parsed.error
	const {domain, author, time, tags, content} = parsed
	if (!domain || !time) throw 'Invalid statement format'
	const v2Parts =  {
		tags : tags ? tags.split(',').map(t => t.trim()) : [],
		time: (new Date(time))
	}
	return v2.buildStatement({domain, author, time: v2Parts.time, tags: v2Parts.tags,
		supersededStatement, content})
}
