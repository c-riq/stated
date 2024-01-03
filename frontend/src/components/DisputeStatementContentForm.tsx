import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { sha256 } from '../utils/hash';
import { buildStatement, parseStatement, buildDisputeContentContent, parseDisputeContent } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { generateEmail } from './generateEmail';
import { getStatement, statementDB, statementWithDetails } from '../api';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { FormProps, prepareStatement } from '../types';



const DisputeStatementContentForm = (props:FormProps & {statementToDisputeContent?: statementDB | statementWithDetails}) => {
    const [disputedStatementHash, setDisputedStatementHash] = React.useState(props.statementToDisputeContent?.hash_b64 ||"");
    const [confidence, setConfidence] = React.useState("");
    const [reliabilityPolicy, setReliabilityPolicy] = React.useState("");

    const [referencedStatement, setReferencedStatement] = React.useState(undefined as statementDB| undefined);

    React.useEffect(()=>{
        if(!disputedStatementHash){
            setReferencedStatement(undefined)
            return
        }
        const hashQuery = '' + disputedStatementHash
        getStatement(hashQuery, res => {
            if(hashQuery !== disputedStatementHash) {return}
            setReferencedStatement(res?.length === 1 ? res[0] : undefined)
        })
    },[disputedStatementHash])

    const prepareStatement:prepareStatement = ({method}) => {
        try {
            props.setPublishingMethod(method)
            const content = buildDisputeContentContent({hash: disputedStatementHash, confidence: parseFloat(confidence), reliabilityPolicy})
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, representative: props.metaData.representative, tags: props.metaData.tags, supersededStatement: props.metaData.supersededStatement, time: props.serverTime, content})

            const parsedStatement = parseStatement({statement})
            parseDisputeContent(parsedStatement.content)
            props.setStatement(statement)
            sha256(statement).then((hash) => { 
                props.setStatementHash(hash);
                if(method === 'represent'){
                    generateEmail({statement, hash})
                }
            });
        } catch (error) {
            props.setAlertMessage('Invalid dispute statement format')
            props.setisError(true)
        }
    }

    return (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="Statement hash"
            variant="outlined"
            placeholder='imdba856CQZlcZVhxFt4RP/SmYQpP75NYer4PylIUOs='
            label="Statement Hash"
            value={disputedStatementHash}
            onChange={e => { setDisputedStatementHash(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        {
        referencedStatement && (referencedStatement as statementDB)?.content
        ? 
            <a style={{color: '#0000ff'}} href={`/statements/${(referencedStatement as statementDB).hash_b64}`} target='_blank'>
                <OpenInNewIcon style={{height: '14px'}} />View referenced statement</a>
        : 
            <div>Referenced statement not found.</div>
        }
        <TextField
            id="confidence"
            variant="outlined"
            placeholder='0.9'
            label="Confidence (probability of correctness of your judgement 0.0 - 1.0)"
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
            placeholder='https://stated.example.com/statements/NF6irhgDU0F_HEgTRKnh'
            label="Policy containing correctness guarantees"
            onChange={e => { 
                setReliabilityPolicy(e.target.value)
            }}
            sx={{marginTop: "20px"}}
        />
        {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}

export default DisputeStatementContentForm
