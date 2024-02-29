import { getAggregatedRatings } from '../api';
import { useEffect, useState } from 'react';
import { CompactRating } from './CompactRating';

type props = {
    lt850px: boolean,
    maxSkipId: number,
    rateSubject: (arg0: subjectToRate) => void,
    subjectNameFilter?: string,
}

const Ratings = (props:props) => {
    const { lt850px, maxSkipId, subjectNameFilter } = props
    const [ratings, setRatings] = useState<AggregatedRatingDB[]>([])
    useEffect(() => {
        getAggregatedRatings({subject: subjectNameFilter??'', subjectReference: '', skip: 0, limit: 20, cb: (result) => {
                setRatings(result)
            }
        })
    }, [])
    console.log(ratings)
    return (
        <div style={lt850px ? {marginBottom : "10%" } : { margin: "2%", borderRadius: 8 }}>
            <div style={lt850px ? {width: "100vw"} : { width: "70vw", maxWidth: "900px" }}>
            <div style={{...{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, ...(lt850px ? {margin:"4%"}:{})}}>
                <h3>Rated entities ({ratings.length})</h3> {}</div>
                <div style ={(lt850px ? {} : {minHeight: '50vh'})}>
                    {ratings && ratings.length === 0 && (<div style={{marginTop: '50px'}}>no results found.</div>)}
                    {ratings && ratings.length > 0 && ratings.map((r,i) => {
                        return (<CompactRating i={''+i} r={r} rateSubject={props.rateSubject}/>)
                    }
                )}
            </div>
        </div>
    </div>
    )
}

export default Ratings
