import {createRating, getOrganisationVerifications, getPersonVerifications, getRatings, updateRating} from './database'
import {parseRating} from './statementFormats'

const log = true

const isRatingQualified = async ({rating, domain, author, statement_hash}: {rating: Rating, domain: string, author: string, statement_hash: string}) => {
    let verificationExists = false
    const dbResultOrgVerification = await getOrganisationVerifications({domain, name: author})
    const organisationVerifications = dbResultOrgVerification?.rows ?? []
    let organisationVerification = organisationVerifications.find(v => (v.name === author))
    verificationExists = !!(organisationVerification)
    if (!verificationExists){
        const dbResultPersVerification = await getPersonVerifications({domain, name: author})
        const personVerifications = dbResultPersVerification?.rows ?? []
        let personVerification = personVerifications.find(v => (v.name === author))
        verificationExists = !!(personVerification)
        if (!verificationExists){
            return false
        }
    }

    let noExistingRatingFromAuthor = false
    const dbResultExistingVotes = await getRatings({ subjectName: rating.subjectName, subjectReference: rating.subjectReference,
        quality: rating.quality, author, publishingDomain: domain, ignore_statement_hash: statement_hash})
    noExistingRatingFromAuthor = ! (dbResultExistingVotes?.rows?.length ?? 0 > 0)
    return noExistingRatingFromAuthor
}

const ratingAlreadyExists = async (statement_hash: string) => {
    const result = await getRatings({statement_hash})
    return (result?.rows?.length ?? 0) > 0
}

export const parseAndCreateRating = ({statement_hash, domain, author, content }: { statement_hash: string, domain: string, author:string, content: string }) => (new Promise(async (resolve, reject)=>{
    log && console.log('createRating', statement_hash, domain, author, content)
    try {
        const parsedRating = parseRating(content)
        const { rating, subjectName, subjectReference, documentFileHash, comment, quality } = parsedRating
        if ((!(rating > 0 && rating < 6)) || (subjectName.length < 1 || (
                (subjectReference?.length || 0) < 1) 
                &&
                (documentFileHash?.length || 0) < 1
        )) {
            return reject(Error("Missing required fields"))
        }
        const ratingExists = await ratingAlreadyExists(statement_hash)
        const isQualified = await isRatingQualified({rating: parsedRating, domain, author, statement_hash})
        if (ratingExists && isQualified){
            const updateResult = await updateRating({statement_hash, qualified: isQualified})
            if(updateResult?.rows[0]){
                return resolve(true)
            } else {
                return reject(Error('Could not update rating'))
            }
        }
        const dbResult = await createRating({ statement_hash, subject_name: subjectName, subject_reference: subjectReference || null, rating, comment: comment || '', quality: quality || null, qualified: isQualified})   
        if(dbResult?.rows[0]){
            if (!isQualified){
                return reject(Error('Author lacks a verification or has already rated the subject on that quality'))
            }
            return resolve(true)
        } else {
            return reject(Error('Could not create rating'))
        }
    } catch (error) {
        console.log(error)
        console.trace()
        reject(error)
    }
}))
