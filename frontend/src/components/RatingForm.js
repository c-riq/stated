import React from 'react'

import { digest } from '../utils/hash';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { TextField } from '@mui/material';

import { b64ToHex } from '../utils/hash';

import { buildRating, buildStatement, parseStatement, parseRating } from '../constants/statementFormats.js'
import GenerateStatement from './GenerateStatement';

export const RatingForm = props => {

    const [organisation, setOrganisation] = React.useState("");
    const [domain, setDomain] = React.useState("");
    const [rating, setRating] = React.useState("");
    const [comment, setComment] = React.useState("");

    const options = ["0/5 Stars", "1/5 Stars", "2/5 Stars", "3/5 Stars", "4/5 Stars", "5/5 Stars"]

    const generateHash = ({viaAPI}) => {
        props.setViaAPI(viaAPI)
        const content = buildRating({organisation, domain, rating, comment})
        const statement = buildStatement({domain: props.domain, time: props.serverTime, content})

            const parsedStatement = parseStatement(statement)
            const parsedRating = parseRating(parsedStatement.content)
            if(!parsedRating){
                props.setAlertMessage('Invalid rating format')
                props.setisError(true)
                return
            }
            props.setStatement(statement)
            digest(statement).then((value) => {props.setStatementHash(value)})
        }
        const handleChange = (event) => {
            setRating(event.target.value)
        }
        
    return (
        <FormControl sx={{width: "100%"}}>
        
        <TextField
            id="Name of organisation to be rated"
            variant="outlined"
            placeholder='Walmart Inc.'
            label="Official name of organisation"
            onChange={e => { setOrganisation(e.target.value) }}
            margin="normal"
            sx={{marginTop: "0px"}}
        />
        <TextField
            id="domain of organisation to be rated (optional)"
            variant="outlined"
            placeholder='walmart.com'
            label="Primary website domain of organisation to be verified"
            onChange={e => { setDomain(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />

        <div style={{marginTop: "12px", marginBottom:"24px"}}> <h5>Your rating: </h5> </div>
        <RadioGroup
        value={rating}
        onChange={handleChange}>
            {options.map((o,i) => (<FormControlLabel key={i} value={o} control={<Radio />} label={o} />
        ))}
        </RadioGroup>

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
        <GenerateStatement generateHash={generateHash} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default RatingForm