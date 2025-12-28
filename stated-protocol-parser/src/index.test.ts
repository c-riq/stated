import {
    parseRating,
    parseStatement,
    parseOrganisationVerification,
    parsePDFSigning,
    parsePersonVerification,
    parseDisputeAuthenticity,
    parseDisputeContent,
    parseVote,
    parsePoll,
    parseQuotation,
    parseBounty,
    parseBoycott,
    parseObservation,
    parseResponseContent,
    buildResponseContent,
    buildRating,
    buildStatement,
    buildBounty,
    buildDisputeAuthenticityContent,
    buildDisputeContentContent,
    buildPDFSigningContent,
    buildPersonVerificationContent,
    buildPollContent,
    buildQuotationContent,
    buildVoteContent,
    buildOrganisationVerificationContent,
    buildBoycott,
    buildObservation,
} from './protocol'

const randomUnicodeString = () =>
    Array.from({ length: 20 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 65536))
    )
        .join('')
        .replace(/[\n;>=<"''\\]/g, '')

test('parse statement', () => {
    const statement = `Publishing domain: localhost
Author: chris
Time: Tue, 18 Apr 2023 18:20:26 GMT
Tags: hashtag1, hashtag2
Format version: 4
Statement content: hi
`
    const parsedStatement = parseStatement({ statement })
    expect(parsedStatement.content).toBe(`hi
`)
})

test('statement build & parse function compatibility: input=parse(build(input))', () => {
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
    expect(parsedStatement.content).toBe(contentWithTrailingNewline)
    expect(parsedStatement.representative).toBe(representative)
    expect(parsedStatement.supersededStatement).toBe(supersededStatement)
    expect(parsedStatement.tags?.sort()).toStrictEqual(tags.sort())
})

test('statement with translations build & parse', () => {
    const domain = 'example.com'
    const author = 'Example Organization'
    const content = 'This is our official statement.'
    const time = new Date('Thu, 15 Jun 2023 20:01:26 GMT')
    const translations = {
        es: 'Esta es nuestra declaración oficial.',
        ar: 'هذا بياننا الرسمي',
        zh: '这是我们的官方声明',
        fr: 'Ceci est notre déclaration officielle.'
    }
    
    const statementContent = buildStatement({
        domain,
        author,
        time,
        content,
        translations,
    })
    
    const parsedStatement = parseStatement({ statement: statementContent })
    expect(parsedStatement.domain).toBe(domain)
    expect(parsedStatement.author).toBe(author)
    expect(parsedStatement.content).toBe(content + '\n')
    expect(parsedStatement.translations).toEqual(translations)
})

test('statement without translations still works', () => {
    const domain = 'example.com'
    const author = 'Example Organization'
    const content = 'This is our official statement.'
    const time = new Date('Thu, 15 Jun 2023 20:01:26 GMT')
    
    const statementContent = buildStatement({
        domain,
        author,
        time,
        content,
    })
    
    const parsedStatement = parseStatement({ statement: statementContent })
    expect(parsedStatement.domain).toBe(domain)
    expect(parsedStatement.author).toBe(author)
    expect(parsedStatement.content).toBe(content + '\n')
    expect(parsedStatement.translations).toBeUndefined()
})

test('parse statement with translations', () => {
    const statement = `Publishing domain: example.com
Author: Example Organization
Time: Thu, 15 Jun 2023 20:01:26 GMT
Format version: 5
Statement content: This is our official statement.
Translation es: Esta es nuestra declaración oficial.
Translation ar: هذا بياننا الرسمي
Translation zh: 这是我们的官方声明
Translation fr: Ceci est notre déclaration officielle.
`
    const parsedStatement = parseStatement({ statement })
    expect(parsedStatement.content).toBe('This is our official statement.')
    expect(parsedStatement.translations).toEqual({
        es: 'Esta es nuestra declaración oficial.',
        ar: 'هذا بياننا الرسمي',
        zh: '这是我们的官方声明',
        fr: 'Ceci est notre déclaration officielle.'
    })
})

test('organisation verification with arabic and chinese translations', () => {
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
    expect(parsed.translations?.ar).toContain('	الاسم: Example Corporation')
    expect(parsed.translations?.ar).toContain('	البلد: United States')
    expect(parsed.translations?.zh).toContain('类型：组织验证')
    expect(parsed.translations?.zh).toContain('	名称：Example Corporation')
    expect(parsed.translations?.zh).toContain('	国家：United States')
    
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

test('parse organisation verification with translations from formatted text', () => {
    const statement = `Publishing domain: verifier.com
Author: Verification Authority
Time: Thu, 15 Jun 2023 20:01:26 GMT
Format version: 5
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

test('parse quotation', () => {
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

test('quotation build & parse function compatibility: input=parse(build(input))', () => {
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

test('parse organisation verification', () => {
    let organisationVerification = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Format version: 4
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

test('organisation verification build & parse function compatibility: input=parse(build(input))', () => {
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

test('parse person verification', () => {
    let personVerification = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Sun, 04 Sep 2022 14:48:50 GMT
Format version: 4
Statement content: 
	Type: Person verification
	Description: We verified the following information about a person.
	Name: Barack Hossein Obama II
	Date of birth: 4 Aug 1961
	City of birth: Honolulu
	Country of birth: United States of America
	Owner of the domain: barackobama.com
`
    const parsedStatement = parseStatement({ statement: personVerification })
    const parsedPVerification = parsePersonVerification(parsedStatement.content)
    const name = parsedPVerification.name
    expect(name).toBe('Barack Hossein Obama II')
})

test('person verification build & parse function compatibility: input=parse(build(input))', () => {
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

test('parse rating', () => {
    let rating = `Publishing domain: localhost
Author: chris
Time: Tue, 18 Apr 2023 18:20:26 GMT
Format version: 4
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

test('rating build & parse function compatibility: input=parse(build(input))', () => {
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

test('parse poll v4', () => {
    let poll = `Publishing domain: rixdata.net
Author: Example Inc.
Time: Thu, 17 Nov 2022 13:38:20 GMT
Format version: 4
Statement content: 
	Type: Poll
	The poll outcome is finalized when the following nodes agree: rixdata.net
	Voting deadline: Thu, 01 Dec 2022 13:38:26 GMT
	Poll: Should the UK join the EU
	Option 1: Yes
	Option 2: No
	Who can vote: 
		Description: All universities with a ROR ID
		Legal form scope: corporation
		All entities with the following property: ROR ID
		As observed by: Rix Data NL B.V.@rixdata.net
		Link to query defining who can vote: https://stated.rixdata.net/?search_query=%09Observed%20property:%20ROR%20ID%0A%09&domain=rixdata.net&author=Rix%20Data%20NL%20B.V.
`
    const parsedStatement = parseStatement({ statement: poll })
    const parsedPoll = parsePoll(parsedStatement.content)
    const pollTitle = parsedPoll.poll
    expect(pollTitle).toBe('Should the UK join the EU')
    expect(parsedPoll.options[0]).toBe('Yes')
    expect(parsedPoll.options[1]).toBe('No')
    expect(parsedPoll.deadline?.toUTCString()).toBe(
        'Thu, 01 Dec 2022 13:38:26 GMT'
    )
    expect(parsedPoll.scopeDescription).toBe('All universities with a ROR ID')
    expect(parsedPoll.legalEntity).toBe('corporation')
    expect(parsedPoll.requiredProperty).toBe('ROR ID')
    expect(parsedPoll.requiredPropertyObserver).toBe(
        'Rix Data NL B.V.@rixdata.net'
    )
    expect(parsedPoll.scopeQueryLink).toBe(
        'https://stated.rixdata.net/?search_query=%09Observed%20property:%20ROR%20ID%0A%09&domain=rixdata.net&author=Rix%20Data%20NL%20B.V.'
    )
})

test('poll build & parse function compatibility: input=parse(build(input))', () => {
    const [country, city, legalEntity, judges, poll, scopeDescription] =
        Array.from({ length: 6 }, randomUnicodeString)
    const options = Array.from({ length: 2 }, randomUnicodeString)
    const domainScope = ['rixdata.net']
    const deadline = new Date('Thu, 01 Dec 2022 13:38:26 GMT')
    const pollContent = buildPollContent({
        country,
        city,
        legalEntity,
        domainScope,
        judges,
        deadline,
        poll,
        options,
        scopeDescription,
    })
    const parsedPoll = parsePoll(pollContent)
    expect(parsedPoll.poll).toBe(poll)
    expect(parsedPoll.country).toBe(country)
    expect(parsedPoll.legalEntity).toBe(legalEntity)
    expect(parsedPoll.judges).toBe(judges)
    expect(parsedPoll.deadline?.toUTCString()).toBe(deadline.toUTCString())
    expect(parsedPoll.options[0]).toEqual(options[0])
    expect(parsedPoll.options[1]).toEqual(options[1])
})