import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import {Buffer} from 'buffer';
import { textAlign } from '@mui/system';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Portal from '@mui/material/Portal';

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';

import {countries} from '../constants/country_names_iso3166'
import {verificationMethods} from '../constants/verification_methods'

import { submitStatement, checkDomainVerification } from '../api.js'

const CreateStatement = props => {
    const { handleSubmit } = props
    const [content, setContent] = React.useState(props.statementToJoin || "");
    const [type, setType] = React.useState("statement");
    const [country, setCountry] = React.useState("");
    const [registrationAuthority, setRegistrationAuthority] = React.useState("");
    const [registrationNumber, setRegistrationNumber] = React.useState("");
    const [verificationMethod, setVerificationMethod] = React.useState("");
    const [contentHash, setContentHash] = React.useState(""); // for joining statement
    const [statement, setStatement] = React.useState("");
    const [domain, setDomain] = React.useState("");
    const [verifyDomain, setVerifyDomain] = React.useState("");
    const [verifyName, setVerifyName] = React.useState("");
    const [verifySource, setVerifySource] = React.useState("");
    const [dnsResponse, setDnsResponse] = React.useState([]);
    const [statementHash, setStatementHash] = React.useState("");
    const [addedStatementToJoin, setAddedStatementToJoin] = React.useState("");



  const [alertMessage, setAlertMessage] = React.useState("");
  const [isError, setisError] = React.useState(false);



    const digest = async (input) => {
        var enc = new TextEncoder(); // utf-8
        const buf = enc.encode(input)
        const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = Buffer.from(hashArray).toString('base64');
        return hashHex
    }


    const checkDomainVerificationAPI = () => {
        checkDomainVerification({domain: "stated."+domain}, res => {
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
        submitStatement({ domain: domain, hash: statementHash, content: content, time: props.serverTime, statement: statement,
            statement_b64: btoa(statement), content_hash: contentHash, type: type, ...(verificationMethod ? {verification_method : verificationMethod} : {}) },
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

    const generateSignature = () => {
        if(type == "statement"){
            const statement = "domain: " + domain + "\n" + "time: " + props.serverTime + "\n" + "statement: " +  content
            setStatement(statement)
            digest(statement).then((value) => {setStatementHash(value)})
            digest(content).then((valueForContent) => {setContentHash(valueForContent)})
        }
        if(type == "domain_verification"){
            const statement = "domain: " + domain + "\n" + "time: " + props.serverTime + "\n" + "type: " +  type + "\n" + "statement: " +  verificationMethod
            + "\n" + "verify organisation domain: " +  verifyDomain + "\n" + "verify organisation name: " +  verifyName
            + "\n" + "verify organisation country: " +  country + "\n" + "verify organisation registration number: " + registrationNumber
            + "\n" + "verify organisation registration authority: " +  registrationAuthority 
            + "\n" + "verify organisation source: " +  verifySource 
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
                <TextField
                    id="content"
                    variant="outlined"
                    multiline
                    rows={4}
                    placeholder='hello world'
                    label="Statement"
                    onChange={e => { setContent(e.target.value) }}
                    margin="normal"
                    // value={() => {
                    //     if (props.statementToJoin == addedStatementToJoin) {
                    //         return false
                    //     } 
                    //     setAddedStatementToJoin(props.statementToJoin) 
                    //     return statement}}
                    value={content}
                />
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
                    placeholder='google.com'
                    label="Domain to be verified"
                    onChange={e => { setVerifyDomain(e.target.value) }}
                    margin="normal"
                    sx={{marginBottom: "24px"}}
                />


                <Autocomplete
                    id="country-select-demo"
                    options={countries.countries}
                    autoHighlight
                    getOptionLabel={(option) => option[0]}
                    onChange={e=>setCountry(e.target.textContent)}
                    renderOption={(props, option) => (
                        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
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
                        label="Country"
                        inputProps={{
                            ...params.inputProps,
                            autoComplete: 'new-password', // disable autocomplete and autofill
                        }}
                        />
                    )}
                    />



                <TextField
                    id="legal entity name"
                    variant="outlined"
                    placeholder='google.com'
                    label="Full name of legal entity"
                    onChange={e => { setVerifyName(e.target.value) }}
                    margin="normal"
                    sx={{marginTop: "24px"}}
                />
                <TextField
                    id="registration number"
                    variant="outlined"
                    placeholder='1234'
                    label="Registration Number"
                    onChange={e => { setRegistrationNumber(e.target.value) }}
                    margin="normal"
                />
                <TextField
                    id="registration authority"
                    variant="outlined"
                    placeholder='Amtsgericht Berlin'
                    label="Registration Authority"
                    onChange={e => { setRegistrationAuthority(e.target.value) }}
                    margin="normal"
                    sx={{marginBottom: "24px"}}
                />

                <FormControl sx={{width: "100%"}}>
                <InputLabel id="verification-method-label">Verification Method</InputLabel>
                <Select
                        labelId="verification-method-label"
                        id="verification-method"
                        value={verificationMethod}
                        label="Verification Method"
                        onChange={(e)=>setVerificationMethod(e.target.value)}
                >
                    {verificationMethods.map((m,i) => {
                        return(<MenuItem key={i} sx={{wordBreak: "break-all", width: "500px", whiteSpace: 'normal'}} value={m.statement}>{m.statement}</MenuItem>)
                    })}
                </Select>
                </FormControl>

                <TextField
                    id="Source: Full URL or employee name"
                    variant="outlined"
                    placeholder='https://wikipedia.org'
                    label="Source: Full URL or employee name"
                    onChange={e => { setVerifySource (e.target.value) }}
                    margin="normal"
                    sx={{marginTop: "24px"}}
                />
                    </FormControl>
                )}
                <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime}</div>
                <Button variant="contained" onClick={() => generateSignature()} margin="normal"
                
                sx={{marginTop: "24px"}}>
                    Generate hash
                </Button>
                {statement && (
                    <div>
                        <div>Full statement:</div>
                        <div style={{backgroundColor: "#cccccc"}}>
                            {
                            statement.split(/\n/).map((s,i)=> (<div key={i}>{s}</div>))
                            }
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
