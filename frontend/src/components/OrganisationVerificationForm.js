import React from 'react';

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';

import {countries} from '../constants/country_names_iso3166'
import {legalForms} from '../constants/legalForms'
import {cities} from '../constants/cities'
import {subdivisions} from '../constants/provinces_un_locode'
import { parseStatement, buildStatement, forbiddenStrings, 
    buildOrganisationVerificationContent, parseOrganisationVerification } from '../statementFormats.js'
import GenerateStatement from './GenerateStatement';
import { sha256 } from '../utils/hash';


const OrganisationVerificationForm = props => {
    const [country, setCountry] = React.useState("");
    const [countryObject, setCountryObject] = React.useState("");
    const [legalForm, setLegalForm] = React.useState("");
    const [legalFormObject, setLegalFormObject] = React.useState("");
    const [city, setCity] = React.useState("");
    const [cityObject, setCityObject] = React.useState(null);
    const [province, setProvince] = React.useState("");
    const [provinceObject, setProvinceObject] = React.useState(null);
    const [serialNumber, setSerialNumber] = React.useState("");
    const [verifyDomain, setVerifyDomain] = React.useState("");
    const [verifyName, setVerifyName] = React.useState("");

    const generateHash = ({viaAPI}) => {
        props.setViaAPI(viaAPI)
        try {
            const content = buildOrganisationVerificationContent({verifyName, verifyDomain, city, country, province, serialNumber, legalEntity: legalForm,
                foreignDomain: "", verificationMethod: "", confidence: "", supersededVerificationHash: "", pictureHash: ""})
            const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, content})

            console.log(statement)

            const parsedStatement = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedStatement)).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement)))
                props.setisError(true)
                return
            }
            const parsedOrganisationVerification = parseOrganisationVerification(parsedStatement.content)
            if(!parsedOrganisationVerification){
                props.setAlertMessage('Invalid organisation verification (missing values)')
                props.setisError(true)
                return
            }
            props.setStatement(statement)
            sha256(statement).then((value) => { props.setStatementHash(value); });
        } catch (e) {
            props.setAlertMessage(e.message)
        }
    }

    return (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="domain to be verified"
            variant="outlined"
            placeholder='walmart.com'
            label="Domain owned by organisation"
            onChange={e => { setVerifyDomain(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
        />
        <TextField
            id="organisation name"
            variant="outlined"
            placeholder='Walmart Inc.'
            label="Name of organisation (as in business register)"
            onChange={e => { setVerifyName(e.target.value) }}
            margin="normal"
            sx={{marginTop: "0px"}}
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
                label="Headquarter country"
                />
            )}
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
            renderInput={(params) => <TextField {...params} label="Legal entity" />}
            renderOption={(props, option) => (<Box {...props} id={option[1]} >{option[2]}</Box>)}
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
            inputValue={city}
            onInputChange={(event, newInputValue) => setCity(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Headquarter city" />}
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[1]}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="province"
            options={countryObject ? subdivisions.filter(l =>(l[0] === countryObject[1] )) : []}
            autoHighlight
            getOptionLabel={(option) => option ? option[2] : ''}
            freeSolo
            onChange={(e,newvalue)=>setProvinceObject(newvalue)}
            value={provinceObject}
            inputValue={province}
            onInputChange={(event, newInputValue) => setProvince(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Province / state" />}
            renderOption={(props, option) => (<Box {...props} id={option[0] + "_" + option[1]} >{option[2]}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <TextField
            id="serial number"
            variant="outlined"
            placeholder='12345'
            label="Business register serial number"
            onChange={e => { setSerialNumber(e.target.value) }}
            sx={{marginTop: "20px"}}
        />
        {props.children}
        <GenerateStatement generateHash={generateHash} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default OrganisationVerificationForm
