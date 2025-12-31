import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
    parseStatement,
    parseOrganisationVerification,
    buildStatement,
    buildOrganisationVerificationContent
} from './protocol'

const randomUnicodeString = () =>
    Array.from({ length: 20 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 65536))
    )
        .join('')
        .replace(/[\n;>=<"''\\]/g, '')

describe('Organisation verification building', () => {
    it('build & parse function compatibility: input=parse(build(input))', () => {
        const [
            name,
            englishName,
            city,
            domain,
            foreignDomain,
            serialNumber,
            reliabilityPolicy,
        ] = Array.from({ length: 7 }, randomUnicodeString)
        const pictureHash = 'abc123_-XYZ.png'
        const country = 'Germany'
        const province = 'Bayern'
        const legalForm = 'corporation'
        const employeeCount = '100-1000'
        const confidence = 0.8
        const verificationContent = buildOrganisationVerificationContent({
            name,
            englishName,
            country,
            city,
            province,
            legalForm,
            domain,
            pictureHash,
            foreignDomain,
            serialNumber,
            confidence,
            reliabilityPolicy,
            employeeCount,
        })
        const parsedVerification =
            parseOrganisationVerification(verificationContent)
        assert.strictEqual(parsedVerification.name, name)
        assert.strictEqual(parsedVerification.englishName, englishName)
        assert.strictEqual(parsedVerification.country, country)
        assert.strictEqual(parsedVerification.city, city)
        assert.strictEqual(parsedVerification.province, province)
        assert.strictEqual(parsedVerification.legalForm, legalForm)
        assert.strictEqual(parsedVerification.domain, domain)
        assert.strictEqual(parsedVerification.foreignDomain, foreignDomain)
        assert.strictEqual(parsedVerification.serialNumber, serialNumber)
        assert.strictEqual(parsedVerification.confidence, confidence)
        assert.strictEqual(parsedVerification.pictureHash, pictureHash)
        assert.strictEqual(parsedVerification.reliabilityPolicy, reliabilityPolicy)
        assert.strictEqual(parsedVerification.employeeCount, employeeCount)
    })

})