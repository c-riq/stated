import React from 'react'

import { sha256 } from '../utils/hash';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import { TextField } from '@mui/material';

import { buildRating, buildStatement, parseStatement, parseRating } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { generateEmail } from './generateEmail';

export const RatingForm = (props:FormProps) => {

    const [organisation, setOrganisation] = React.useState("");
    const [domain, setDomain] = React.useState("");
    const [rating, setRating] = React.useState("");
    const [comment, setComment] = React.useState("");

    const options = ["1/5 Stars", "2/5 Stars", "3/5 Stars", "4/5 Stars", "5/5 Stars"]

    const prepareStatement:prepareStatement = ({method})  => {
        try {
            props.setPublishingMethod(method)
            const content = buildRating({organisation, domain, rating, comment})
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, 
                representative: props.metaData.representative, tags: props.metaData.tags, time: new Date(props.serverTime), content})
            const parsedStatement = parseStatement(statement)
            parseRating(parsedStatement.content)
            props.setStatement(statement)
            sha256(statement).then((hash) => { props.setStatementHash(hash); 
                if(method === 'represent'){
                    generateEmail({statement, hash})
                }
            });
        } catch (e: any) {
            props.setAlertMessage('Error: ' + (e?.message??''))
            props.setisError(true)
        }
    }
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRating(event.target.value)
    }
        
    return (
        <FormControl sx={{width: "100%"}}>
        
        <TextField
            id="Name of organisation to be rated"
            variant="outlined"
            placeholder='Walmart Inc.'
            label="Name of organisation to be rated"
            onChange={e => { setOrganisation(e.target.value) }}
            margin="normal"
            sx={{marginTop: "12px"}}
        />
        <TextField
            id="domain of organisation to be rated (optional)"
            variant="outlined"
            placeholder='walmart.com'
            label="Domain / URL of organisation (optional)"
            onChange={e => { setDomain(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "12px"}}
        />

        <div style={{marginTop: "12px", marginBottom:"12px"}}> <h5>Your rating: </h5> </div>
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
        {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}

export default RatingForm