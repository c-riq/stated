import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { sha256 } from '../utils/hash';
import { parseDispute, buildDisputeContent, buildStatement, parseStatement, forbiddenStrings } from '../statementFormats.js'
import GenerateStatement from './GenerateStatement';


const DisputeStatementForm = props => {
    const [disputedStatementHash, setDisputedStatementHash] = React.useState("");

    const generateHash = ({viaAPI}) => {
            props.setViaAPI(viaAPI)
            const content = buildDisputeContent({hash_b64: disputedStatementHash})
            const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, content})

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
            sha256(statement).then((value) => { props.setStatementHash(value); });
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
        {props.children}
        <GenerateStatement generateHash={generateHash} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default DisputeStatementForm
