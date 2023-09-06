import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { sha256 } from '../utils/hash';
import { parseDisputeAuthenticity, buildDisputeAuthenticityContent, buildStatement, parseStatement, forbiddenStrings } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { generateEmail } from './generateEmail';


const DisputeStatementForm = (props:FormProps) => {
    const [disputedStatementHash, setDisputedStatementHash] = React.useState("");
    const [confidence, setConfidence] = React.useState("");
    const [reliabilityPolicy, setReliabilityPolicy] = React.useState("");

    const prepareStatement:prepareStatement = ({method}) => {
            props.setViaAPI(method === 'api')
            const content = buildDisputeAuthenticityContent({hash: disputedStatementHash, confidence: parseFloat(confidence), reliabilityPolicy})
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
        <TextField
            id="confidence"
            variant="outlined"
            placeholder='0.9'
            label="Confidence (probability of correctness 0.0 - 1.0)"
            value={confidence}
            onChange={e => { 
                const str = e.target.value.replace(/[^0-9.]/g, '')
                if(parseFloat(str) < 0) return setConfidence("0")
                if(parseFloat(str) > 1) return setConfidence("1.0")
                setConfidence(str)
            }}
            sx={{marginTop: "20px"}}
        />
        <TextField
            id="reliability"
            variant="outlined"
            placeholder='https://stated.example.com/statement/NF6irhgDU0F_HEgTRKnh'
            label="Policy containing correctness guarantees"
            onChange={e => { 
                setReliabilityPolicy(e.target.value)
            }}
            sx={{marginTop: "20px"}}
        />
        {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default DisputeStatementForm
