import React from 'react'

import { sha256 } from '../utils/hash';

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

import { parseVote, buildVoteContent, parsePoll, parseStatement, buildStatement, poll, statement } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { generateEmail } from './generateEmail';
import { TextField } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getStatement, statementDB } from '../api';


export const VoteForm = (props:FormProps & {poll?: {statement: string, hash_b64: string}}) => {

    const statementParsed = (props.poll?.statement && parseStatement(props.poll.statement)) as statement | undefined
    const pollParsed = (statementParsed && parsePoll(statementParsed.content)) as poll | undefined

    const [pollHash, setPollId] = React.useState(props.poll?.hash_b64 || "");
    const [poll, setPoll] = React.useState(pollParsed?.poll || "");
    const [pollStatement, setPollStatement] = React.useState(undefined as statementDB| undefined);
    const [options, setOptions] = React.useState((pollParsed?.options || []) as string[]);
    const [vote, setVote] = React.useState("");

    React.useEffect(()=>{
        if(!pollHash){
            setPoll('No poll found')
            setOptions([])
            return
        }
        const hashQuery = '' + pollHash
        getStatement(hashQuery, res => {
            if(hashQuery !== pollHash) {return}
            setPollStatement(res)
            // @ts-ignore
            if (res?.content === undefined) {
                setPoll('No poll found')
                setOptions([])
                return
            }
            try {
                const pollParsedFromAPI = parsePoll((res as statementDB).content)
                setPoll(pollParsedFromAPI.poll)
                setOptions(pollParsedFromAPI.options)
            } catch {
                setPoll('Invalid poll')
                setOptions([])
                return
            }
        })
    },[pollHash])

    const prepareStatement:prepareStatement = ({method}) => {
        try {
            props.setPublishingMethod(method)
            const content = buildVoteContent({pollHash: pollHash, poll: poll, vote})
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author,
                representative: props.metaData.representative, tags: props.metaData.tags, time: props.serverTime, content})
            const parsedStatement = parseStatement(statement)
            parseVote(parsedStatement.content)
            props.setStatement(statement)
            sha256(statement).then((hash) => {props.setStatementHash(hash)
                if(method === 'represent'){
                    generateEmail({statement, hash})
                }
            })
        }
        catch (e) {
            props.setAlertMessage('' + e)
            props.setisError(true)
            return 
        }
    }
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setVote(event.target.value)
    }
        
    return (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="poll id"
            variant="outlined"
            placeholder='xD9GzOjk...'
            label="Poll id"
            onChange={e => { setPollId(e.target.value) }}
            value={pollHash}
            margin="normal"
            sx={{marginBottom: "12px"}}
        />
        {
        pollStatement && (pollStatement as statementDB)?.content
        ? 
            <a style={{color: '#0000ff'}} href={`/statement/${(pollStatement as statementDB).hash_b64}`} target='_blank'>
                <OpenInNewIcon style={{height: '14px'}} />View referenced statement</a>
        : 
            <div>No statement found.</div>
        }
        <FormLabel id="polllabel" style={{marginTop: '12px'}}>{poll}</FormLabel>
        <RadioGroup
            value={vote}
            onChange={handleChange}>
                {options.map((o,i) => (<FormControlLabel key={i} value={o} control={<Radio />} label={o} />
            ))}
        </RadioGroup>
        {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}
