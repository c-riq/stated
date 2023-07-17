import React from 'react'

import { sha256 } from '../utils/hash';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

import { parseVote, buildVoteContent, parsePoll, parseStatement, buildStatement } from '../statementFormats'
import GenerateStatement from './GenerateStatement';



export const VoteForm = (props:FormProps) => {

    const [vote, setVote] = React.useState("");

    console.log(props)
    if (!props || !(props.poll)){return (<div>no poll referenced</div>)}


    const statementParsed = parseStatement(props.poll.statement)
    const pollParsed = parsePoll(statementParsed.content)
    console.log(pollParsed)
    const options = pollParsed.options

    const generateHash = ({viaAPI}:{viaAPI:boolean}) => {
        props.setViaAPI(viaAPI)
        const content = buildVoteContent({pollHash: props.poll.hash_b64, poll: pollParsed.poll , vote})
        const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, content})

            const parsedStatement = parseStatement(statement)
            const parsedVote = parseVote(parsedStatement.content)
            if(!parsedVote){
                props.setAlertMessage('Invalid vote format')
                props.setisError(true)
                return
            }
            props.setStatement(statement)
            sha256(statement).then((value) => {props.setStatementHash(value)})
        }
        const handleChange = (event) => {
            setVote(event.target.value)
          }
        
    return (
        <FormControl sx={{width: "100%"}}>
        <div style={{marginTop: "12px", marginBottom:"24px"}}> <h5>Referenced poll: </h5>
            <a target="blank" href={'/statement/'+props.poll.hash_b64}>{props.poll.hash_b64}</a></div>
        <FormLabel id="polllabel">{pollParsed.poll}</FormLabel>
        <RadioGroup
        value={vote}
        onChange={handleChange}>
            {options.map((o,i) => (<FormControlLabel key={i} value={o} control={<Radio />} label={o} />
        ))}
        </RadioGroup>
        {props.children}
        <GenerateStatement generateHash={generateHash} serverTime={props.serverTime}/>
        </FormControl>
    )
}
