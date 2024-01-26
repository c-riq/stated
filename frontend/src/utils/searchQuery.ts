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
