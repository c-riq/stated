export const backwardsCompatibility: { [key: string]: string } = {
    'Domain Verifications': 'Organisation Verifications',
}

export const statementTypeQueryValues = [
    'Statements',
    'Organisation Verifications',
    'Person Verifications',
    'Polls',
    'Votes',
    'Collective Signatures',
    'Ratings',
    'Bounties',
    'Observations',
]

export const queryValueToStatementType = (queryValue: string) => {
    return {
        Statements: 'statement',
        'Organisation Verifications': 'organisation_verification',
        'Person Verifications': 'person_verification',
        Polls: 'poll',
        Votes: 'vote',
        'Collective Signatures': 'sign_pdf',
        Ratings: 'rating',
        Bounties: 'bounty',
        Observations: 'observation',
    }[queryValue]
}

export const updateQueryString = ({searchQuery, tagFilter, statementTypes, domainFilter, authorFilter, subjectNameFilter, subjectReferenceFilter, qualityFilter, legalFormFilter}:
        {searchQuery?: string, tagFilter?:string, statementTypes?: string[], domainFilter?: string, authorFilter?: string, subjectNameFilter?: string, subjectReferenceFilter?:string, qualityFilter?: string, legalFormFilter?: string}        
    ) => {
    const queryString = [
        (searchQuery ? 'search_query=' + searchQuery.replace(/\n/g, '%0A').replace(/\t/g, '%09')  : ''),
        (tagFilter ? 'tag=' + tagFilter : ''),
        (statementTypes?.length ? 'types=' + statementTypes : ''),
        (domainFilter ? 'domain=' + domainFilter : ''),
        (authorFilter ? 'author=' + authorFilter : ''),
        (subjectNameFilter ? 'subject_name=' + subjectNameFilter : ''),
        (subjectReferenceFilter ? 'subject_reference=' + subjectReferenceFilter : ''),
        (qualityFilter ? 'quality=' + qualityFilter : ''),
        (legalFormFilter ? 'legal_form=' + legalFormFilter : '')
      ].filter(s => s.length > 0).join('&')
      window.history.replaceState({}, '', queryString.length > 0 ? '?' + queryString : window.location.pathname)
}

export const apiQueryString = ({searchQuery, tag, limit, skip, types, domain, author, subject, quality, subjectReference, legalForm}:
    {searchQuery?: string, tag?:string, limit?: number, skip?: number, types?: string, domain?: string, author?: string,
    subject?: string, quality?: string, subjectReference?: string, legalForm?: string}) => {
    const queryString = [
        (searchQuery ? 'search_query=' + searchQuery.replace(/\n/g, '%0A').replace(/\t/g, '%09') : ''),
        (tag ? 'tag=' + tag : ''),
        (limit ? 'limit=' + limit : ''),
        (skip ? 'skip=' + skip : ''),
        (types ? 'types=' + types : ''),
        (domain ? 'domain=' + domain : ''),
        (author ? 'author=' + author : ''),
        (subject ? 'subject=' + subject : ''),
        (quality ? 'quality=' + quality : ''),
        (subjectReference ? 'subject_reference=' + subjectReference : ''),
        (legalForm ? 'legal_form=' + legalForm : '')
    ].filter(s => s.length > 0).join('&')
    return queryString
}
