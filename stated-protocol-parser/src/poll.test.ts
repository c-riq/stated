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