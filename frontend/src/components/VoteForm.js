import React from 'react'

import Button from '@mui/material/Button';

import { digest } from '../utils/hash';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { b64ToHex } from '../utils/hash';

import { parseVote, buildVoteContent, parsePoll, parseStatement, buildStatement } from '../constants/statementFormats.js'



export const VoteForm = props => {

    const [vote, setVote] = React.useState("");

    console.log(props)
    if (!props || !(props.poll)){return (<div>no poll referenced</div>)}


    const statementParsed = parseStatement(props.poll.statement)
    const pollParsed = parsePoll(statementParsed.content)
    console.log(pollParsed)
    const options = [pollParsed.option1, pollParsed.option2, pollParsed.option3, pollParsed.option4, pollParsed.option5].filter(o=>o)

    const generateHash = () => {
        const content = buildVoteContent({hash_b64: props.poll.hash_b64, poll: pollParsed.poll , vote})
        const statement = buildStatement({domain: props.domain, time: props.serverTime, content})

            const parsedStatement = parseStatement(statement)
            const parsedVote = parseVote(parsedStatement.content)
            if(!parsedVote){
                props.setAlertMessage('Invalid vote format')
                props.setisError(true)
                return
            }
            props.setStatement(statement)
            digest(statement).then((value) => {props.setStatementHash(value)})
        }
        const handleChange = (event) => {
            setVote(event.target.value)
          }
        
    return (
        <FormControl sx={{width: "100%"}}>
        <div style={{marginTop: "12px", marginBottom:"24px"}}> <h5>Referenced poll: </h5>
            <a target="blank" href={'/statement/'+b64ToHex(props.poll.hash_b64)}>{props.poll.hash_b64}</a></div>
        <FormLabel id="polllabel">{pollParsed.poll}</FormLabel>
        <RadioGroup
        value={vote}
        onChange={handleChange}>
            {options.map((o,i) => (<FormControlLabel key={i} value={o} control={<Radio />} label={o} />
        ))}
        </RadioGroup>
        <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime}</div>
        <Button variant="contained" onClick={() => generateHash()} margin="normal"
            sx={{marginTop: "24px"}}>
                Generate hash
        </Button>
        </FormControl>
    )
}
