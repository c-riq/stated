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
    buildOrganisationVerificationContent, parseOrganisationVerification, employeeCounts } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { sha256 } from '../utils/hash';
import { generateEmail } from './generateEmail';

const OrganisationVerificationForm = (props:FormProps) => {
    const [country, setCountry] = React.useState("");
    const [countryObject, setCountryObject] = React.useState(undefined as string[]|undefined);
    const [legalForm, setLegalForm] = React.useState(legalForms.corporation);
    const [legalFormObject, setLegalFormObject] = React.useState(legalForms.corporation);
    const [city, setCity] = React.useState("");
    const [cityObject, setCityObject] = React.useState(undefined as string[]|undefined);
    const [province, setProvince] = React.useState("");
    const [provinceObject, setProvinceObject] = React.useState(undefined as string[]|undefined);
    const [serialNumber, setSerialNumber] = React.useState("");
    const [verifyDomain, setVerifyDomain] = React.useState("");
    const [verifyName, setVerifyName] = React.useState("");
    const [employeeCount, setEmployeeCount] = React.useState("");
    const [employeeCountObject, setEmployeeCountObject] = React.useState(undefined as string|undefined);
    const [confidence, setConfidence] = React.useState("");
    const [reliabilityPolicy, setReliabilityPolicy] = React.useState("");

    const prepareStatement:prepareStatement = ({method}) => {
        props.setViaAPI(method === 'api')
        try {
            const content = buildOrganisationVerificationContent({name: verifyName, domain: verifyDomain, city, country, province, serialNumber, legalForm,
                foreignDomain: "", confidence: parseFloat(confidence), reliabilityPolicy, pictureHash: "", employeeCount})
            const statement = buildStatement({domain: props.domain, author: props.author, representative: props.representative, time: props.serverTime, content})

            console.log(statement)

            const parsedStatement = parseStatement(statement)
            if(forbiddenStrings(Object.values(parsedStatement) as string[]).length > 0) {
                props.setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement) as string[]))
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
            sha256(statement).then((hash) => { props.setStatementHash(hash);
                if(method === 'represent'){
                    generateEmail({statement, hash})
                } });
        } catch (e: any) {
            props.setAlertMessage('Error: ' + (e?.message??''))
            props.setisError(true)
        }
    }

    return (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="website"
            variant="outlined"
            placeholder='walmart.com'
            label="Domain owned by organisation"
            onChange={e => { setVerifyDomain(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "24px"}}
            required
        />
        <TextField
            id="organisation name"
            variant="outlined"
            placeholder='Walmart Inc.'
            label="Name of organisation (as in business register)"
            onChange={e => { setVerifyName(e.target.value) }}
            margin="normal"
            sx={{marginTop: "0px"}}
            required
        />
        <Autocomplete
            id="country"
            options={countries.countries}
            autoHighlight
            getOptionLabel={(option) => option ? option[0] : ''}
            freeSolo
            onChange={(e,newvalue)=>setCountryObject(newvalue as string[])}
            value={countryObject}
            inputValue={country}
            onInputChange={(event, newInputValue) => setCountry(newInputValue)}
            renderOption={(props, option) => (
                <Box {...props} id={option[0]} component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
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
                required
                />
            )}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="legalForm"
            options={Object.values(legalForms)}
            autoHighlight
            getOptionLabel={(option) => option}
            freeSolo
            onChange={(e,newvalue)=>setLegalFormObject(newvalue as string)}
            value={legalFormObject}
            inputValue={legalForm}
            onInputChange={(event, newInputValue) => setLegalForm(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Legal entity" required />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option} >{option}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="city"
            options={countryObject ? cities.cities.filter(l => l[2] === countryObject[4] ) : []}
            autoHighlight
            getOptionLabel={(option) => option ? option[1] : ''}
            freeSolo
            onChange={(e,newvalue)=>setCityObject(newvalue as string[]) }
            value={cityObject}
            inputValue={city}
            onInputChange={(event, newInputValue) => setCity(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Headquarter city" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[1]}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="province"
            options={countryObject ? subdivisions.filter(l =>(l[0] === countryObject[1] )) : []}
            autoHighlight
            getOptionLabel={(option) => option ? option[2] : ''}
            freeSolo
            onChange={(e,newvalue)=>setProvinceObject(newvalue as string[])}
            value={provinceObject}
            inputValue={province}
            onInputChange={(event, newInputValue) => setProvince(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Province / state" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option[0] + "_" + option[1]} >{option[2]}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="employeeCount"
            options={Object.values(employeeCounts)}
            autoHighlight
            getOptionLabel={(option) => option}
            onChange={(e,newvalue)=>setEmployeeCountObject(newvalue as string)}
            value={employeeCountObject}
            inputValue={employeeCount}
            onInputChange={(event, newInputValue) => setEmployeeCount(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Employee count" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option} >{option}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <TextField
            id="serial number"
            variant="outlined"
            placeholder={(
                countryObject?.[1] === 'DE' ? 'HRB 1234' :
                countryObject?.[1] === 'US' ? '71-0415188' : 
                '12345')}
            label={"Business register serial number" + (
                countryObject?.[1] === 'US' ? ' (IRS Employer Identification No.)' : 
                countryObject?.[1] === 'DE' ? ' (Handelsregisternummer)' :
                countryObject?.[1] === 'NL' ? ' (KVK-nummer)' :
                '')}
            onChange={e => { setSerialNumber(e.target.value) }}
            sx={{marginTop: "20px"}}
        />
        <TextField
            id="confidence"
            variant="outlined"
            placeholder='0.9'
            label="Confidence (probability of correctness 0.0 - 1.0)"
            value={confidence}
            onChange={e => { 
                const str = e.target.value.replace(/[^0-9.]/g, '')
                if(parseFloat(str) < 0) return setConfidence("0")
                if(parseFloat(str) > 1) return setConfidence("1.0")
                setConfidence(str)
            }}
            sx={{marginTop: "20px"}}
        />
        <TextField
            id="reliability"
            variant="outlined"
            placeholder='https://stated.example.com/statement/NF6irhgDU0F_HEgTRKnh'
            label="Policy containing correctness guarantees"
            onChange={e => { 
                setReliabilityPolicy(e.target.value)
            }}
            sx={{marginTop: "20px"}}
        />
        {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime}/>
        </FormControl>
    )
}

export default OrganisationVerificationForm
