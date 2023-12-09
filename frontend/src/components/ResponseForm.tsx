import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { sha256 } from '../utils/hash';
import { parseResponseContent, buildResponseContent, buildStatement, parseStatement } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { generateEmail } from './generateEmail';
import { getStatement, statementDB, statementWithDetails } from '../api';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';


const ResponseForm = (props:(FormProps & {statementToRespond?: statementDB | statementWithDetails})) => {
    const [referencedHash, setReferencedHash] = React.useState(props.statementToRespond?.hash_b64 || "");
    const [response, setResponse] = React.useState("");

    const [referencedStatement, setReferencedStatement] = React.useState(undefined as statementDB| undefined);

    React.useEffect(()=>{
        if(!referencedHash){
            setReferencedStatement(undefined)
            return
        }
        const hashQuery = '' + referencedHash
        getStatement(hashQuery, res => {
            if(hashQuery !== referencedHash) {return}
            setReferencedStatement(res?.length === 1 ? res[0] : undefined)
        })
    },[referencedHash])

    const prepareStatement:prepareStatement = ({method}) => {
        try {
            props.setPublishingMethod(method)
            const content = buildResponseContent({hash: referencedHash, response})
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, representative: props.metaData.representative, tags: props.metaData.tags, supersededStatement: props.metaData.supersededStatement, time: props.serverTime, content})

            const parsedStatement = parseStatement(statement)
            parseResponseContent(parsedStatement.content)
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
            onChange={e => { setReferencedHash(e.target.value) }}
            value={referencedHash}
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
                id="content"
                variant="outlined"
                multiline
                rows={4}
                placeholder='hello world'
                label="Statement"
                onChange={e => { setResponse(e.target.value) }}
                margin="normal"
                sx={{marginTop: "24px", width: "50vw", maxWidth: "500px"}}
            /> 
        {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}

export default ResponseForm
