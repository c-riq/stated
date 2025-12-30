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