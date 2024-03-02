import { getAggregatedRatings } from '../api';
import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { CompactRating } from './CompactRating';

type props = {
    lt850px: boolean,
    maxSkipId: number,
    rateSubject: (arg0: subjectToRate) => void,
    subjectNameFilter?: string,
}

type ratingItem = {
    subject: string,
    alias: string,
    reference: string,
    rating?: string,
}

const RatingList = (props: props) => {
    const { lt850px, maxSkipId, subjectNameFilter } = props
    const [ratings, setRatings] = useState<AggregatedRatingDB[]>([])
    const [entities, setEntities] = useState<ratingItem[]>([
        { "subject": "DIRECTIVE (EU) 2016/680", "alias": "", "reference": "https://eur-lex.europa.eu/eli/dir/2016/680/oj" },
        { "subject": "Regulation (EU) 2016/679", "alias": "GDPR", "reference": "https://eur-lex.europa.eu/eli/reg/2016/679/oj" },
    ])
    useEffect(() => {
        entities.forEach((e) => {
            getAggregatedRatings({
                subject: e.subject, subjectReference: '', skip: 0, limit: 20, cb: (result) => {
                    const oldEntities = entities
                    oldEntities[entities.indexOf(e)].rating = result[0].average_rating !== null ? result[0].average_rating : undefined
                    setEntities(oldEntities)
                }
            })
        })
    }, [entities, subjectNameFilter])
    console.log(ratings)
    return (
        <div style={lt850px ? { marginBottom: "10%" } : { margin: "2%", borderRadius: 8 }}>
            <div style={lt850px ? { width: "100vw" } : { width: "70vw", maxWidth: "900px" }}>
                <div style={{ ...{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, ...(lt850px ? { margin: "4%" } : {}) }}>
                    <h3>Rated entities ({ratings.length})</h3> { }</div>
                <div style={(lt850px ? {} : { minHeight: '50vh' })}>

                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell align="right">Also known as</TableCell>
                                    <TableCell align="right">Defining URL</TableCell>
                                    <TableCell align="right">Rating</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {entities.map((i) => (
                                    <TableRow
                                        key={i.subject}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {i.subject}
                                        </TableCell>
                                        <TableCell align="right">{i.alias}</TableCell>
                                        <TableCell align="right">{i.reference}</TableCell>
                                        <TableCell align="right">{i.rating}</TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {ratings && ratings.length === 0 && (<div style={{ marginTop: '50px' }}>no results found.</div>)}
                    {ratings && ratings.length > 0 && ratings.map((r, i) => {
                        return (<CompactRating key={'' + i} i={'' + i} r={r} rateSubject={props.rateSubject} />)
                    })}
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', flexWrap: 'wrap' }}>
                        {entities.map((e, i) => {
                            return (<div key={i} style={{ padding: '10px', margin: '10px', backgroundColor: '#ffffff', borderRadius: 8 }}>{e[0]}</div>)
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RatingList
