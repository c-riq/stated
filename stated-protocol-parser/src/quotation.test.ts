import {
    parseStatement,
    parseQuotation,
    buildQuotationContent
} from './protocol'

const randomUnicodeString = () =>
    Array.from({ length: 20 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 65536))
    )
        .join('')
        .replace(/[\n;>=<"''\\]/g, '')

describe('Quotation parsing', () => {
    test('parse quotation with paraphrased rating', () => {
        let quotation = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Format version: 4
Statement content: 
	Type: Quotation
	Original author: XYZ Company Inc.
	Author verification: eXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE
	Original publication time: Sun, 04 Sep 2022 14:48:50 GMT
	Source: https://www.facebook.com/companyxzy/posts/XXXX
	Picture proof: 5HKiyQXGV4xavq-Nn9RXi_ndUH-2BEux3ccFIjaSk_8
	Confidence: 0.9
	Quotation: we give example.com a 2/5 star rating
	Paraphrased statement: 
		Type: Rating
		Organisation name: example
		Organisation domain: example.com
		Our rating: 2/5 Stars
`
        const parsedStatement = parseStatement({ statement: quotation })
        const parsedQuotation = parseQuotation(parsedStatement.content)
        const type = parsedQuotation.type
        expect(type).toBe('rating')
    })
})

describe('Quotation building', () => {
    test('build & parse function compatibility: input=parse(build(input))', () => {
        const [originalAuthor, source, picture, quotation, paraphrasedStatement] =
            Array.from({ length: 6 }, randomUnicodeString)
        const authorVerification = 'yXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE'
        const originalTime = 'Sun, 04 Sep 2022 14:48:50 GMT'
        const confidence = '' + Math.random()
        const quotationContent = buildQuotationContent({
            originalAuthor,
            authorVerification,
            originalTime,
            source,
            picture,
            confidence,
            quotation,
            paraphrasedStatement,
        })
        const parsedQuotation = parseQuotation(quotationContent)
        expect(parsedQuotation.originalAuthor).toBe(originalAuthor)
        expect(parsedQuotation.originalTime).toBe(originalTime)
        expect(parsedQuotation.source).toBe(source)
        expect(parsedQuotation.picture).toBe(picture)
        expect(parsedQuotation.confidence).toBe(confidence)
        expect(parsedQuotation.quotation).toBe(quotation)
        expect(parsedQuotation.paraphrasedStatement?.replace(/\n$/, '')).toBe(
            paraphrasedStatement
        )
        expect(parsedQuotation.authorVerification).toBe(authorVerification)
    })
})