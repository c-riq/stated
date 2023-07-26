import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';

import { sha256 } from '../utils/hash';
import { buildStatement, parseStatement, forbiddenStrings } from '../statementFormats'
import GenerateStatement from './GenerateStatement';


const StatementForm = (props:FormProps) => {
    const [content, setContent] = React.useState(props.statementToJoin?.content || "");
    const [tags, setTags] = React.useState([] as string[]);
    const [tagInput, setTagInput] = React.useState("")


    const tagHandleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === "Enter") {
            const input = (e.target as HTMLTextAreaElement).value.trim().replace(',','')
            if (!(input?.length)){return}
            if (tags.indexOf(input) !== -1) {
                setTagInput("")
            } else {
                setTags([...tags, input])
                setTagInput("")
            }
        }
        if (tags.length && !tagInput.length && e.key === "Backspace") {
        setTags(tags.slice(0, tags.length - 1))
        }
    }
    const tagOnBlur = () => {
        if (!tagInput){return}
        const input = tagInput.trim().replace(',','')
        if (!input.length){return}
        if (tags.indexOf(input) !== -1) {
            setTagInput("")
        } else {
            setTags([...tags, input])
            setTagInput("")
        }
    }
    const handleDelete = (item:string) => () => {
        const updatedTags = [...tags]
        updatedTags.splice(updatedTags.indexOf(item), 1)
        setTags(updatedTags)
    }
    function tagHandleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        setTagInput(event.target.value)
    }


    const prepareStatement:prepareStatement = ({method}) => {
        props.setViaAPI(method === 'api')
            const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, tags: tags, content})
            const parsedResult = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedResult) as string[]).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedResult) as string[]))
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
            <TextField // TODO: fix tags
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
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default StatementForm
