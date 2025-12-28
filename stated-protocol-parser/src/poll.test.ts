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
    test('parse poll v5', () => {
        let poll = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Thu, 17 Nov 2022 13:38:20 GMT
Format version: 5
Statement content:
    Type: Poll
    Voting deadline: Thu, 01 Dec 2022 13:38:26 GMT
    Poll: Should the UK join the EU
    Option 1: Yes
    Option 2: No
    Who can vote: All universities with a ROR ID
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
    })
})

describe('Poll building', () => {
    test('build & parse function compatibility: input=parse(build(input))', () => {
        const [poll, scopeDescription] =
            Array.from({ length: 2 }, randomUnicodeString)
        const options = Array.from({ length: 2 }, randomUnicodeString)
        const deadline = new Date('Thu, 01 Dec 2022 13:38:26 GMT')
        const pollContent = buildPollContent({
            deadline,
            poll,
            options,
            scopeDescription,
        })
        const parsedPoll = parsePoll(pollContent, '5')
        expect(parsedPoll.poll).toBe(poll)
        expect(parsedPoll.scopeDescription).toBe(scopeDescription)
        expect(parsedPoll.deadline?.toUTCString()).toBe(deadline.toUTCString())
        expect(parsedPoll.options[0]).toEqual(options[0])
        expect(parsedPoll.options[1]).toEqual(options[1])
    })
})