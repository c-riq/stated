import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';

import { sha256 } from '../utils/hash';
import { buildStatement, parseStatement, forbiddenStrings } from '../constants/statementFormats.js'
import GenerateStatement from './GenerateStatement';


const StatementForm = props => {
    const [content, setContent] = React.useState(props.statementToJoin || "");
    const [tags, setTags] = React.useState([]);
    const [tagInput, setTagInput] = React.useState("")


    function tagHandleKeyDown(event) {
        if (event.key === "Enter") {
            const input = event.target.value.trim().replace(',','')
            if (!input.length){return}
            if (tags.indexOf(input) != -1) {
                setTagInput("")
            } else {
                setTags([...tags, input])
                setTagInput("")
            }
        }
        if (tags.length && !tagInput.length && event.key === "Backspace") {
        setTags(tags.slice(0, tags.length - 1))
        }
    }
    const tagOnBlur = () => {
        if (!tagInput){return}
        const input = tagInput.trim().replace(',','')
        if (!input.length){return}
        if (tags.indexOf(input) != -1) {
            setTagInput("")
        } else {
            setTags([...tags, input])
            setTagInput("")
        }
    }
    const handleDelete = item => () => {
        const updatedTags = [...tags]
        updatedTags.splice(updatedTags.indexOf(item), 1)
        setTags(updatedTags)
    }
    function tagHandleInputChange(event) {
        setTagInput(event.target.value)
    }


    const generateHash = ({viaAPI}) => {
        props.setViaAPI(viaAPI)
            const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, tags: props.tags, content})
            const parsedResult = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedResult)).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedResult)))
                props.setisError(true)
                return
            }

            props.setStatement(statement)
            sha256(statement).then((value) => {props.setStatementHash(value)})
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
            <TextField
                id="tags"
                variant="outlined"
                placeholder=''
                label="Tags (optional)"

                InputProps={{ 
                    startAdornment: tags.map(item => (<Chip key={item} label={item} onDelete={handleDelete(item)} style={{marginRight: "5px"}}/>))}}
                onChange={tagHandleInputChange}
                onBlur={tagOnBlur}
                onKeyDown={tagHandleKeyDown}
                value={tagInput}
                sx={{marginTop: "24px", marginBottom: "8px", width: "50vw", maxWidth: "500px"}}
            />
            {props.children}
        <GenerateStatement generateHash={generateHash} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default StatementForm
