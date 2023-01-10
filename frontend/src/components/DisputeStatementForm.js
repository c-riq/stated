import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import { digest } from '../utils/hash';
import { parseDispute, buildDisputeContent, buildStatement, parseStatement, forbiddenStrings } from '../constants/statementFormats.js'


const DisputeStatementForm = props => {
    const [disputedStatementHash, setDisputedStatementHash] = React.useState("");

    const generateHash = () => {
            const content = buildDisputeContent({hash_b64: disputedStatementHash})
            const statement = buildStatement({domain: props.domain, time: props.serverTime, content})

            const parsedStatement = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedStatement)).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement)))
                props.setisError(true)
                return
            }
            const parsedDispute = parseDispute(parsedStatement.content)
            if(!parsedDispute){
                props.setAlertMessage('Invalid dispute statement (missing values)')
                props.setisError(true)
                return
            }
            props.setStatement(statement)
            digest(statement).then((value) => {props.setStatementHash(value)})
        }

    return (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="Statement hash"
            variant="outlined"
            placeholder='imdba856CQZlcZVhxFt4RP/SmYQpP75NYer4PylIUOs='
            label="Statement Hash"
            onChange={e => { setDisputedStatementHash(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime}</div>
        <Button variant="contained" onClick={() => generateHash()} margin="normal"
            sx={{marginTop: "24px"}}>
                Generate hash
        </Button>
        </FormControl>
    )
}

export default DisputeStatementForm
