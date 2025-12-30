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
        expect(parsedStatement.content).toBe(content)
        expect(parsedStatement.representative).toBe(representative)
        expect(parsedStatement.supersededStatement).toBe(supersededStatement)
        expect(parsedStatement.tags?.sort()).toStrictEqual(tags.sort())
    })
    test('build & parse statement with attachments', () => {
        const domain = 'example.com'
        const author = 'Test Author'
        const time = new Date('Thu, 15 Jun 2023 20:01:26 GMT')
        const content = 'Statement with attachments'
        const attachments = ['abc123_-XYZ.pdf', 'def456-_ABC.jpg', 'xyz789_hash.docx']
        
        const statementContent = buildStatement({
            domain,
            author,
            time,
            content,
            attachments,
        })
        
        const parsedStatement = parseStatement({ statement: statementContent })
        expect(parsedStatement.domain).toBe(domain)
        expect(parsedStatement.author).toBe(author)
        expect(parsedStatement.content).toBe(content)
        expect(parsedStatement.attachments).toEqual(attachments)
    })

    test('reject statement with more than 5 attachments', () => {
        const domain = 'example.com'
        const author = 'Test Author'
        const time = new Date()
        const content = 'Too many attachments\n'
        const attachments = ['hash1.pdf', 'hash2.pdf', 'hash3.pdf', 'hash4.pdf', 'hash5.pdf', 'hash6.pdf']
        
        expect(() => {
            buildStatement({
                domain,
                author,
                time,
                content,
                attachments,
            })
        }).toThrow('Maximum 5 attachments allowed')
    })

    test('reject attachment with invalid format', () => {
        const domain = 'example.com'
        const author = 'Test Author'
        const time = new Date()
        const content = 'Invalid attachment\n'
        const attachments = ['invalid file name.pdf']
        
        expect(() => {
            buildStatement({
                domain,
                author,
                time,
                content,
                attachments,
            })
        }).toThrow("Attachment 1 must be in format 'base64hash.extension' (URL-safe base64)")
    })


})