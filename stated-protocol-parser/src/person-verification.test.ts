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
    test('build & parse function compatibility: input=parse(build(input))', () => {
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
        expect(parsedVerification.name).toBe(name)
        expect(parsedVerification.ownDomain).toBe(ownDomain)
        expect(parsedVerification.foreignDomain).toBe(foreignDomain)
        expect(parsedVerification.dateOfBirth.toUTCString()).toBe(
            dateOfBirth.toUTCString()
        )
        expect(parsedVerification.jobTitle).toBe(jobTitle)
        expect(parsedVerification.employer).toBe(employer)
        expect(parsedVerification.verificationMethod).toBe(verificationMethod)
        expect(parsedVerification.confidence).toBe(confidence)
        expect(parsedVerification.picture).toBe(picture)
        expect(parsedVerification.reliabilityPolicy).toBe(reliabilityPolicy)
        expect(parsedVerification.countryOfBirth).toBe(countryOfBirth)
        expect(parsedVerification.cityOfBirth).toBe(cityOfBirth)
    })
})