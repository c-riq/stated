import React from 'react'
import {Buffer} from 'buffer';


import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment'

import {countries} from '../constants/country_names_iso3166'
import {cities} from '../constants/cities'
import { parseStatement, buildStatement, forbiddenStrings, 
    parsePersonVerification, buildPersonVerificationContent } from '../constants/statementFormats.js'
import GenerateStatement from './GenerateStatement';


const PersonVerificationForm = props => {
    const [birthCountry, setBirthCountry] = React.useState("");
    const [countryObject, setCountryObject] = React.useState("");
    const [birthCity, setBirthCity] = React.useState("");
    const [cityObject, setCityObject] = React.useState("");
    const [birthDate, setBirthDate] = React.useState(moment('1990-01-01'));
    const [ownsDomain, setOwnsDomain] = React.useState(true);
    const [verifyDomain, setVerifyDomain] = React.useState("");
    const [foreignDomain, setForeignDomain] = React.useState("");
    const [verifyName, setVerifyName] = React.useState("");


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
        const content = buildPersonVerificationContent({verifyName, ...(ownsDomain ? {verifyDomain} : {foreignDomain}), 
            birthCity, birthCountry, birthDate})
        const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, content})
        console.log(statement)

            const parsedStatement = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedStatement)).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement)))
                props.setisError(true)
                return
            }
            const parsedPersonVerification = parsePersonVerification(parsedStatement.content)
            if(!parsedPersonVerification){
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
            id="name"
            variant="outlined"
            placeholder='Barack Hussein Obama II'
            label="Full name (as on passport)"
            onChange={e => { setVerifyName(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        <FormControlLabel
        control={<Checkbox checked={ownsDomain} onChange={(event) => {
            setOwnsDomain(event.target.checked);
        }} />}
        label="Owns a website domain"
        />
        {ownsDomain ?
        <TextField
            id="domain to be verified"
            variant="outlined"
            placeholder='chris.me'
            label="Domain owned by person"
            onChange={e => { setVerifyDomain(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        :
        <TextField
            id="foreign domain"
            variant="outlined"
            placeholder='walmart.com'
            label="Foreign domain used for publishing statements"
            onChange={e => { setForeignDomain(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        }
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
            label="Date of birth"
            value={birthDate}
            onChange={(v) => setBirthDate(v)}
            renderInput={(params) => <TextField {...params} />}
            />
        </LocalizationProvider>
        <Autocomplete
            id="country"
            options={countries.countries}
            autoHighlight
            getOptionLabel={(option) => option ? option[0] : ''}
            freeSolo
            onChange={(e,newvalue)=>setCountryObject(newvalue)}
            value={countryObject}
            inputValue={birthCountry}
            onInputChange={(event, newInputValue) => setBirthCountry(newInputValue)}
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
                label="Country of birth"
                />
            )}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="city"
            options={countryObject ? cities.cities.filter(l => l[2] === countryObject[4] ) : []}
            autoHighlight
            getOptionLabel={(option) => option ? option[1] : ''}
            freeSolo
            onChange={(e,newvalue)=>setCityObject(newvalue)}
            value={cityObject}
            inputValue={birthCity}
            onInputChange={(event, newInputValue) => setBirthCity(newInputValue)}
            renderInput={(params) => <TextField {...params} label="City of birth" />}
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[1]}</Box>)}
            sx={{marginTop: "20px"}}
        />
        {props.children}
        <GenerateStatement generateHash={generateHash} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default PersonVerificationForm
