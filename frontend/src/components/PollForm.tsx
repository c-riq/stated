import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment'


import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';

import {legalForms} from '../constants/legalForms'
import PublishStatement from './PublishStatement'
import { sha256 } from '../utils/hash'

import { parseStatement, parsePoll, buildPollContent, buildStatement } from '../statementFormats'
import { generateEmail } from './generateEmail';
import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { FormProps, prepareStatement } from '../types';

const PollForm = (props:FormProps) => {
    const [showOptionalFields, setShowOptionalFields] = React.useState(false);
    const province = ''
    const [scopeDescription, setScopeDescription] = React.useState("");
    const [scopeQueryLink, setScopeQueryLink] = React.useState("");
    const [country, setCountry] = React.useState("");
    const [countryObject, setCountryObject] = React.useState(undefined as string[]|undefined);
    const [legalForm, setLegalForm] = React.useState("");
    const [legalFormObject, setLegalFormObject] = React.useState("");
    const [city, setCity] = React.useState("");
    const [cityObject, setCityObject] = React.useState(undefined as string[]|undefined);
    const [options, setOptions] = React.useState(['','']);
    const [domainScopeConcat, setDomainScopeConcat] = React.useState("");
    const [nodes, setNodes] = React.useState("");
    const [votingDeadline, setVotingDeadline] = React.useState(moment().add(14,'days'));
    const [poll, setPoll] = React.useState("");
    const [countries, setCountries] = React.useState([] as [string, string, string ,string][])
    const [cities, setCities] = React.useState([] as [string, string ,string][])
    const [allowArbitraryVote, setAllowArbitraryVote] = React.useState(undefined as boolean|undefined);
    const [requiredProperty, setRequiredProperty] = React.useState("");
    const [requiredPropertyValue, setRequiredPropertyValue] = React.useState("");
    const [requiredPropertyObserver, setRequiredPropertyObserver] = React.useState("");

    React.useEffect(() => {
        fetch('/countries.json')
        .then(response => response.json())
        .then(data => {
            setCountries(data?.countries || [])
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
            let domainScope = domainScopeConcat ? domainScopeConcat.split(',').map(s => s.trim()) : undefined
            const content = buildPollContent({country, city, legalEntity: legalForm, domainScope, 
                judges: nodes, deadline: votingDeadline.toDate(), poll, options, scopeDescription, scopeQueryLink,
                allowArbitraryVote, requiredProperty, requiredPropertyValue, requiredPropertyObserver})
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, representative: props.metaData.representative, tags: props.metaData.tags, supersededStatement: props.metaData.supersededStatement, time: new Date(props.serverTime), content})
            const parsedStatement = parseStatement({statement})
            parsePoll(parsedStatement.content)
            props.setStatement(statement)
            sha256(statement).then((hash) => { props.setStatementHash(hash)         
                if(method === 'represent'){
                    generateEmail({statement, hash})
                }
            });
        } catch (e) {
            props.setAlertMessage('' + e)
            props.setisError(true)
            return
        }
    }

    return !(cities.length && countries.length) ? (<></>) : (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="poll"
            data-testid="poll-content"
            variant="outlined"
            placeholder='What should ...'
            label="Poll"
            onChange={e => { setPoll(e.target.value) }}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        <TextField
            id="option1"
            data-testid="option1"
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
            data-testid="option2"
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
        {showOptionalFields && (<>
        
        <TextField
            id="option3"
            variant="outlined"
            placeholder=''
            label="Option 3"
            onChange={e => { 
                let optionsNew = [...options]
                optionsNew[2] = e.target.value
                setOptions(optionsNew) }}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        
        <TextField
            id="option4"
            variant="outlined"
            placeholder=''
            label="Option 4"
            onChange={e => { 
                let optionsNew = [...options]
                optionsNew[3] = e.target.value
                setOptions(optionsNew) }}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        
        <TextField
            id="option5"
            variant="outlined"
            placeholder=''
            label="Option 5"
            onChange={e => { 
                let optionsNew = [...options]
                optionsNew[4] = e.target.value
                setOptions(optionsNew) }}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        </>)}
        <FormControlLabel
            control={<Checkbox checked={allowArbitraryVote} onChange={(event) => {
                setAllowArbitraryVote(event.target.checked);
            }} />}
            label="Allow free text vote"
        />
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateTimePicker
            label="deadline"
            value={votingDeadline}
            onChange={(v) => setVotingDeadline(v as moment.Moment)}
            renderInput={(params) => <TextField {...params} style={{marginTop: '24px'}} />}
            />
        </LocalizationProvider>
        {showOptionalFields ? (<>
        <TextField
            id="who can vote"
            variant="outlined"
            placeholder='All members of association XYZ'
            label="Description whose votes will be considered (optional)"
            onChange={e => { setScopeDescription(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "12px", marginTop: "24px"}}
        />
        <TextField
            id="scope query link"
            variant="outlined"
            placeholder='https://stated.rixdata.net/?search_query=%09Observed%20property:%20ROR%20ID%0A%09&domain=localhost&author=_Rix%20Data%20NL%20B.V.'
            label="Link to vote scope query (optional)"
            onChange={e => { setScopeQueryLink(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "12px", marginTop: "24px"}}
        />
        <TextField
            id="poll judges"
            variant="outlined"
            placeholder='rixdata.net'
            label="Poll judging domains, comma separated (optional)"
            onChange={e => { setNodes(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "12px", marginTop: "24px"}}
        />
        <TextField
            id="Required property"
            variant="outlined"
            placeholder='Member of SP500'
            label="Property which pariticpants must have been associated in an observation statement (optional)"
            onChange={e => { setRequiredProperty(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "12px", marginTop: "24px"}}
        />
        {/* <TextField
            id="Required property"
            variant="outlined"
            placeholder='12345 (Membership ID) / YES / NO...'
            label="Property value, which pariticpants must have been associated in an observation statement (optional)"
            onChange={e => { setRequiredPropertyValue(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "12px", marginTop: "24px"}}
        /> */}
        <TextField
            id="Required property observer"
            variant="outlined"
            placeholder='Rix Data NL B.V.@rixdata.net'
            label="Entity which must have observed the above property (value) (optional)"
            onChange={e => { setRequiredPropertyObserver(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "12px", marginTop: "24px"}}
        />
        <TextField
            id="domain scope"
            variant="outlined"
            placeholder='mit.edu, gov.cn'
            label="Participating domains, comma separated (optional)"
            onChange={e => { setDomainScopeConcat(e.target.value) }}
            margin="normal"
            sx={{marginBottom: "12px", marginTop: "24px"}}
        />
        <Autocomplete
            id="country"
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
                label="Voting country (optional)"
                />
            )}
            sx={{marginTop: "12px"}}
        />
        <Autocomplete
            id="city"
            options={countryObject ? cities.filter(l => l[2] === countryObject[4] ) : []}
            autoHighlight
            getOptionLabel={(option) => option ? option[1] : ''}
            freeSolo
            onChange={(e,newvalue)=>setCityObject(newvalue as string[])}
            value={cityObject}
            inputValue={city}
            onInputChange={(event, newInputValue) => setCity(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Voting city (optional)" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option[0]} >{option[1]}</Box>)}
            sx={{marginTop: "20px"}}
        />
        <Autocomplete
            id="legalForm"
            options={Object.values(legalForms)}
            autoHighlight
            getOptionLabel={option => option}
            freeSolo
            onChange={(e,newvalue)=>setLegalFormObject(newvalue as string)}
            value={legalFormObject}
            inputValue={legalForm}
            onInputChange={(event, newInputValue) => setLegalForm(newInputValue)}
            renderInput={(params) => <TextField {...params} label="Voting legal entities (optional)" />}
            // @ts-ignore
            renderOption={(props, option) => (<Box {...props} id={option} >{option}</Box>)}
            sx={{marginTop: "20px", marginBottom: "20px"}}
        />
        </>) :
        <Button onClick={() => setShowOptionalFields(true)}>Show optional fields</Button>
        }
        {props.children}
        <PublishStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}

export default PollForm
