import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { sha256 } from '../utils/hash';
import { buildStatement, parseStatement } from '../statementFormats'
import PublishStatement from './PublishStatement';
import { sendEmail } from './generateEmail';


const StatementForm = (props:FormProps) => {
    const [content, setContent] = React.useState(props.statementToJoin?.content || "");

    const prepareStatement:prepareStatement = ({method}) => {
        props.setPublishingMethod(method)
        if(method === 'represent'){
            sendEmail({content, props})
            return
        }
        let statement = ''
        try {
            statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author,
                representative: props.metaData.representative, tags: props.metaData.tags,
                supersededStatement: props.metaData.supersededStatement, time: props.serverTime, content})
            parseStatement({statement})
        } catch (e) {
            props.setAlertMessage('' + e)
            props.setisError(true)
            return
        }
        props.setStatement(statement)
        sha256(statement).then((hash) => {
            props.setStatementHash(hash)
        })
    }

    return (
        <FormControl sx={{width: "100%"}}>
            <TextField
                id="content"
                variant="outlined"
                multiline
                rows={4}
                placeholder='hello world'
                label="Statement"
                onChange={e => { setContent(e.target.value) }}
                margin="normal"
                value={content}
                sx={{marginTop: "24px", width: (props.lt850px ? "90vw" : "50vw"), maxWidth: "500px"}}
                required
            />
            {props.children}
        <PublishStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}

export default StatementForm
