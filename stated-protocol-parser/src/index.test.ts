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
} from './index'

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