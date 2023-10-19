import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import { sha256 } from '../utils/hash';
import { buildStatement, parseStatement, forbiddenStrings, buildObservation, parseObservation } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { generateEmail } from './generateEmail';
import { getNameSuggestions, getStatement, statementDB } from '../api';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Autocomplete, Box } from '@mui/material';



const ObservationForm = (props:FormProps) => {
    const [subject, setSubject] = React.useState("");
    const [subjectOptions, setSubjectOptions] = React.useState([] as {domain: string, organisation: string, statement_hash: string}[]);
    const [subjectInputValue, setSubjectInputValue] = React.useState('');

    const [referencedHash, setReferencedHash] = React.useState("");
    const [referencedVerificationStatement, setReferencedVerificationStatement] = React.useState(undefined as statementDB| undefined);

    const [observationProperty, setObservationProperty] = React.useState("");
    const [observationPropertyObject, setObservationPropertyObject] = React.useState(undefined as string[]|undefined);
    const [obervationValue, setObervationValue] = React.useState("");

    React.useEffect(()=>{
        const originalSubjectInputValue = subjectInputValue
        getNameSuggestions(originalSubjectInputValue, res  => {
            if(!res || !res.result) return
            if(originalSubjectInputValue !== subjectInputValue) return
            const uniqueNames = [...new Set(res.result.map(r => r.organisation))].map(d => 
                res.result.find(r => 
                    (r.organisation === d)))

            setSubjectOptions(uniqueNames as {domain: string, organisation: string, statement_hash: string}[])
        })
    },[subjectInputValue])

    React.useEffect(()=>{
        if(!referencedHash){
            setReferencedVerificationStatement(undefined)
            return
        }
        const hashQuery = '' + referencedHash
        getStatement(hashQuery, res => {
            if(hashQuery !== referencedHash) {return}
            setReferencedVerificationStatement(res)
        })
    },[referencedHash])

    const prepareStatement:prepareStatement = ({method}) => {
        try {
            props.setPublishingMethod(method)
            const content = buildObservation({subject, subjectReference: referencedHash, property: observationProperty, value: obervationValue})
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, representative: props.metaData.representative, tags: props.metaData.tags, time: props.serverTime, content})

            const parsedStatement = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedStatement) as string[]).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement) as string[]))
                props.setisError(true)
                return
            }
            parseObservation(parsedStatement.content)
            props.setStatement(statement)
            sha256(statement).then((hash) => { 
                props.setStatementHash(hash);
                if(method === 'represent'){
                    generateEmail({statement, hash})
                }
            });
        } catch (error) {
            props.setAlertMessage('' + error)
            props.setisError(true)
        }
    }

    return (
        <FormControl sx={{width: "100%"}}>
        <Autocomplete
            freeSolo
            disableClearable
            id="subject"
            isOptionEqualToValue={(option, value) => option && value && !!(option.organisation && option.organisation === value.organisation)}
            getOptionLabel={(option) => option ? option.organisation || '' : ''}
            options={subjectOptions}
            filterOptions={(options, state) => options}
            onChange={(event, newInputValue: string|{domain: string, organisation: string, statement_hash: string}) => {
                // @ts-ignore
                newInputValue.organisation && setSubject(newInputValue.organisation)
                // @ts-ignore
                newInputValue.statement_hash && setReferencedHash(newInputValue.statement_hash)
            }}
            onInputChange={(event, newValue) => {
                setSubjectInputValue(newValue)
                setSubject(newValue)
            }}
            renderInput={(params) => <TextField {...params} 
                label="Subject (organisation or person)" placeholder='Apple, inc.' required />}
            style={{ marginTop: "24px"}}
        />
        <TextField
            id="subjectReference"
            variant="outlined"
            placeholder='imdba856CQZlcZVhxFt4RP/SmYQpP75NYer4PylIUOs'
            label="Subject identity reference / verification statement hash (optional)"
            onChange={e => { setReferencedHash(e.target.value) }}
            value={referencedHash}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        {
        referencedVerificationStatement && (referencedVerificationStatement as statementDB)?.content
        && ['organisation_verification', 'person_verification'].includes((referencedVerificationStatement as statementDB)?.type)
        ? 
            <a style={{color: '#0000ff'}} href={`/statement/${(referencedVerificationStatement as statementDB).hash_b64}`} target='_blank'>
                <OpenInNewIcon style={{height: '14px'}} />View referenced verification statement</a>
        : 
            <div>Verification statement not found.</div>
        }

        <Autocomplete
            id="property"
            options={[
                ["Q1054766-P127","Uses this public 1024 bit RSA key"],
                ["P463","Is a member of"],
                ["Q562566","Breached this contract"]
            ]}
            autoHighlight
            getOptionLabel={(option) => option ? option[1] : ''}
            freeSolo
            onChange={(e,newvalue)=>setObservationPropertyObject(newvalue as string[]) }
            value={observationPropertyObject}
            inputValue={observationProperty}
            onInputChange={(event, newInputValue) => setObservationProperty(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Observed property" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[1]}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <TextField
                id="value"
                variant="outlined"
                placeholder='Yes'
                label="Observed value"
                multiline
                onChange={e => { setObervationValue(e.target.value) }}
                margin="normal"
                sx={{marginTop: "24px", width: "50vw", maxWidth: "500px"}}
            /> 
        {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default ObservationForm
