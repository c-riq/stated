import React from 'react'

import Button from '@mui/material/Button';

import { digest } from '../utils/hash';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { b64ToHex } from '../utils/hash';

const { voteRegex, pollRegex, statementRegex, contentRegex, forbiddenStrings, domainVerificationRegex } = require('../constants/statementFormats.js')



const VoteForm = props => {

    const statementParsed = props.poll.statement.match(statementRegex).groups
    const contentParsed = statementParsed.content.match(contentRegex).groups
    const pollParsed = contentParsed.typedContent.match(pollRegex).groups
    const options = [pollParsed.option1, pollParsed.option2, pollParsed.option3, pollParsed.option4, pollParsed.option5].filter(o=>o)

    const [vote, setVote] = React.useState("");

    const generateHash = () => {
            const statement = 
            "domain: " + props.domain + "\n" + 
            "time: " + props.serverTime + "\n" + 
            "content: " + "\n" + 
            "\t" + "type: vote" + "\n" +
            "\t" + "poll hash: " + props.poll.hash_b64 + "\n" +
            "\t" + "poll: " + pollParsed.poll + "\n" +
            "\t" + "vote: " + vote + "\n" +
            ""

            const parsedStatement = statement.match(statementRegex).groups
            const parsedContent = parsedStatement.content.match(contentRegex).groups
            const parsedVote = parsedContent.typedContent.match(voteRegex)
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

export default VoteForm
