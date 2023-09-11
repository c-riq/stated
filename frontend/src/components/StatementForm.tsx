import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { sha256 } from '../utils/hash';
import { buildStatement, parseStatement, forbiddenStrings } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { generateEmail } from './generateEmail';


const StatementForm = (props:FormProps) => {
    const [content, setContent] = React.useState(props.statementToJoin?.content || "");

    const prepareStatement:prepareStatement = ({method}) => {
        props.setViaAPI(method === 'api')
        let statement = ''
        let parsedResult = {}
        try {
            statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, representative: props.metaData.representative, tags: props.metaData.tags, time: props.serverTime, content})
            parsedResult = parseStatement(statement)
        } catch (e) {
            props.setAlertMessage('' + e)
            props.setisError(true)
            return
        }
        if(forbiddenStrings(Object.values(parsedResult) as string[]).length > 0) {
            props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedResult) as string[]))
            props.setisError(true)
            return
        }
        props.setStatement(statement)
        sha256(statement).then((hash) => {
            props.setStatementHash(hash)
            if(method === 'represent'){
                generateEmail({statement, hash})
        }
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
                sx={{marginTop: "24px", width: "50vw", maxWidth: "500px"}}
            />
            {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default StatementForm
