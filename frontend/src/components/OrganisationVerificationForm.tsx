import React from 'react';

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';

import {legalForms} from '../constants/legalForms'
import { parseStatement, buildStatement, 
    buildOrganisationVerificationContent, parseOrganisationVerification, peopleCountBuckets } from '../statementFormats'
import GenerateStatement from './GenerateStatement';
import { sha256 } from '../utils/hash';
import { generateEmail } from './generateEmail';
import { FormProps, prepareStatement } from '../types';

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
    const [department, setDepartment] = React.useState("");

    const [countries, setCountries] = React.useState([] as [string,string,string,string][])
    const [provinces, setProvinces] = React.useState([] as [string,string,string][])
    const [cities, setCities] = React.useState([] as [string,string,string][])

    React.useEffect(() => {
        fetch('/countries.json')
        .then(response => response.json())
        .then(data => {
            setCountries(data?.countries || [])
        })
        fetch('/provinces.json')
        .then(response => response.json())
        .then(data => {
            setProvinces(data?.provinces || [])
        })
        fetch('/cities.json')
        .then(response => response.json())
        .then(data => {
            setCities(data?.cities || [])
        })
    }, [])

    const prepareStatement:prepareStatement = ({method}) => {
        props.setPublishingMethod(method)
        try {
            const content = buildOrganisationVerificationContent({name: verifyName, domain: verifyDomain, city, country, province, serialNumber, legalForm,
                foreignDomain: "", confidence: parseFloat(confidence), reliabilityPolicy, pictureHash: "", employeeCount, department,
            })
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, representative: props.metaData.representative, 
                tags: props.metaData.tags, supersededStatement: props.metaData.supersededStatement, time: props.serverTime, content})

            console.log(statement)

            const parsedStatement = parseStatement({statement})
            parseOrganisationVerification(parsedStatement.content)
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

    return !(provinces.length && cities.length && countries.length) ? (<></>) : (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="website"
            data-testid="domain-to-be-verified"
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
            data-testid="organisation-name"
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
            data-testid="country"
            options={countries}
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
            data-testid="legal-form"
            options={Object.values(legalForms)}
            autoHighlight
            getOptionLabel={(option) => option}
            freeSolo
            onChange={(e,newvalue)=>setLegalFormObject(newvalue as string)}
            value={legalFormObject}
            inputValue={legalForm}
            onInputChange={(event, newInputValue) => setLegalForm(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Legal form" required />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option} >{option}</Box>)}
            sx={{marginTop: "20px"}}
        />
        {legalForm === legalForms.corporation && (
        <TextField
            id="department"
            data-testid="department"
            variant="outlined"
            placeholder='Research group X'
            label="Department (optional)"
            onChange={e => { 
                setDepartment(e.target.value)
            }}
            sx={{marginTop: "20px"}}
        />)}
        <Autocomplete
            id="city"
            data-testid="city"
            options={countryObject ? cities.filter(l => l[2] === countryObject[4] ) : []}
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
            data-testid="province"
            options={countryObject ? provinces.filter(l =>(l[0] === countryObject[1] )) : []}
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
            data-testid="employee-count"
            options={Object.values(peopleCountBuckets)}
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
            data-testid="serial-number"
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
            data-testid="confidence"
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
            data-testid="reliability"
            variant="outlined"
            placeholder='https://stated.example.com/statements/NF6irhgDU0F_HEgTRKnh'
            label="Policy containing correctness guarantees"
            onChange={e => { 
                setReliabilityPolicy(e.target.value)
            }}
            sx={{marginTop: "20px"}}
        />
        {props.children}
        <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}

export default OrganisationVerificationForm
