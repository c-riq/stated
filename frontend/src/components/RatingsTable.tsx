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
import TuneIcon from '@mui/icons-material/Tune';
import { Link } from 'react-router-dom';
import { qualitiesToRateOn } from './RatingForm';

type props = {
    lt850px: boolean,
    rateSubject: (arg0: Partial<RatingDB>) => void,
    subjectNameFilter?: string,
    setSubjectNameFilter?: (arg0: string) => void,
    subjectReferenceFilter?: string,
    setSubjectReferenceFilter?: (arg0: string) => void,
    qualityFilter?: string,
    setQualityFilter?: (arg0: string) => void
}

const RatingsTable = (props: props) => {
    const { lt850px } = props
    const [ratings, setRatings] = useState<AggregatedRatingDB[]>([])

    const [quality, setQuality] = useState(props.qualityFilter || "");
    const [qualityObject, setQualityObject] = useState(undefined as string[] | undefined);

    const [subjectNameFilter, setSubjectNameFilter] = useState(props.subjectNameFilter || "");
    const [subjectReferenceFilter, setSubjectReferenceFilter] = useState(props.subjectReferenceFilter || "");

    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        getAggregatedRatings({
            subject: subjectNameFilter ?? '', subjectReference: subjectReferenceFilter ?? '', quality, skip: 0, limit: 20, cb: (result) => {
                let sorted = result.sort((a, b) => { return parseInt(b.rating_count || '0') - parseInt(a.rating_count || '0') })
                setRatings(sorted)
            }
        })
    }, [subjectNameFilter, quality, subjectReferenceFilter])
    return (
        <div style={lt850px ? { marginBottom: "10%" } : { margin: "2%", borderRadius: 8 }}>
            <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ padding: "8px" }}>
                    <h3>Rated entities ({ratings.length}) <span onClick={() => {
                        setShowFilters(!showFilters)
                    }}><TuneIcon sx={{
                        color: "rgba(0,0,0,0.5)", cursor: "pointer",
                        position: "relative", top: "5px", left: "5px"
                    }} /></span>
                    </h3>
                </div>
                <div style={{ flexGrow: 1 }}></div>
            </div>
            {(quality || showFilters) && (<Autocomplete
                id="quality"
                options={qualitiesToRateOn}
                autoHighlight
                getOptionLabel={(option) => option ? option[0] : ''}
                freeSolo
                onChange={(e, newvalue) => setQualityObject(newvalue as string[])}
                onBlur={() => {
                    props.setQualityFilter?.(quality || '')
                }}
                value={qualityObject}
                inputValue={quality}
                onInputChange={(event, newInputValue) => setQuality(newInputValue)}
                renderInput={(params) => <TextField {...params} label="Rated quality" />}
                // @ts-ignore
                renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[0]}</Box>)}
                sx={{ margin: "8px 8px 12px 8px" }}
            />)}
            <div style={{ display: "flex", flexDirection: "row", padding: "8px" }}>
                {(subjectNameFilter || showFilters) && (
                    <TextField
                        id="subjectNameFilter"
                        label="Subject name"
                        value={subjectNameFilter}
                        onChange={(e) => setSubjectNameFilter(e.target.value)}
                        onBlur={() => {
                            props.setSubjectNameFilter?.(subjectNameFilter || '')
                        }}
                        sx={{ flexGrow: 1, minWidth: "220px" }}
                    />)}
                {(subjectNameFilter || showFilters) && (
                    <TextField
                        id="subjectReferenceFilter"
                        label="Subject reference"
                        value={subjectReferenceFilter}
                        onChange={(e) => setSubjectReferenceFilter(e.target.value)}
                        onBlur={() => {
                            props.setSubjectReferenceFilter?.(subjectReferenceFilter || '')
                        }}
                        sx={{ marginLeft: "20px", flexGrow: 1, width: "100%" }}
                    />
                )}
            </div>
            <div style={lt850px ? { width: "100vw", padding: "8px" } : { width: "70vw", maxWidth: "900px" }}>

                <div style={(lt850px ? {} : { minHeight: '50vh', marginTop: "2%" })}>
                    {ratings && ratings.length === 0 && (<div style={{ marginTop: '50px' }}>no results found.</div>)}
                    {ratings && ratings.length > 0 && (<TableContainer component={Paper}>
                        <Table sx={{ ...(lt850px ? { minWidth: "90vw" } : { minWidth: 650 }) }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">Name</TableCell>
                                    <TableCell align="left" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>Defining URL</TableCell>
                                    <TableCell align="left">Rating</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell align="left" >Rating count</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ratings.map((r, i) => (
                                    <TableRow
                                        key={'' + i + r.subject_name + r.subject_reference}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, whiteSpace: "normal", wordWrap: "break-word" }}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Link to={`/?search_query=subject%20name:%20${r.subject_name}&types=Ratings`} target='blank'>
                                                {r.subject_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell align="left" style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
                                            <Link to={`/?search_query=subject%20name:%20${r.subject_name}&types=Ratings`} target='blank'>{lt850px ? (
                                                <div style={{ width: "100px", whiteSpace: "normal", wordWrap: "break-word" }}>{r.subject_reference}</div>) :
                                                r.subject_reference
                                            }</Link>
                                        </TableCell>
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
