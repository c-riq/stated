import {
    parseStatement,
    buildStatement
} from './protocol'

const randomUnicodeString = () =>
    Array.from({ length: 20 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 65536))
    )
        .join('')
        .replace(/[\n;>=<"''\\]/g, '')

describe('Statement parsing', () => {
    test('parse basic statement', () => {
        const statement = `Publishing domain: localhost
Author: chris
Time: Tue, 18 Apr 2023 18:20:26 GMT
Tags: hashtag1, hashtag2
Format version: 5
Statement content:
hi
`
        const parsedStatement = parseStatement({ statement })
        expect(parsedStatement.content).toBe(`hi
`)
    })

    test('parse statement with translations', () => {
        const statement = `Publishing domain: example.com
Author: Example Organization
Time: Thu, 15 Jun 2023 20:01:26 GMT
Format version: 5
Statement content:
This is our official statement.
Translation es:
Esta es nuestra declaración oficial.
Translation ar:
هذا بياننا الرسمي
Translation zh:
这是我们的官方声明
Translation fr:
Ceci est notre déclaration officielle.
`
        const parsedStatement = parseStatement({ statement })
        expect(parsedStatement.content).toBe('This is our official statement.')
        expect(parsedStatement.translations).toEqual({
            es: 'Esta es nuestra declaración oficial.',
            ar: 'هذا بياننا الرسمي',
            zh: '这是我们的官方声明',
            fr: 'Ceci est notre déclaration officielle.'
        })
    })
})

describe('Statement building', () => {
    test('build & parse function compatibility: input=parse(build(input))', () => {
        const [domain, author, representative, content, supersededStatement] =
            Array.from({ length: 5 }, randomUnicodeString)
        const tags = Array.from({ length: 4 }, randomUnicodeString)
        const contentWithTrailingNewline =
            content + (content.match(/\n$/) ? '' : '\n')
        const time = new Date('Sun, 04 Sep 2022 14:48:50 GMT')
        const statementContent = buildStatement({
            domain,
            author,
            time,
            content: contentWithTrailingNewline,
            representative,
            supersededStatement,
            tags,
        })
        const parsedStatement = parseStatement({ statement: statementContent })
        expect(parsedStatement.domain).toBe(domain)
        expect(parsedStatement.author).toBe(author)
        expect(parsedStatement.time?.toUTCString()).toBe(time.toUTCString())
        expect(parsedStatement.content).toBe(contentWithTrailingNewline)
        expect(parsedStatement.representative).toBe(representative)
        expect(parsedStatement.supersededStatement).toBe(supersededStatement)
        expect(parsedStatement.tags?.sort()).toStrictEqual(tags.sort())
    })

    test('build statement with translations', () => {
        const domain = 'example.com'
        const author = 'Example Organization'
        const content = 'This is our official statement.'
        const time = new Date('Thu, 15 Jun 2023 20:01:26 GMT')
        const translations = {
            es: 'Esta es nuestra declaración oficial.',
            ar: 'هذا بياننا الرسمي',
            zh: '这是我们的官方声明',
            fr: 'Ceci est notre déclaration officielle.'
        }
        
        const statementContent = buildStatement({
            domain,
            author,
            time,
            content,
            translations,
        })
        
        const parsedStatement = parseStatement({ statement: statementContent })
        expect(parsedStatement.domain).toBe(domain)
        expect(parsedStatement.author).toBe(author)
        expect(parsedStatement.content).toBe(content + '\n')
        expect(parsedStatement.translations).toEqual(translations)
    })

    test('build statement without translations', () => {
        const domain = 'example.com'
        const author = 'Example Organization'
        const content = 'This is our official statement.'
        const time = new Date('Thu, 15 Jun 2023 20:01:26 GMT')
        
        const statementContent = buildStatement({
            domain,
            author,
            time,
            content,
        })
        
        const parsedStatement = parseStatement({ statement: statementContent })
        expect(parsedStatement.domain).toBe(domain)
        expect(parsedStatement.author).toBe(author)
        expect(parsedStatement.content).toBe(content + '\n')
        expect(parsedStatement.translations).toBeUndefined()
    })
})