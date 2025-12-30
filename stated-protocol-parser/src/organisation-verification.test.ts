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
    test('build & parse function compatibility: input=parse(build(input))', () => {
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
        expect(parsedVerification.name).toBe(name)
        expect(parsedVerification.englishName).toBe(englishName)
        expect(parsedVerification.country).toBe(country)
        expect(parsedVerification.city).toBe(city)
        expect(parsedVerification.province).toBe(province)
        expect(parsedVerification.legalForm).toBe(legalForm)
        expect(parsedVerification.domain).toBe(domain)
        expect(parsedVerification.foreignDomain).toBe(foreignDomain)
        expect(parsedVerification.serialNumber).toBe(serialNumber)
        expect(parsedVerification.confidence).toBe(confidence)
        expect(parsedVerification.pictureHash).toBe(pictureHash)
        expect(parsedVerification.reliabilityPolicy).toBe(reliabilityPolicy)
        expect(parsedVerification.employeeCount).toBe(employeeCount)
    })

})