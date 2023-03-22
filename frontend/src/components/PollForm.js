import React from 'react'
import {Buffer} from 'buffer';


import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment'


import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';

import {countries} from '../constants/country_names_iso3166'
import {legalForms} from '../constants/legalForms'
import {cities} from '../constants/cities'
import GenerateStatement from './GenerateStatement.js'

import { parseStatement, forbiddenStrings, parsePoll, buildPollContent, buildStatement } from '../constants/statementFormats.js'


const PollForm = props => {
    const province = ''
    const [country, setCountry] = React.useState("");
    const [countryObject, setCountryObject] = React.useState("");
    const [legalForm, setLegalForm] = React.useState("");
    const [legalFormObject, setLegalFormObject] = React.useState("");
    const [city, setCity] = React.useState("");
    const [cityObject, setCityObject] = React.useState("");
    const [options, setOptions] = React.useState(['','']);
    const [domainScope, setDomainScope] = React.useState([]);
    const [nodes, setNodes] = React.useState("");
    const [votingDeadline, setVotingDeadline] = React.useState(moment());
    const [poll, setPoll] = React.useState("");


    const digest = async (input) => {
        var enc = new TextEncoder(); // utf-8
        const buf = enc.encode(input)
        const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = Buffer.from(hashArray).toString('base64');
        return hashHex
    }
    const generateHash = ({viaAPI}) => {
        props.setViaAPI(viaAPI)
        const content = buildPollContent({country, city, legalEntity: legalForm, domainScope, nodes, votingDeadline, poll, options})
        const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, content})
            console.log(statement)

            const parsedStatement = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedStatement)).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement)))
                props.setisError(true)
                return
            }
            const parsedDomainVerification = parsePoll(parsedStatement.content)
            if(!parsedDomainVerification){
                props.setAlertMessage('Invalid domain verification (missing values)')
                props.setisError(true)
                return
            }
            props.setStatement(statement)
            digest(statement).then((value) => {props.setStatementHash(value)})
        }

    return (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="poll judges"
            variant="outlined"
            placeholder='rixdata.net'
            label="Poll judging domains"
            onChange={e => { setNodes(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        <Autocomplete
            id="country"
            options={countries.countries}
            autoHighlight
            getOptionLabel={(option) => option ? option[0] : ''}
            freeSolo
            onChange={(e,newvalue)=>setCountryObject(newvalue)}
            value={countryObject}
            inputValue={country}
            onInputChange={(event, newInputValue) => setCountry(newInputValue)}
            renderOption={(props, option) => (
                <Box id={option[0]} component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                <img
                    loading="lazy"
                    width="20"
                    src={`https://flagcdn.com/w20/${option[1].toLowerCase()}.png`}
                    srcSet={`https://flagcdn.com/w40/${option[1].toLowerCase()}.png 2x`}
                    alt=""
                />
                {option[0]}
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                {...params}
                label="Voting country (optional)"
                />
            )}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="city"
            options={countryObject ? cities.cities.filter(l => l[2] == countryObject[4] ) : []}
            autoHighlight
            getOptionLabel={(option) => option ? option[1] : ''}
            freeSolo
            onChange={(e,newvalue)=>setCityObject(newvalue)}
            value={cityObject}
            inputValue={city}
            onInputChange={(event, newInputValue) => setCity(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Voting city (optional)" />}
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[1]}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="legalForm"
            options={countryObject && countryObject[1] ? 
                legalForms.legalForms.filter(l => l[0] == countryObject[1] || l[0] == 'all')
                : legalForms.legalForms}
            autoHighlight
            getOptionLabel={(option) => option ? option[2] : ''}
            freeSolo
            onChange={(e,newvalue)=>setLegalFormObject(newvalue)}
            value={legalFormObject}
            inputValue={legalForm}
            onInputChange={(event, newInputValue) => setLegalForm(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Voting legal entities (optional)" />}
            renderOption={(props, option) => (<Box {...props} id={option[1]} >{option[2]}</Box>)}
            sx={{marginTop: "20px", marginBottom: "20px"}}
        />
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateTimePicker
            label="deadline"
            value={votingDeadline}
            onChange={(v) => setVotingDeadline(v)}
            renderInput={(params) => <TextField {...params} />}
            />
        </LocalizationProvider>

        <TextField
            id="poll"
            variant="outlined"
            placeholder='What should ...'
            label="Poll"
            onChange={e => { setPoll(e.target.value) }}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        <TextField
            id="option1"
            variant="outlined"
            placeholder=''
            label="Option 1"
            onChange={e => { 
                let optionsNew = [...options]
                optionsNew[0] = e.target.value
                setOptions(optionsNew) }}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        <TextField
            id="option2"
            variant="outlined"
            placeholder=''
            label="Option 2"
            onChange={e => { 
                let optionsNew = [...options]
                optionsNew[1] = e.target.value
                setOptions(optionsNew) }}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        {props.children}
        <GenerateStatement generateHash={generateHash} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default PollForm
