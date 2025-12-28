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

describe('Organisation verification parsing', () => {
    test('parse basic organisation verification', () => {
        let organisationVerification = `Stated protocol version: 5
Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement content:
    Type: Organisation verification
    Description: We verified the following information about an organisation.
    Name: Walmart Inc.
    Country: United States of America
    Legal entity: corporation
    Owner of the domain: walmart.com
    Province or state: Arkansas
    City: Bentonville
`
        const parsedStatement = parseStatement({
            statement: organisationVerification,
        })
        const parsedOVerification = parseOrganisationVerification(
            parsedStatement.content
        )
        const name = parsedOVerification.name
        expect(name).toBe('Walmart Inc.')
    })

    test('parse organisation verification with translations from formatted text', () => {
        const statement = `Stated protocol version: 5
Publishing domain: verifier.com
Author: Verification Authority
Time: Thu, 15 Jun 2023 20:01:26 GMT
Statement content:
    Type: Organisation verification
    Description: We verified the following information about an organisation.
    Name: Example Corporation
    English name: Example Corp
    Country: United States
    Legal form: corporation
    Owner of the domain: example.com
    Province or state: New York
    Business register number: 12345
    City: New York
    Latitude: 40.7128
    Longitude: -74.006
    Employee count: 100-1000
    Reliability policy: Standard verification
    Confidence: 0.95
Translation ar:
    النوع: التحقق من المنظمة
    الوصف: لقد تحققنا من المعلومات التالية حول المنظمة.
    الاسم: Example Corporation
    الاسم الإنجليزي: Example Corp
    البلد: United States
    الشكل القانوني: corporation
    مالك النطاق: example.com
    المقاطعة أو الولاية: New York
    رقم السجل التجاري: 12345
    المدينة: New York
    خط العرض: 40.7128
    خط الطول: -74.006
    عدد الموظفين: 100-1000
    سياسة الموثوقية: Standard verification
    الثقة: 0.95
Translation zh:
    类型：组织验证
    描述：我们验证了有关组织的以下信息。
    名称：Example Corporation
    英文名称：Example Corp
    国家：United States
    法律形式：corporation
    域名所有者：example.com
    省或州：New York
    商业登记号：12345
    城市：New York
    纬度：40.7128
    经度：-74.006
    员工人数：100-1000
    可靠性政策：Standard verification
    置信度：0.95
`
        
        const parsed = parseStatement({ statement })
        
        // Verify basic statement metadata
        expect(parsed.domain).toBe('verifier.com')
        expect(parsed.author).toBe('Verification Authority')
        expect(parsed.time?.toUTCString()).toBe('Thu, 15 Jun 2023 20:01:26 GMT')
        expect(parsed.type).toBe('organisation_verification')
        
        // Verify translations are parsed
        expect(parsed.translations).toBeDefined()
        expect(parsed.translations?.ar).toContain('النوع: التحقق من المنظمة')
        expect(parsed.translations?.ar).toContain('الاسم: Example Corporation')
        expect(parsed.translations?.ar).toContain('البلد: United States')
        expect(parsed.translations?.ar).toContain('الثقة: 0.95')
        
        expect(parsed.translations?.zh).toContain('类型：组织验证')
        expect(parsed.translations?.zh).toContain('名称：Example Corporation')
        expect(parsed.translations?.zh).toContain('国家：United States')
        expect(parsed.translations?.zh).toContain('置信度：0.95')
        
        // Verify the organisation verification content is parseable
        const parsedOrg = parseOrganisationVerification(parsed.content)
        expect(parsedOrg.name).toBe('Example Corporation')
        expect(parsedOrg.englishName).toBe('Example Corp')
        expect(parsedOrg.country).toBe('United States')
        expect(parsedOrg.city).toBe('New York')
        expect(parsedOrg.province).toBe('New York')
        expect(parsedOrg.legalForm).toBe('corporation')
        expect(parsedOrg.domain).toBe('example.com')
        expect(parsedOrg.serialNumber).toBe('12345')
        expect(parsedOrg.latitude).toBe(40.7128)
        expect(parsedOrg.longitude).toBe(-74.006)
        expect(parsedOrg.employeeCount).toBe('100-1000')
        expect(parsedOrg.reliabilityPolicy).toBe('Standard verification')
        expect(parsedOrg.confidence).toBe(0.95)
    })
})

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
            pictureHash,
        ] = Array.from({ length: 8 }, randomUnicodeString)
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

    test('build organisation verification with arabic and chinese translations', () => {
        const orgVerificationContent = buildOrganisationVerificationContent({
            name: 'Example Corporation',
            englishName: 'Example Corp',
            country: 'United States',
            city: 'New York',
            province: 'New York',
            legalForm: 'corporation',
            domain: 'example.com',
            foreignDomain: '',
            serialNumber: '12345',
            confidence: 0.95,
            reliabilityPolicy: 'Standard verification',
            employeeCount: '100-1000',
            pictureHash: undefined,
            latitude: 40.7128,
            longitude: -74.0060,
            population: undefined
        })
        
        const statement = buildStatement({
            domain: 'verifier.com',
            author: 'Verification Authority',
            time: new Date('Thu, 15 Jun 2023 20:01:26 GMT'),
            content: orgVerificationContent,
            translations: {
                ar: `
    النوع: التحقق من المنظمة
    الوصف: لقد تحققنا من المعلومات التالية حول المنظمة.
    الاسم: Example Corporation
    الاسم الإنجليزي: Example Corp
    البلد: United States
    الشكل القانوني: corporation
    مالك النطاق: example.com
    المقاطعة أو الولاية: New York
    رقم السجل التجاري: 12345
    المدينة: New York
    خط العرض: 40.7128
    خط الطول: -74.006
    عدد الموظفين: 100-1000
    سياسة الموثوقية: Standard verification
    الثقة: 0.95
`,
                zh: `
    类型：组织验证
    描述：我们验证了有关组织的以下信息。
    名称：Example Corporation
    英文名称：Example Corp
    国家：United States
    法律形式：corporation
    域名所有者：example.com
    省或州：New York
    商业登记号：12345
    城市：New York
    纬度：40.7128
    经度：-74.006
    员工人数：100-1000
    可靠性政策：Standard verification
    置信度：0.95
`
            }
        })
        
        const parsed = parseStatement({ statement })
        expect(parsed.type).toBe('organisation_verification')
        expect(parsed.translations?.ar).toContain('النوع: التحقق من المنظمة')
        expect(parsed.translations?.ar).toContain('    الاسم: Example Corporation')
        expect(parsed.translations?.ar).toContain('    البلد: United States')
        expect(parsed.translations?.zh).toContain('类型：组织验证')
        expect(parsed.translations?.zh).toContain('    名称：Example Corporation')
        expect(parsed.translations?.zh).toContain('    国家：United States')
        
        // Verify the organisation verification content is still parseable in English
        const parsedOrg = parseOrganisationVerification(parsed.content)
        expect(parsedOrg.name).toBe('Example Corporation')
        expect(parsedOrg.englishName).toBe('Example Corp')
        expect(parsedOrg.country).toBe('United States')
        expect(parsedOrg.city).toBe('New York')
        expect(parsedOrg.legalForm).toBe('corporation')
        expect(parsedOrg.domain).toBe('example.com')
        expect(parsedOrg.confidence).toBe(0.95)
    })
})