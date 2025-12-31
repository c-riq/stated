import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
    parseStatement,
    parsePersonVerification,
    buildPersonVerificationContent
} from './protocol'

const randomUnicodeString = () =>
    Array.from({ length: 20 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 65536))
    )
        .join('')
        .replace(/[\n;>=<"''\\]/g, '')

describe('Person verification building', () => {
    it('build & parse function compatibility: input=parse(build(input))', () => {
        const [
            name,
            ownDomain,
            foreignDomain,
            jobTitle,
            employer,
            verificationMethod,
            picture,
            reliabilityPolicy,
        ] = Array.from({ length: 12 }, randomUnicodeString)
        const countryOfBirth = 'Germany'
        const cityOfBirth = 'Berlin'
        const confidence = Math.random()
        const dateOfBirth = new Date(0)
        const personVerificationContent = buildPersonVerificationContent({
            name,
            countryOfBirth,
            cityOfBirth,
            ownDomain,
            foreignDomain,
            dateOfBirth,
            jobTitle,
            employer,
            verificationMethod,
            confidence,
            picture,
            reliabilityPolicy,
        })

        const parsedVerification = parsePersonVerification(
            personVerificationContent
        )
        assert.strictEqual(parsedVerification.name, name)
        assert.strictEqual(parsedVerification.ownDomain, ownDomain)
        assert.strictEqual(parsedVerification.foreignDomain, foreignDomain)
        assert.strictEqual(parsedVerification.dateOfBirth.toUTCString(),
            dateOfBirth.toUTCString()
        )
        assert.strictEqual(parsedVerification.jobTitle, jobTitle)
        assert.strictEqual(parsedVerification.employer, employer)
        assert.strictEqual(parsedVerification.verificationMethod, verificationMethod)
        assert.strictEqual(parsedVerification.confidence, confidence)
        assert.strictEqual(parsedVerification.picture, picture)
        assert.strictEqual(parsedVerification.reliabilityPolicy, reliabilityPolicy)
        assert.strictEqual(parsedVerification.countryOfBirth, countryOfBirth)
        assert.strictEqual(parsedVerification.cityOfBirth, cityOfBirth)
    })
})