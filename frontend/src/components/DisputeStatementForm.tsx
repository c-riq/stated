import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { sha256 } from '../utils/hash';
import { parseDisputeAuthenticity, buildDisputeAuthenticityContent, buildStatement, parseStatement, forbiddenStrings } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { generateEmail } from './generateEmail';


const DisputeStatementForm = (props:FormProps) => {
    const [disputedStatementHash, setDisputedStatementHash] = React.useState("");

    const prepareStatement:prepareStatement = ({method}) => {
            props.setViaAPI(method === 'api')
            const content = buildDisputeAuthenticityContent({hash: disputedStatementHash})
            const statement = buildStatement({domain: props.domain, author: props.author, representative: props.representative, time: props.serverTime, content})

            const parsedStatement = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedStatement) as string[]).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement) as string[]))
                props.setisError(true)
                return
            }
            const parsedDispute = parseDisputeAuthenticity(parsedStatement.content)
            if(!parsedDispute){
                props.setAlertMessage('Invalid dispute statement (missing values)')
                props.setisError(true)
                return
            }
            props.setStatement(statement)
            sha256(statement).then((hash) => { props.setStatementHash(hash);
                if(method === 'represent'){
                    generateEmail({statement, hash})
                } });
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
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default DisputeStatementForm
