import { getAggregatedRatings } from '../api';
import { useEffect, useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { Autocomplete, Box, Rating, TextField } from '@mui/material';
import { Link } from 'react-router-dom';

type props = {
    lt850px: boolean,
    rateSubject: (arg0: subjectToRate) => void,
    subjectNameFilter?: string,
    setSubjectNameFilter?: (arg0: string) => void,
    subjectReferenceFilter?: string,
    setSubjectReferenceFilter?: (arg0: string) => void,
    qualityFilter?: string,
    setQualityFilter?: (arg0: string) => void
}

const RatingsTable = (props:props) => {
    const { lt850px } = props
    const [ratings, setRatings] = useState<AggregatedRatingDB[]>([])

    const [quality, setQuality] = useState(props.qualityFilter  || "");
    const [qualityObject, setQualityObject] = useState(undefined as string[]|undefined);

    const [subjectNameFilter, setSubjectNameFilter] = useState(props.subjectNameFilter  || "");
    const [subjectReferenceFilter, setSubjectReferenceFilter] = useState(props.subjectReferenceFilter  || "");

    useEffect(() => {
        getAggregatedRatings({subject: subjectNameFilter??'', subjectReference: subjectReferenceFilter??'', quality, skip: 0, limit: 20, cb: (result) => {
                if (result) {
                    let sorted = result.sort((a, b) => { return parseInt(b.rating_count || '0') - parseInt(a.rating_count || '0') })
                    setRatings(sorted)
                }
            }
        })
    }, [subjectNameFilter, quality, subjectReferenceFilter])
    console.log(ratings)
    return (
        <div style={lt850px ? {marginBottom : "10%" } : { margin: "2%", borderRadius: 8 }}>
            <Autocomplete
                id="quality"
                options={[
                    ["Reducing existential risks"],
                    ["Reducing risks to democracy"],
                    ["Benefitting society"],
                ]}
                autoHighlight
                getOptionLabel={(option) => option ? option[0] : ''}
                freeSolo
                onChange={(e,newvalue)=>setQualityObject(newvalue as string[]) }
                onBlur={() => {
                    props.setQualityFilter?.(quality||'')
                }}
                value={qualityObject}
                inputValue={quality}
                onInputChange={(event, newInputValue) => setQuality(newInputValue)}
                renderInput={(params) => <TextField {...params} label="Rated quality" />}
                // @ts-ignore
                renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[0]}</Box>)}
                sx={{marginBottom: "12px"}}
            />
            <div style={{display: "flex", flexDirection:"row"}}>
                <TextField
                    id="subjectNameFilter"
                    label="Subject name"
                    value={subjectNameFilter}
                    onChange={(e) => setSubjectNameFilter(e.target.value)}
                    onBlur={() => {
                        props.setSubjectNameFilter?.(subjectNameFilter||'')
                    }}
                    sx={{flexGrow: 1, minWidth: "220px"}}
                />
                <TextField
                    id="subjectReferenceFilter"
                    label="Subject reference"
                    value={subjectReferenceFilter}
                    onChange={(e) => setSubjectReferenceFilter(e.target.value)}
                    onBlur={() => {
                        props.setSubjectReferenceFilter?.(subjectReferenceFilter||'')
                    }}
                    sx={{marginLeft: "20px", flexGrow: 1, width: "100%"}}
                    />
            </div>
            <div style={lt850px ? {width: "100vw"} : { width: "70vw", maxWidth: "900px" }}>
            <div style={{...{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, ...(lt850px ? {margin:"4%"}:{})}}>
                <h3>Rated entities ({ratings.length})</h3> {}</div>
                <div style ={(lt850px ? {} : {minHeight: '50vh'})}>
                    {ratings && ratings.length === 0 && (<div style={{marginTop: '50px'}}>no results found.</div>)}
                    {ratings && ratings.length > 0 && (<TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">Name</TableCell>
                                    <TableCell align="left">Defining URL</TableCell>
                                    <TableCell align="left">Rating</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell align="left" >Rating count</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ratings.map((r) => (
                                    <TableRow
                                        key={r.subject_name}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {r.subject_name}
                                        </TableCell>
                                        <TableCell align="left">{r.subject_reference}</TableCell>
                                        <TableCell align="left">
                                            <Link to={`/?search_query=subject%20name:%20${r.subject_name}&types=Ratings`} target='blank'>
                                                {parseFloat(r.average_rating!).toFixed(2)}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="left">
                                            <Link to={`/?search_query=subject%20name:%20${r.subject_name}&types=Ratings`} target='blank'>
                                                <Rating name="rating" defaultValue={parseFloat(r.average_rating!)} precision={0.25} readOnly />
                                            </Link>
                                        </TableCell>
                                        <TableCell align="left">
                                            <Link to={`/?search_query=subject%20name:%20${r.subject_name}&types=Ratings`} target='blank'>
                                                {r.rating_count}
                                            </Link>
                                        </TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>)}
            </div>
        </div>
    </div>
    )
}

export default RatingsTable
