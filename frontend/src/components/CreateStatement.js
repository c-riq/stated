import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import {Buffer} from 'buffer';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Portal from '@mui/material/Portal';

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

import {countries} from '../constants/country_names_iso3166'
import {legalForms} from '../constants/legalForms'
import {cities} from '../constants/cities'

import { submitStatement, checkDomainVerification } from '../api.js'
const { statementRegex, forbiddenStrings, domainVerificationRegex, contentRegex } = require('../constants/statementFormats.js')

const CreateStatement = props => {
    const [content, setContent] = React.useState(props.statementToJoin || "");
    const [type, setType] = React.useState("statement");
    const [country, setCountry] = React.useState("");


    const [country2, setCountry2] = React.useState("");
    const [country3, setCountry3] = React.useState("");

    const [legalForm2, setLegalForm2] = React.useState("");
    const [legalForm3, setLegalForm3] = React.useState("");

    const [city2, setCity2] = React.useState("");
    const [city3, setCity3] = React.useState("");

    const [province, setProvince] = React.useState("");
    const [city, setCity] = React.useState("");
    const [legalForm, setLegalForm] = React.useState("");
    const [contentHash, setContentHash] = React.useState(""); // for joining statement
    const [statement, setStatement] = React.useState("");
    const [tags, setTags] = React.useState([]);
    const [domain, setDomain] = React.useState("");
    const [verifyDomain, setVerifyDomain] = React.useState("");
    const [verifyName, setVerifyName] = React.useState("");
    const [dnsResponse, setDnsResponse] = React.useState([]);
    const [statementHash, setStatementHash] = React.useState("");



  const [alertMessage, setAlertMessage] = React.useState("");
  const [isError, setisError] = React.useState(false);
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



    const digest = async (input) => {
        var enc = new TextEncoder(); // utf-8
        const buf = enc.encode(input)
        const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = Buffer.from(hashArray).toString('base64');
        return hashHex
    }


    const checkDomainVerificationAPI = () => {
        checkDomainVerification({domain: "stated." + domain}, res => {
            if ("records" in res) {
                setDnsResponse(res.records)
            } else {
                setisError(true)
                setAlertMessage("no DNS record found")
            }
        }, (e) => {
            setisError(true)
            setAlertMessage("Could not check domain")
        })
    }

    const submitStatementAPI = () => {
        submitStatement({ statement, hash_b64: statementHash},
        async (res) => {
            setAlertMessage("Statement posted!")
            setisError(false)
            setStatementHash("")
            setContent("")
            props.onPostSuccess()
        }, (error) => {
            setAlertMessage("Error: could not submit statement! " + error)
            setisError(true)
        })
    }    

    const generateHash = () => {
        console.log(country2, country3)
        if(type == "statement"){
            const statement = "domain: " + domain + "\n" + 
            "time: " + props.serverTime + "\n" + 
            (tags.length > 0 ? "tags: " + tags.join(', ') + "\n" : '') +
            "content: " +  content;

            const parsedResult = statement.match(statementRegex).groups
            if(forbiddenStrings(Object.values(parsedResult)).length > 0) {
                setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedResult)))
                setisError(true)
                return
            }

            setStatement(statement)
            digest(statement).then((value) => {setStatementHash(value)})
            digest(content).then((valueForContent) => {setContentHash(valueForContent)})
        }
        if(type == "domain_verification"){
            const statement = 
            "domain: " + domain + "\n" + 
            "time: " + props.serverTime + "\n" + 
            (tags.length > 0 ? "tags: " + tags.join(', ') + "\n" : '') +
            "content: " + "\n" + 
            "\t" + "type: domain verification" + "\n" +
            "\t" + "description: We verified the following information about an organisation." + "\n" +
            "\t" + "organisation name: " + verifyName + "\n" +
            "\t" + "headquarter country: " + country + "\n" +
            "\t" + "legal form: " + legalForm + "\n" +
            "\t" + "domain of primary website: " + verifyDomain + "\n" +
            (province ? "\t" + "headquarter province or state: " + province + "\n" : "") +
            (city ? "\t" + "headquarter city: " + city + "\n" : "") +
            ""

            const parsedStatement = statement.match(statementRegex).groups
            if(forbiddenStrings(Object.values(parsedStatement)).length > 0) {
                setAlertMessage('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(parsedStatement)))
                setisError(true)
                return
            }
            const parsedContent = parsedStatement.content.match(contentRegex).groups
            const parsedDomainVerification = parsedContent.typedContent.match(domainVerificationRegex)
            if(!parsedDomainVerification){
                setAlertMessage('Invalid domain verification (missing values)')
                setisError(true)
                return
            }
            setStatement(statement)
            digest(statement).then((value) => {setStatementHash(value)})
            digest(content).then((valueForContent) => {setContentHash(valueForContent)})
        }
    }

    return (
        <div style={{ padding: "7%", backgroundColor: "white", borderRadius: 8, display:'flex',
         flexDirection:'row', justifyContent: 'center' }}>
            <div>
            <h3 style={{marginBottom: "50px"}}>{props.statementToJoin ? "Join Statement" : "Create Statement"}</h3>

            <FormControl style={{ width: "50vw", maxWidth: "500px" }}>
                <InputLabel id="statement-type-label">Type</InputLabel>
                <Select
                        labelId="statement-type-label"
                        id="statement-type"
                        value={type}
                        label="Type"
                        onChange={(e)=>setType(e.target.value)}
                        style={{marginBottom: "16px"}}
                    >
                        <MenuItem value={"statement"}>Statement</MenuItem>
                        <MenuItem value={"domain_verification"}>Verify another domain</MenuItem>
                </Select>
            {type == "statement" &&(
                <div>
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
                    label="Tags"

                    InputProps={{ 
                        startAdornment: tags.map(item => (<Chip key={item} label={item} onDelete={handleDelete(item)} style={{marginRight: "5px"}}/>))}}
                    onChange={tagHandleInputChange}
                    onBlur={tagOnBlur}
                    onKeyDown={tagHandleKeyDown}
                    value={tagInput}
                    sx={{marginTop: "24px", width: "50vw", maxWidth: "500px"}}
                />
                </div>
            )}
                <TextField
                    id="your domain"
                    variant="outlined"
                    placeholder='google.com'
                    label="Your organisations primary domain"
                    onChange={e => { setDomain(e.target.value) }}
                    margin="normal"
                />
            {type == "domain_verification" &&(
                <FormControl sx={{width: "100%"}}>
                <TextField
                    id="domain to be verified"
                    variant="outlined"
                    placeholder='walmart.com'
                    label="Primary website domain of organisation to be verified"
                    onChange={e => { setVerifyDomain(e.target.value) }}
                    margin="normal"
                    sx={{marginBottom: "24px"}}
                />
                <TextField
                    id="organisation name"
                    variant="outlined"
                    placeholder='Walmart Inc.'
                    label="Official name of organisation"
                    onChange={e => { setVerifyName(e.target.value) }}
                    margin="normal"
                    sx={{marginTop: "0px"}}
                />
                <TextField
                    id="country"
                    variant="outlined"
                    placeholder='France'
                    label="Headquarter country"
                    onChange={e => { setCountry(e.target.value) }}
                    margin="normal"
                />
                <TextField
                    id="legalform"
                    variant="outlined"
                    placeholder='U.S. corporation'
                    label="Legal form"
                    onChange={e => { setLegalForm(e.target.value) }}
                    margin="normal"
                    sx={{marginBottom: "12px"}}
                />
                <TextField
                    id="city"
                    variant="outlined"
                    placeholder='London'
                    label="Hedquarter city"
                    onChange={e => { setCity(e.target.value) }}
                    margin="normal"
                />
                <TextField
                    id="province"
                    variant="outlined"
                    placeholder='Texas'
                    label="Headquarter province / state"
                    onChange={e => { setProvince(e.target.value) }}
                    margin="normal"
                />
                <Autocomplete
                    id="country"
                    options={countries.countries}
                    autoHighlight
                    getOptionLabel={(option) => option ? option[0] : ''}
                    freeSolo
                    onChange={(e,newvalue)=>setCountry2(newvalue)}
                    value={country2}
                    inputValue={country3}
                    onInputChange={(event, newInputValue) => setCountry3(newInputValue)}
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
                    options={legalForms.legalForms.filter(l => l[0] == country2[1] || l[0] == 'all')}
                    autoHighlight
                    getOptionLabel={(option) => option ? option[2] : ''}
                    freeSolo
                    onChange={(e,newvalue)=>setLegalForm2(newvalue)}
                    value={legalForm2}
                    inputValue={legalForm3}
                    onInputChange={(event, newInputValue) => setLegalForm3(newInputValue)}
                    renderInput={(params) => <TextField {...params} label="Legal Form" />}
                    sx={{marginTop: "20px"}}
                />
                <Autocomplete
                    id="city"
                    options={cities.cities.filter(l => l[2] == country2[4] )}
                    autoHighlight
                    getOptionLabel={(option) => option ? option[1] : ''}
                    freeSolo
                    onChange={(e,newvalue)=>setCity2(newvalue)}
                    value={city2}
                    inputValue={city3}
                    onInputChange={(event, newInputValue) => setCity3(newInputValue)}
                    renderInput={(params) => <TextField {...params} label="Headquarter city" />}
                    sx={{marginTop: "20px"}}
                />
                </FormControl>
                )}
                <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime}</div>
                <Button variant="contained" onClick={() => generateHash()} margin="normal"
                
                sx={{marginTop: "24px"}}>
                    Generate hash
                </Button>
                {statement && (
                    <div>
                        <div>Full statement:</div>
                        <div style={{backgroundColor: "#cccccc"}}>
                            
                <TextField
                    id="tags"
                    variant="outlined"
                    placeholder=''
                    label=""
                    multiline
                    value={statement}
                    readOnly
                    sx={{width: "100%"}}
                        />
                        </div>
                    </div>)
                }
                {(statementHash.length > 0) && (
                    <div width="100%" style={{ paddingTop: "20px" }}>
                        <span >Add the following TXT record in your {domain} domain settings to verify domain ownership: </span>
                        <TextField
                            multiline
                            rows={3}
                            inputProps={{ style: { fontSize: "12pt" } }}
                            style={{ fontSize: "12px" }} 
                            fullWidth variant="outlined" margin="normal" 
                            readOnly id="verificationInstructions" 
                            value={"stated TXT "+statementHash} 
                            // onClick={e => e.target.select()} 
                            />
                        <Button fullWidth variant="contained" 
                            margin="normal" onClick={() => { checkDomainVerificationAPI() }}>Check DNS records</Button>
                    </div>)
                }
                {(dnsResponse.length > 0) && (
                    <div width="100%" style={{ paddingTop: "20px" }}>
                        <span > TXT record for stated.{domain} : {dnsResponse.map((r,i)=>(<div key={i}>{r}</div>))}</span>
                        {dnsResponse.includes(statementHash) ?
                            (<div>
                                <div style={{backgroundColor: "#aaffaa"}}>Domain ownership verified.</div>
                                <Button fullWidth variant="contained" margin="normal" color="success" onClick={() => { submitStatementAPI() }}>Post</Button>
                            </div>)
                            :
                            (<div>
                                <div style={{backgroundColor: "#ffaaaa"}}>Error: TXT records should include {statementHash}</div>
                                <Button fullWidth variant="contained" margin="normal" disabled>Post</Button>    
                            </div>)
                        }
                    </div>)
                }
            </FormControl>
            </div>
            <Portal>
                <Snackbar open={alertMessage !== undefined && alertMessage.length > 0} autoHideDuration={6000} onClose={() => {setAlertMessage('')}}
                sx={{position: "absolute", top: "0px"}}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "center"
                }}>
                    <Alert onClose={() => {setAlertMessage('')}} severity={isError ? "error" : "success"} sx={{ width: '100%' }}>
                        {alertMessage}
                    </Alert>
                </Snackbar>
            </Portal>
        </div>
    )
}


export default CreateStatement
