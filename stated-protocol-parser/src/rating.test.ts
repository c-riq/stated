import { describe, it } from 'node:test'
import assert from 'node:assert'
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
    it('build & parse function compatibility: input=parse(build(input))', () => {
        const [subjectName, subjectReference, comment, quality] = Array.from(
            { length: 4 },
            randomUnicodeString
        )
        const rating = Math.ceil(Math.random() * 5)
        const ratingContent = buildRating({ subjectName, subjectReference, rating, comment, quality })
        const parsedRating = parseRating(ratingContent)
        assert.strictEqual(parsedRating.subjectName, subjectName)
        assert.strictEqual(parsedRating.subjectReference, subjectReference)
        assert.strictEqual(parsedRating.quality, quality)
        assert.strictEqual(parsedRating.rating, rating)
        assert.strictEqual(parsedRating.comment, comment)
    })
})