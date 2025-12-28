import {
    parseStatement,
    parsePoll,
    buildPollContent
} from './protocol'

const randomUnicodeString = () =>
    Array.from({ length: 20 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 65536))
    )
        .join('')
        .replace(/[\n;>=<"''\\]/g, '')

describe('Poll parsing', () => {
    test('parse poll v4', () => {
        let poll = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Thu, 17 Nov 2022 13:38:20 GMT
Format version: 5
Statement content:
    Type: Poll
    The poll outcome is finalized when the following nodes agree: rixdata.net
    Voting deadline: Thu, 01 Dec 2022 13:38:26 GMT
    Poll: Should the UK join the EU
    Option 1: Yes
    Option 2: No
    Who can vote: 
        Description: All universities with a ROR ID
        Legal form scope: corporation
        All entities with the following property: ROR ID
        As observed by: Rix Data NL B.V.@rixdata.net
        Link to query defining who can vote: https://stated.rixdata.net/?search_query=%09Observed%20property:%20ROR%20ID%0A%09&domain=rixdata.net&author=Rix%20Data%20NL%20B.V.
`
        const parsedStatement = parseStatement({ statement: poll })
        const parsedPoll = parsePoll(parsedStatement.content, parsedStatement.formatVersion)
        const pollTitle = parsedPoll.poll
        expect(pollTitle).toBe('Should the UK join the EU')
        expect(parsedPoll.options[0]).toBe('Yes')
        expect(parsedPoll.options[1]).toBe('No')
        expect(parsedPoll.deadline?.toUTCString()).toBe(
            'Thu, 01 Dec 2022 13:38:26 GMT'
        )
        expect(parsedPoll.scopeDescription).toBe('All universities with a ROR ID')
        expect(parsedPoll.legalEntity).toBe('corporation')
        expect(parsedPoll.requiredProperty).toBe('ROR ID')
        expect(parsedPoll.requiredPropertyObserver).toBe(
            'Rix Data NL B.V.@rixdata.net'
        )
        expect(parsedPoll.scopeQueryLink).toBe(
            'https://stated.rixdata.net/?search_query=%09Observed%20property:%20ROR%20ID%0A%09&domain=rixdata.net&author=Rix%20Data%20NL%20B.V.'
        )
    })
})

describe('Poll building', () => {
    test('build & parse function compatibility: input=parse(build(input))', () => {
        const [country, city, legalEntity, judges, poll, scopeDescription] =
            Array.from({ length: 6 }, randomUnicodeString)
        const options = Array.from({ length: 2 }, randomUnicodeString)
        const domainScope = ['rixdata.net']
        const deadline = new Date('Thu, 01 Dec 2022 13:38:26 GMT')
        const pollContent = buildPollContent({
            country,
            city,
            legalEntity,
            domainScope,
            judges,
            deadline,
            poll,
            options,
            scopeDescription,
        })
        const parsedPoll = parsePoll(pollContent, '5')
        expect(parsedPoll.poll).toBe(poll)
        expect(parsedPoll.country).toBe(country)
        expect(parsedPoll.legalEntity).toBe(legalEntity)
        expect(parsedPoll.judges).toBe(judges)
        expect(parsedPoll.deadline?.toUTCString()).toBe(deadline.toUTCString())
        expect(parsedPoll.options[0]).toEqual(options[0])
        expect(parsedPoll.options[1]).toEqual(options[1])
    })
})