import React from 'react'

import { sha256 } from '../utils/hash';

import FormControl from '@mui/material/FormControl';
import { Autocomplete, Box, Rating, TextField, Typography } from '@mui/material';

import { buildRating, buildStatement, parseStatement, parseRating } from '../statementFormats'
import PublishStatement from './PublishStatement';
import { sendEmail } from './generateEmail';

export const qualitiesToRateOn = [
    ["Reducing existential risks"],
    ["Reducing risks to democracy"],
    ["Benefitting society"],
    ["Honest use of the stated.ai platform"],
]

export const RatingForm = (props:FormProps & {subjectToRate?: subjectToRate}) => {

    const [subjectName, setSubjectName] = React.useState(props.subjectToRate?.subjectName??"");
    const [subjectReference, setSubjectReference] = React.useState(props.subjectToRate?.subjectReference??"");
    const [rating, setRating] = React.useState(null as null | number);
    const [quality, setQuality] = React.useState(undefined as undefined | string);
    const [qualityObject, setQualityObject] = React.useState(undefined as undefined | string[]);
    const [comment, setComment] = React.useState("");

    const prepareStatement:prepareStatement = ({method})  => {
        try {
            props.setPublishingMethod(method)
            const content = buildRating({subjectName, subjectReference, rating: rating as number, comment, quality})
            if(method === 'represent'){
                parseRating(content)
                sendEmail({content, props})
                return
            }
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, 
                representative: props.metaData.representative, tags: props.metaData.tags, supersededStatement: props.metaData.supersededStatement, time: new Date(props.serverTime), content})
            const parsedStatement = parseStatement({statement})
            parseRating(parsedStatement.content)
            props.setStatement(statement)
            sha256(statement).then((hash) => props.setStatementHash(hash))
        } catch (e: any) {
            props.setAlertMessage('Error: ' + (e?.message??''))
            props.setisError(true)
        }
    }
        
    return (
        <FormControl sx={{width: "100%"}}>
        
        <TextField
            id="Name of the organisation, product or service to be rated"
            variant="outlined"
            placeholder='Walmart Inc.'
            label="Name of the organisation, product or service to be rated"
            onChange={e => { setSubjectName(e.target.value) }}
            value={subjectName}
            margin="normal"
            sx={{marginTop: "12px"}}
        />
        <TextField
            id="URL that identifies the subject (optional)"
            variant="outlined"
            placeholder='walmart.com'
            label="URL that identifies the subject (optional)"
            onChange={e => { setSubjectReference(e.target.value) }}
            value={subjectReference}
            margin="normal"
            sx={{marginBottom: "12px"}}
        />
        <Autocomplete
            id="quality"
            options={qualitiesToRateOn}
            autoHighlight
            getOptionLabel={(option) => option ? option[0] : ''}
            freeSolo
            onChange={(e,newvalue)=>setQualityObject(newvalue as string[]) }
            inputValue={quality}
            value={qualityObject}
            onInputChange={(event, newInputValue) => setQuality(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Quality of the subject which is rated (optional)" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[0]}</Box>)}
            sx={{marginBottom: "12px", marginTop: "12px"}}
        />
        <Typography component="legend">Your rating</Typography>
        <Rating
            name="simple-controlled"
            value={rating}
            onChange={(event, newValue) => {
                setRating(newValue);
            }}
        />

        <TextField
            id="comment"
            variant="outlined"
            multiline
            rows={4}
            placeholder='We are very happy with the serivce..'
            label="Comment (optional)"
            onChange={e => { setComment(e.target.value) }}
            margin="normal"
            value={comment}
            sx={{marginTop: "24px", width: "50vw", maxWidth: "500px"}}
        />
        {props.children}
        <PublishStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}

export default RatingForm