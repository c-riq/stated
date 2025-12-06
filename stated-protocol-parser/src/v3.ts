import { UTCFormat } from './constants'
import { Poll } from './types'

export const parsePollV3 = (s: string, version?: string): Poll & { pollType: string } => {
    const pollRegex = new RegExp(''
        + /^\n\tType: Poll\n/.source
        + /(?:\tPoll type: (?<pollType>[^\n]+?)\n)?/.source
        + /(?:\tWho can vote: (?<scopeDescription>[^\n]+?)\n)?/.source
        + /(?:\tLink to query defining who can vote: (?<scopeQueryLink>[^\n]+?)\n)?/.source
        + /(?:\tCountry scope: (?<country>[^\n]+?)\n)?/.source
        + /(?:\tCity scope: (?<city>[^\n]+?)\n)?/.source
        + /(?:\tLegal form scope: (?<legalEntity>[^\n]+?)\n)?/.source
        + /(?:\tDomain scope: (?<domainScope>[^\n]+?)\n)?/.source
        + /(?:\tThe decision is finalized when the following nodes agree: (?<judges>[^\n]+?)\n)?/.source
        + /(?:\tVoting deadline: (?<deadline>[^\n]+?)\n)?/.source
        + /\tPoll: (?<poll>[^\n]+?)\n/.source
        + /(?:\tOption 1: (?<option1>[^\n]+?)\n)?/.source
        + /(?:\tOption 2: (?<option2>[^\n]+?)\n)?/.source
        + /(?:\tOption 3: (?<option3>[^\n]+?)\n)?/.source
        + /(?:\tOption 4: (?<option4>[^\n]+?)\n)?/.source
        + /(?:\tOption 5: (?<option5>[^\n]+?)\n)?/.source
        + /$/.source)
    const match = s.match(pollRegex)
    if (!match) throw new Error("Invalid poll format: " + s)
    
    const m = {
        pollType: match[1],
        scopeDescription: match[2],
        scopeQueryLink: match[3],
        country: match[4],
        city: match[5],
        legalEntity: match[6],
        domainScope: match[7],
        judges: match[8],
        deadline: match[9],
        poll: match[10],
        option1: match[11],
        option2: match[12],
        option3: match[13],
        option4: match[14],
        option5: match[15]
    }
    
    const options = [m.option1, m.option2, m.option3, m.option4, m.option5].filter(o => o)
    const domainScope = m.domainScope?.split(', ')
    const deadlineStr = m.deadline
    if (!deadlineStr.match(UTCFormat)) throw new Error("Invalid poll, deadline must be in UTC: " + deadlineStr)
    
    return {
        pollType: m['pollType'],
        country: m['country'],
        scopeDescription: m['scopeDescription'],
        scopeQueryLink: m['scopeQueryLink'],
        city: m['city'],
        legalEntity: m['legalEntity'],
        domainScope: (domainScope && domainScope.length > 0) ? domainScope : undefined,
        judges: m['judges'],
        deadline: new Date(deadlineStr),
        poll: m['poll'],
        options
    }
}