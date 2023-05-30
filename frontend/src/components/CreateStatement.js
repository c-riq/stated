import React from 'react'

import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Portal from '@mui/material/Portal';

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';

import Autocomplete from '@mui/material/Autocomplete';

import OrganisationVerificationForm from './OrganisationVerificationForm.js';
import PersonVerificationForm from './PersonVerificationForm.js';
import PollForm from './PollForm.js';
import DisputeStatementForm from './DisputeStatementForm.js';
import RatingForm from './RatingForm.js';
import SignPDFForm from './SignPDFForm.js';
import {VoteForm} from './VoteForm.js';

import { submitStatement, checkDomainVerification, 
    getDomainSuggestions, getSSLOVInfo, getDNSSECInfo } from '../api.js'

import StatementForm from './StatementForm.js';

const CreateStatement = props => {
    const [content, setContent] = React.useState(props.statementToJoin?.content || "");
    const [type, setType] = React.useState(props.poll ? "vote" : (props.statementToJoin?.type ? props.statementToJoin?.type : "statement"));
    const [statement, setStatement] = React.useState("");
    const [domain, setDomain] = React.useState("");
    const [OVInfo, setOVInfo] = React.useState([{domain: null, O: null}]);
    const [DNSSECInfo, setDNSSECInfo] = React.useState({domain: null, validated: null});
    const [domainIdentity, setDomainIdendity] = React.useState({});
    const [author, setAuthor] = React.useState("");
    const [apiKey, setApiKey] = React.useState("");
    const [viaAPI, setViaAPI] = React.useState("");
    const [dnsResponse, setDnsResponse] = React.useState([]);
    const [statementHash, setStatementHash] = React.useState("");
    const [alertMessage, setAlertMessage] = React.useState("");
    const [isError, setisError] = React.useState(false);

    const [domainOptions, setDomainOptions] = React.useState([{domain: null, organization: null}]);
    const [domainInputValue, setDomainInputValue] = React.useState('');

    React.useEffect(()=>{
        getDomainSuggestions(domainInputValue, res  => {
            if(!res || !res.result) {return}
            const domains = res.result.map(r => ({...r, domain: r.domain.replace(/^stated\./, '').replace(/^www\./, '')}))
            setDomainOptions(domains)
        })
    },[domainInputValue])

    React.useEffect(()=>{
        getSSLOVInfo(domain, res  => {
            const OVInfo = res ? (res.result || []).filter(r => 
                r.status==="fulfilled").map(r => r.value) : []
            const matchingOV = OVInfo.find(r => (r.domain === domain ||
                r.domain === 'stated.' + domain ||
                r.domain === 'www.' + domain) && r.O)
            if(matchingOV) { 
                console.log(matchingOV, matchingOV.O)
                setAuthor(matchingOV.O)
                setOVInfo(OVInfo)
            }
        })
        getDNSSECInfo(domain, res  => {
            setDNSSECInfo(res)
        })
    },[domain])


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
        submitStatement({ statement, hash_b64: statementHash, ...(apiKey ? {api_key: apiKey} : {}) },
        (res) => {
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
    
    const authorFields = () => (
        <React.Fragment>
            <Autocomplete
                freeSolo
                disableClearable
                id="domain"
                isOptionEqualToValue={(option, value) => !!(option.domain && option.domain === value.domain)}
                getOptionLabel={(option) => option ? option.domain || '' : ''}
                options={domainOptions}
                onChange={(event, newInputValue) => {
                    setDomainIdendity(newInputValue)
                    setDomain(newInputValue.domain)
                    setAuthor(newInputValue.organization)
                }}
                onInputChange={(event, newValue) => {
                    setDomainInputValue(newValue)
                    setDomain(newValue)
                }}
                renderInput={(params) => <TextField {...params} 
                  label="Your domain used for publishing/ authenticating" placeholder='google.com' />}
                style={{backgroundColor: '#eeeeee', marginTop: "24px"}}
                />
                { (OVInfo && OVInfo.reduce((acc, i) => acc || i.domain === domain, false)) &&
                     (  OVInfo.reduce((acc, i) => acc || i.O, false) 
                        ?
                        OVInfo.filter(i => i.O).map((i,k) => (<Alert key={k} severity="success" style={{marginTop: "10px"}}>
                            Verified via SSL certificate {i.domain +": "+ i.O}</Alert>))
                        : 
                        (<Alert severity="warning" style={{marginTop: "10px"}}>
                            Organisation not verified via SSL certificate.</Alert>)
                     )
                }
                { (DNSSECInfo && DNSSECInfo.domain === domain) &&
                     (  DNSSECInfo.validated
                        ? (<Alert severity="success" style={{marginTop: "10px"}}>
                            DNSSEC enabled for {DNSSECInfo.domain}</Alert>)
                        : (<Alert severity="warning" style={{marginTop: "10px"}}>
                            DNSSEC not enabled for {DNSSECInfo.domain}</Alert>)
                     )
                }
            <TextField
                id="author"
                variant="outlined"
                placeholder='Example Inc.'
                label="Author of the content (you/ your organisation)"
                value={author}
                onChange={e => { setAuthor(e.target.value) }}
                margin="normal"
                style={{backgroundColor: '#eeeeee'}}
            />
        </React.Fragment>
    )
    console.log(OVInfo, "OVInfo")

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
                    <MenuItem value={"sign_pdf"}>Sign PDF</MenuItem>
                    <MenuItem value={"organisation_verification"}>Verify an organisation</MenuItem>
                    <MenuItem value={"person_verification"}>Verify a person</MenuItem>
                    <MenuItem value={"rating"}>Rating</MenuItem>
                    <MenuItem value={"poll"}>Poll</MenuItem>
                    <MenuItem value={"vote"}>Vote</MenuItem>
                    <MenuItem value={"dispute_statement"}>Dispute statement</MenuItem>
                </Select>
            {type === "organisation_verification" &&(<OrganisationVerificationForm domain={domain} author={author}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime}
                setisError={setisError} setAlertMessage={setAlertMessage} setViaAPI={setViaAPI} >
                {authorFields()}</OrganisationVerificationForm>)}
            {type === "person_verification" &&(<PersonVerificationForm domain={domain} author={author}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime}
                setisError={setisError} setAlertMessage={setAlertMessage} setViaAPI={setViaAPI} >
                {authorFields()}</PersonVerificationForm>)}
            {type === "poll" &&(<PollForm domain={domain} author={author}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime}
                setisError={setisError} setAlertMessage={setAlertMessage} setViaAPI={setViaAPI } >
                {authorFields()}</PollForm>)}
            {type === "rating" &&(<RatingForm domain={domain} author={author}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime}
                setisError={setisError} setAlertMessage={setAlertMessage} setViaAPI={setViaAPI } >
                {authorFields()}</RatingForm>)}
            {type === "vote" &&(<VoteForm domain={domain} poll={props.poll} author={author}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime}
                setisError={setisError} setAlertMessage={setAlertMessage} setViaAPI={setViaAPI} >
                {authorFields()}</VoteForm>)}
            {type === "dispute_statement" &&(<DisputeStatementForm domain={domain} author={author}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime}
                setisError={setisError} setAlertMessage={setAlertMessage} setViaAPI={setViaAPI} >
                {authorFields()}</DisputeStatementForm>)}
            {type === "statement" &&(<StatementForm domain={domain} author={author} statementToJoin={props.statementToJoin}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime}
                setisError={setisError} setAlertMessage={setAlertMessage} setViaAPI={setViaAPI}>
                {authorFields()}</StatementForm>)}
            {type === "sign_pdf" &&(<SignPDFForm domain={domain} author={author} statementToJoin={props.statementToJoin}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime}
                setisError={setisError} setAlertMessage={setAlertMessage} setViaAPI={setViaAPI}>
                {authorFields()}</SignPDFForm>)}

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
                        readOnly={true}
                        sx={{width: "100%", overflowX: "scroll"}}
                            />
                    </div>
                </div>)
            }
            {statement && viaAPI && (
                <React.Fragment>
                    <TextField
                        id="api-key"
                        variant="outlined"
                        placeholder='3CVAaK2c4WvcoYoYtKAoaoRGRrFrE3Sp'
                        label={"API key for " + window.location.hostname}
                        onChange={e => { setApiKey(e.target.value) }}
                        margin="normal"
                    />
                    <Button fullWidth variant="contained" margin="normal" color="success" onClick={() => { submitStatementAPI() }}
                    disabled={!apiKey}>
                        Submit</Button>
                </React.Fragment>
                )
            }
            {!viaAPI && (statementHash.length > 0) && (
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
                {!viaAPI && (dnsResponse.length > 0) && (
                    <div width="100%" style={{ paddingTop: "20px" }}>
                        {dnsResponse.includes(statementHash) ?
                            (<div>
                                <Alert severity='success' style={{marginTop: "10px", marginBottom: "10px"}}>Domain ownership verified.</Alert>
                                <Button fullWidth variant="contained" margin="normal" color="success" onClick={() => { submitStatementAPI() }}>Submit</Button>
                            </div>)
                            :
                            (<div>
                                <Alert severity='error' style={{marginTop: "10px", marginBottom: "10px"}}>Error: TXT records should include {statementHash}</Alert>
                                <div style={{fontSize: "8pt", marginBottom: "10px"}}> TXT record for stated.{domain} : {dnsResponse.map((r,i)=>(<div key={i}>{r}</div>))}</div>
                                <Button fullWidth variant="contained" margin="normal" disabled>Submit</Button>    
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
