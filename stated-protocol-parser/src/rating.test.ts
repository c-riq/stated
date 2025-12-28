import {
    parseStatement,
    parseRating,
    buildRating
} from './protocol'

const randomUnicodeString = () =>
    Array.from({ length: 20 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 65536))
    )
        .join('')
        .replace(/[\n;>=<"''\\]/g, '')

describe('Rating parsing', () => {
    test('parse basic rating', () => {
        let rating = `Publishing domain: localhost
Author: chris
Time: Tue, 18 Apr 2023 18:20:26 GMT
Format version: 5
Statement content: 
	Type: Rating
	Subject name: AMBOSS GmbH
	URL that identifies the subject: amboss.com
	Rated quality: AI safety
	Our rating: 5/5 Stars
`
        const parsedStatement = parseStatement({ statement: rating })
        const parsedRating = parseRating(parsedStatement.content)
        const ratingNumber = parsedRating.rating
        expect(ratingNumber).toBe(5)
        const subjectName = parsedRating.subjectName
        expect(subjectName).toBe('AMBOSS GmbH')
        const subjectReference = parsedRating.subjectReference
        expect(subjectReference).toBe('amboss.com')
        const quality = parsedRating.quality
        expect(quality).toBe('AI safety')
    })
})

describe('Rating building', () => {
    test('build & parse function compatibility: input=parse(build(input))', () => {
        const [subjectName, subjectReference, comment, quality] = Array.from(
            { length: 4 },
            randomUnicodeString
        )
        const rating = Math.ceil(Math.random() * 5)
        const ratingContent = buildRating({ subjectName, subjectReference, rating, comment, quality })
        const parsedRating = parseRating(ratingContent)
        expect(parsedRating.subjectName).toBe(subjectName)
        expect(parsedRating.subjectReference).toBe(subjectReference)
        expect(parsedRating.quality).toBe(quality)
        expect(parsedRating.rating).toBe(rating)
        expect(parsedRating.comment).toBe(comment)
    })
})