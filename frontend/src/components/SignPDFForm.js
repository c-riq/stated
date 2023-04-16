import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import Button from '@mui/material/Button';

import { digest } from '../utils/hash';
import { buildPDFSigningContent, buildStatement, parseStatement, forbiddenStrings, parsePDFSigning } from '../constants/statementFormats.js'
import GenerateStatement from './GenerateStatement';


const SignPDFForm = props => {
    const [fileHash, setFileHash] = React.useState("");
    const [file, setFile] = React.useState(new ArrayBuffer(0));

    const generateHash = ({viaAPI}) => {
            props.setViaAPI(viaAPI)
            const content = buildPDFSigningContent({hash_b64: fileHash})
            const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, content})

            const parsedStatement = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedStatement)).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement)))
                props.setisError(true)
                return
            }
            const parsedPDFSigning = parsePDFSigning(parsedStatement.content)
            if(!parsedPDFSigning){
                props.setAlertMessage('Invalid dispute statement (missing values)')
                props.setisError(true)
                return
            }
            props.setStatement(statement)
            digest(statement).then((value) => {props.setStatementHash(value)})
        }
    const handleCapture = ({ target }) => {
            const fileReader = new FileReader();
    
            fileReader.readAsDataURL(target.files[0]);
            fileReader.onload = (e) => {
                if(e.target && e.target.result){
                    setFile(e.target.result)
                }
            };
        };

    return (
        <FormControl sx={{width: "100%"}}>
            <Button
  variant="contained"
  component="label"
>
  Upload File
  <input
    type="file"
    accept="application/pdf"
    hidden
    onChange={handleCapture}
  />
</Button>

        <TextField
            id="PDF file hash"
            variant="outlined"
            placeholder='imdba856CQZlcZVhxFt4RP/SmYQpP75NYer4PylIUOs='
            label="PDF file Hash"
            onChange={e => { setFileHash(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        {props.children}
        <GenerateStatement generateHash={generateHash} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default SignPDFForm
