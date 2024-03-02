import { getAggregatedRatings } from '../api';
import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { Rating } from '@mui/material';
import { Link } from 'react-router-dom';

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
    rating?: number,
    rating_count?: number,
    quality?: string
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
                    let oldEntities = entities
                    oldEntities[oldEntities.indexOf(e)].rating = result[0]?.average_rating ? parseFloat(result[0].average_rating) : undefined
                    oldEntities[oldEntities.indexOf(e)].rating_count = result[0]?.rating_count ? parseInt(result[0].rating_count) : undefined
                    oldEntities[oldEntities.indexOf(e)].quality = result[0]?.quality ? result[0].quality : undefined
                    oldEntities = oldEntities.sort((a, b) => { return (b.rating || 0) - (a.rating || 0) })
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
                    <h3>Rated entities ({entities.filter(e => (e.rating_count??0) > 0).length})</h3> { }</div>
                <div style={(lt850px ? {} : { minHeight: '50vh' })}>

                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">Name</TableCell>
                                    <TableCell align="left">Also known as</TableCell>
                                    <TableCell align="left">Defining URL</TableCell>
                                    <TableCell align="left">Rating</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell align="left" >Rating count</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {entities.map((r) => (
                                    <TableRow
                                        key={r.subject}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {r.subject}
                                        </TableCell>
                                        <TableCell align="left">{r.alias}</TableCell>
                                        <TableCell align="left">{r.reference}</TableCell>
                                        <TableCell align="left">
                                            <Link to={`/?search_query=subject%20name:%20${r.subject}&types=Ratings`} target='blank'>
                                                {r.rating}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="left">
                                            <Link to={`/?search_query=subject%20name:%20${r.subject}&types=Ratings`} target='blank'>{r.rating && 
                                                <Rating name="rating" defaultValue={r.rating} precision={0.25} readOnly />}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="left">
                                            <Link to={`/?search_query=subject%20name:%20${r.subject}&types=Ratings`} target='blank'>
                                                {r.rating_count}
                                            </Link>
                                        </TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </div>
        </div>
    )
}

export default RatingList
