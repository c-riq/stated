
type method = 'GET' | 'POST' | 'PUT' | 'DELETE'
type resDB<T extends QueryResultRow> = {
        statements: QueryResult<T>['rows'],
        time: string
    }
type cb<T> = (arg0:T[]|undefined) => void
type validatedResponseHandler<T> = (arg0:T)=>void
type _cb = (arg0:any)=>void

type dnsRes = {
    records:string[]
}
type vlogRes = {
    result:VerificationLogDB[]
}
type domainSuggestionResponse = {
    result: {
        domain: string,
        organisation: string
    }[]
}
type nameSuggestionResponse = {
    result: {
        domain: string,
        organisation: string,
        statement_hash: string
    }[]
}