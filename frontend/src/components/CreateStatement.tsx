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

import OrganisationVerificationForm from './OrganisationVerificationForm';
import PersonVerificationForm from './PersonVerificationForm';
import PollForm from './PollForm';
import DisputeStatementAuthenticityForm from './DisputeStatementAuthenticityForm';
import DisputeStatementContentForm from './DisputeStatementContentForm';
import ResponseForm from './ResponseForm';
import RatingForm from './RatingForm';
import SignPDFForm from './SignPDFForm';
import {VoteForm} from './VoteForm';
import { statementTypes } from '../statementFormats';

import { submitStatement, getTXTRecords, 
    getDomainSuggestions, getSSLOVInfo, getDNSSECInfo, getDomainVerifications, 
    checkStaticStatement } from '../api'

import StatementForm from './StatementForm';
import { BountyForm } from './BountyForm';
import { Chip, Link } from '@mui/material';
import ObservationForm from './ObservationForm';

type Props = {
    lt850px: boolean,
    domain?: string,
    statementToJoin?: StatementWithDetailsDB | StatementDB,
    statementToRespond?: StatementWithDetailsDB | StatementDB,
    statementToDisputeAuthenticity?: StatementWithDetailsDB | StatementDB,
    statementToDisputeContent?: StatementWithDetailsDB | StatementDB,
    statementToSupersede?: StatementWithDetailsDB | StatementDB,
    poll?: {statement: string, hash_b64: string},
    ratingToJoin?: Partial<RatingDB>,
    serverTime: Date,
    onPostSuccess: () => void,
}
type domainOption = {domain: string, organisation: string, department: string}
type ssl = {domain: string, O: string, issuer_o: string, sha256: string}

const CreateStatement = (props:Props) => {
    const [content, setContent] = React.useState(props.statementToJoin?.content || "");
    const [_type, setType] = React.useState(
        props.poll ? statementTypes.vote
        : (props.statementToRespond ? statementTypes.response 
            : (props.statementToDisputeAuthenticity ? statementTypes.disputeAuthenticity 
                : (props.statementToDisputeContent ? statementTypes.disputeContent 
                    : (props.statementToSupersede ? statementTypes.statement 
                        : (props.ratingToJoin ? statementTypes.rating 
                    : statementTypes.statement))))));
    const [statement, setStatement] = React.useState("");
    const [domain, setDomain] = React.useState("");
    const [OVInfo, setOVInfo] = React.useState([] as ssl[]);
    const [statedVerification, setStatedVerification] = React.useState([] as (StatementDB & OrganisationVerificationDB)[]);
    const [DNSSECInfo, setDNSSECInfo] = React.useState({domain: null, validated: null});
    const [domainIdentity, setDomainIdendity] = React.useState({});
    const [author, setAuthor] = React.useState("");
    const [tags, setTags] = React.useState([] as string[]);
    const [tagInput, setTagInput] = React.useState("")
    const [representative, setRepresentative] = React.useState("");
    const [supersededStatement, setSupersededStatement] = React.useState(props.statementToSupersede?.hash_b64?? "");
    const [showAdditionalFields, setShowAdditionalFields] = React.useState(false);
    const [apiKey, setApiKey] = React.useState("");
    const [publishingMethod, setPublishingMethod] = React.useState(undefined as (publishingMethod|undefined));
    const [dnsResponse, setDnsResponse] = React.useState([] as string[]);
    const [staticResponse, setStaticResponse] = React.useState(undefined as {validated:boolean, response?:string}|undefined);
    const [statementHash, setStatementHash] = React.useState("");
    const [alertMessage, setAlertMessage] = React.useState("");
    const [isError, setisError] = React.useState(false);

    const [domainOptions, setDomainOptions] = React.useState([] as domainOption[]);
    const [domainInputValue, setDomainInputValue] = React.useState('');

    const handleTypeChange = (t: StatementTypeValue) => {
        setType(t)
        setStatement("")
        setStatementHash("")
        setDomain("")
        setAuthor("")
        setRepresentative("")
        setTags([])
        setTagInput("")
        setPublishingMethod(undefined)
        setDnsResponse([])
        setStaticResponse(undefined)
        setAlertMessage("")
        setisError(false)
        setDNSSECInfo({domain: null, validated: null})
        setOVInfo([])
    }
    const onTagKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
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
    const onTagBlur = () => {
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
    const onTagDelete = (item:string) => () => {
        const updatedTags = [...tags]
        updatedTags.splice(updatedTags.indexOf(item), 1)
        setTags(updatedTags)
    }
    function onTagInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        setTagInput(event.target.value)
    }

    React.useEffect(()=>{
        getDomainSuggestions(domainInputValue, res  => {
            if(!res || !res.result) {return}
            const domains = res.result.map(r => ({...r, domain: r.domain.replace(/^stated\./, '').replace(/^www\./, '')}))
            const uniqueDomains = [...new Set(res.result.map(r => r.domain.replace(/^stated\./, '').replace(/^www\./, '')))].map(d => 
                domains.find(r => 
                    (r.domain === d)))
            setDomainOptions(uniqueDomains as domainOption[])
        })
    },[domainInputValue])

    React.useEffect(()=>{
        if(!domain || !domain.match(/\.[a-z]{2,18}$/i)) {
            !author && setAuthor("")
            setDNSSECInfo({domain: null, validated: null})
            setOVInfo([])
            setStatedVerification([])
            return
        }
        getSSLOVInfo(domain, res  => {
            const OVInfo = res ? (res.result || []).filter((r: PromiseSettledResult<ssl>) => 
                r.status==="fulfilled").map((r:  PromiseFulfilledResult<ssl>) => r.value) : []
            const matchingOV = OVInfo.find((r:ssl) => (r.domain === domain ||
                r.domain === 'stated.' + domain ||
                r.domain === 'www.' + domain) && r.O)
            if(matchingOV) { 
                !author && setAuthor(matchingOV.O)
                setOVInfo(OVInfo)
            }
        })
        getDNSSECInfo(domain, res  => {
            setDNSSECInfo(res)
        })
        getDomainVerifications(domain, res  => {
            let verifications = res
            verifications = verifications!.filter(v => !!v.verified_domain)
            setStatedVerification(verifications)
        })
    },[domain])


    const checkDomainVerificationAPI = () => {
        getTXTRecords("stated." + domain, res => {
            if (res && "records" in res) {
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
    const checkStaticStatementAPI = () => {
        checkStaticStatement({hash: statementHash, statement: statement, domain}, res => {
            setStaticResponse(res)
        }, e => {
            setisError(true)
            setAlertMessage("Could not retrieve text file: " + e)
        })
    }
    const submitStatementAPI = () => {
        if(statement?.length >= 1500){
            setAlertMessage("Error: Statement cannot exceed 1500 characters ")
            return setisError(true)
        }
        submitStatement({ statement, hash: statementHash, ...(apiKey ? {api_key: apiKey} : {}) },
        (res) => {
            setAlertMessage("Statement posted!")
            setisError(false)
            setStatementHash("")
            setContent("")
            props.onPostSuccess()
        }, (error) => {
            setAlertMessage("Error: could not submit statement! " + JSON.stringify(error))
            setisError(true)
        })
    }
    React.useEffect(() => {
        const el = document.getElementById('center-modal-scroll-div')
        if (el) {
            el.scrollTop = 0
        }
    }, [])
    
    const authorFields = () => (
        <>
            <TextField
                id="author"
                data-testid="author"
                variant="outlined"
                placeholder='Example Inc.'
                label="Author of the content (you/ your organisation)"
                value={author}
                onChange={e => { setAuthor(e.target.value) }}
                margin="normal"
                style={{backgroundColor: '#eeeeee', marginTop: "24px"}}
                required
            />
            <Autocomplete
                freeSolo
                disableClearable
                id="domain"
                data-testid="domain"
                isOptionEqualToValue={(option, value) => option && value && !!(option.domain && option.domain === value.domain)}
                getOptionLabel={(option) => option ? option.domain || '' : ''}
                options={domainOptions}
                onChange={(event, newInputValue: string|domainOption) => {
                    setDomainIdendity(newInputValue)
                    // @ts-ignore
                    setDomain(newInputValue?.domain)
                    // @ts-ignore
                    !author && setAuthor(newInputValue?.department ? newInputValue.department : newInputValue?.organisation)
                }}
                onInputChange={(event, newValue) => {
                    setDomainInputValue(newValue)
                    setDomain(newValue)
                }}
                renderInput={(params) => <TextField {...params} 
                  label="Your domain used for publishing/ authenticating" placeholder='example.com' />}
                style={{backgroundColor: '#eeeeee', marginTop: "16px", marginBottom: "8px"}}
            />
            { (OVInfo && OVInfo.reduce((acc, i) => acc || i.domain === domain, false)) &&
                (  OVInfo.reduce((acc, i) => acc || i.O, '') 
                ?
                OVInfo.filter(i => i.O).map((i,k) => (<Alert key={k} severity="success" style={{marginTop: "10px"}}>
                    Verified via <a target='_blank' href={"https://crt.sh/?sha256=" + i.sha256}> SSL certificate {i.domain +": "+ i.O + " by " + i.issuer_o}</a></Alert>))
                : 
                (<Alert severity="warning" style={{marginTop: "10px"}}>
                    Organisation not verified via SSL certificate.</Alert>)
                )
            }
            { (statedVerification && statedVerification.reduce((acc, i) => acc || i.verified_domain === domain, false)) &&
                (  statedVerification.reduce((acc, i) => acc || (i.verified_domain ?? ''), '') 
                ?
                [statedVerification.find(i => i.verified_domain === domain && i.name)].map((i,k) => (<Alert key={k} severity="success" style={{marginTop: "10px"}}>
                    Verified via stated verification <a target='_blank' href={window.location.origin + '/statements/' + i!.statement_hash}>
                        {i!.verified_domain +": " + (i!.department? i!.department + ' at ' : '') + i!.name + " by " + i!.verifier_domain}</a></Alert>))
                : 
                (<Alert severity="warning" style={{marginTop: "10px"}}>
                    Not verified via stated verification.</Alert>)
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
            { showAdditionalFields && (
            <TextField
                id="signing_representative"
                variant="outlined"
                placeholder="John Doe"
                label="Authorized signing representative (optional)"
                value={representative}
                onChange={e => { setRepresentative(e.target.value) }}
                margin="normal"
                style={{backgroundColor: '#eeeeee', marginTop: "16px"}}
            />
            )}
            {props.statementToSupersede && (
            <TextField
                id="superseded_statement"
                variant="outlined"
                placeholder="vX8Bhd9..."
                label="Superseded statement hash (optional)"
                value={supersededStatement}
                onChange={e => { setSupersededStatement(e.target.value) }}
                margin="normal"
                style={{backgroundColor: '#eeeeee', marginTop: "16px"}}
            />)}
            { showAdditionalFields && (
            <TextField // TODO: fix tags
                id="tags"
                variant="outlined"
                placeholder=''
                label="Tags (optional)"

                InputProps={{ 
                    startAdornment: tags.map(item => (<Chip key={item} label={item} onDelete={onTagDelete(item)} style={{marginRight: "5px"}}/>))}}
                onChange={onTagInputChange}
                onBlur={onTagBlur}
                onKeyDown={onTagKeyDown}
                value={tagInput}
                sx={{backgroundColor: '#eeeeee', marginTop: "16px", width: (props.lt850px ? "90vw" : "50vw"), maxWidth: "500px"}}
            />)
            }
            {!showAdditionalFields &&
                (<Button color="primary" onClick={()=>setShowAdditionalFields(true)} style={{marginTop: "12px"}}>
                    Show additional fields</Button>
                )
            }
            <div style={{marginTop: "24px"}}></div>
        </>
    )

    return (
        <div style={{ padding: (props.lt850px ? "3%" : "7%"), backgroundColor: "white", borderRadius: 8, display:'flex',
         flexDirection:'row', justifyContent: 'center' }}>
            <div>
            <h3 style={{marginBottom: "50px"}}>{props.statementToJoin ? "Join Statement" : "Create Statement"}</h3>

            <FormControl style={{ width: (props.lt850px ? "90vw" : "50vw"), maxWidth: "500px" }}>
                <InputLabel id="statement-type-label">Type</InputLabel>
                <Select
                    labelId="statement-type-label"
                    id="statement-type"
                    data-testid="statement-type"
                    value={_type}
                    label="Type"
                    onChange={(e)=>handleTypeChange(e.target.value as StatementTypeValue)}
                    style={{marginBottom: "16px"}}
                >
                    <MenuItem value={statementTypes.statement}>Statement</MenuItem>
                    <MenuItem value={statementTypes.signPdf}>Sign document</MenuItem>
                    <MenuItem value={statementTypes.organisationVerification} data-testid='organisation-verification'>Verify an organisation</MenuItem>
                    <MenuItem value={statementTypes.personVerification}>Verify a person</MenuItem>
                    <MenuItem value={statementTypes.rating}>Rating</MenuItem>
                    <MenuItem value={statementTypes.poll} data-testid='poll'>Poll</MenuItem>
                    <MenuItem value={statementTypes.vote} data-testid='vote'>Vote</MenuItem>
                    <MenuItem value={statementTypes.disputeAuthenticity}>Dispute statement authenticity</MenuItem>
                    <MenuItem value={statementTypes.disputeContent}>Dispute statement content</MenuItem>
                    <MenuItem value={statementTypes.response}>Response</MenuItem>
                    <MenuItem value={statementTypes.bounty}>Bounty</MenuItem>
                    <MenuItem value={statementTypes.observation}>Observation</MenuItem>
                </Select>
            {_type === statementTypes.organisationVerification &&(<OrganisationVerificationForm metaData={{domain, author, representative, tags, supersededStatement}}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod} >
                {authorFields()}</OrganisationVerificationForm>)}
            {_type === statementTypes.personVerification &&(<PersonVerificationForm metaData={{domain, author, representative, tags, supersededStatement}}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod} >
                {authorFields()}</PersonVerificationForm>)}
            {_type === statementTypes.poll &&(<PollForm metaData={{domain, author, representative, tags, supersededStatement}}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod } >
                {authorFields()}</PollForm>)}
            {_type === statementTypes.rating &&(<RatingForm metaData={{domain, author, representative, tags, supersededStatement}}
                subjectToRate={props.ratingToJoin}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod } >
                {authorFields()}</RatingForm>)}
            {_type === statementTypes.vote &&(<VoteForm poll={props.poll} metaData={{domain, author, representative, tags, supersededStatement}}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod} >
                {authorFields()}</VoteForm>)}
            {_type === statementTypes.disputeAuthenticity &&(<DisputeStatementAuthenticityForm metaData={{domain, author, representative, tags, supersededStatement}}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod}
                statementToDisputeAuthenticity={props.statementToDisputeAuthenticity}>
                {authorFields()}</DisputeStatementAuthenticityForm>)}
            {_type === statementTypes.disputeContent &&(<DisputeStatementContentForm metaData={{domain, author, representative, tags, supersededStatement}}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod}
                statementToDisputeContent={props.statementToDisputeContent}>
                {authorFields()}</DisputeStatementContentForm>)}
            {_type === statementTypes.response &&(<ResponseForm metaData={{domain, author, representative, tags, supersededStatement}}
                statementToRespond={props.statementToRespond}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod} >
                {authorFields()}</ResponseForm>)}
            {_type === statementTypes.statement &&(<StatementForm metaData={{domain, author, representative, tags, supersededStatement}} statementToJoin={props.statementToJoin}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod}>
                {authorFields()}</StatementForm>)}
            {_type === statementTypes.signPdf &&(<SignPDFForm metaData={{domain, author, representative, tags, supersededStatement}} statementToJoin={props.statementToJoin}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod}>
                {authorFields()}</SignPDFForm>)}
            {_type === statementTypes.bounty &&(<BountyForm metaData={{domain, author, representative, tags, supersededStatement}} statementToJoin={props.statementToJoin}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod}>
                {authorFields()}</BountyForm>)}
            {_type === statementTypes.observation &&(<ObservationForm metaData={{domain, author, representative, tags, supersededStatement}} statementToJoin={props.statementToJoin}
                setStatement={setStatement} setStatementHash={setStatementHash} serverTime={props.serverTime} lt850px={props.lt850px}
                setisError={setisError} setAlertMessage={setAlertMessage} setPublishingMethod={setPublishingMethod}>
                {authorFields()}</ObservationForm>)}

            {statement && (
                <div>
                    <div>Full statement:</div>
                    <div style={{backgroundColor: "#cccccc"}}>
                    <TextField
                        id="statement"
                        variant="outlined"
                        placeholder=''
                        label=""
                        multiline
                        value={statement}
                        // @ts-ignore
                        readOnly={true}
                        sx={{width: "100%", overflowX: "scroll"}}
                            />
                    </div>
                </div>)
            }
            {/*API key*/}
            {statement && publishingMethod === 'api' && (
                <React.Fragment>
                    <TextField
                        id="api-key"
                        data-testid="api-key"
                        variant="outlined"
                        placeholder='3CVAaK2c4WvcoYoYtKAoaoRGRrFrE3Sp'
                        label={"API key for " + window.location.hostname}
                        onChange={e => { setApiKey(e.target.value) }}
                        margin="normal"
                    />
                    <Button 
                        data-testid="submit-statement"
                        fullWidth variant="contained" color="success" onClick={() => { submitStatementAPI() }}
                        disabled={!apiKey}>
                        Submit</Button>
                </React.Fragment>
                )
            }
            {/*DNS*/}
            {publishingMethod === 'dns' && (statementHash.length > 0) && (
                <div style={{ paddingTop: "20px", width: "100%" }}>
                    <span >Add the following TXT record in your {domain} domain settings to verify domain ownership: </span>
                    <TextField
                        multiline
                        rows={3}
                        inputProps={{ style: { fontSize: "12pt" } }}
                        style={{ fontSize: "12px" }} 
                        fullWidth variant="outlined" margin="normal" 
                        // @ts-ignore
                        readOnly
                        id="verificationInstructions" 
                        value={"stated TXT "+statementHash} 
                        // onClick={e => e.target.select()} 
                        />
                    <Button fullWidth variant="contained" onClick={() => { checkDomainVerificationAPI() }}>Check DNS records</Button>
                </div>)
            }
            {publishingMethod === 'dns' && (dnsResponse.length > 0) && (
                <div style={{ paddingTop: "20px", width: "100%" }}>
                    {dnsResponse.includes(statementHash) ?
                        (<div>
                            <Alert severity='success' style={{marginTop: "10px", marginBottom: "10px"}}>Domain ownership verified.</Alert>
                            <Button fullWidth variant="contained" color="success" onClick={() => { submitStatementAPI() }}>Submit</Button>
                        </div>)
                        :
                        (<div>
                            <Alert severity='error' style={{marginTop: "10px", marginBottom: "10px"}}>Error: TXT records should include {statementHash}</Alert>
                            <div style={{fontSize: "8pt", marginBottom: "10px"}}> TXT record for stated.{domain} : {dnsResponse.map((r,i)=>(<div key={i}>{r}</div>))}</div>
                            <Button fullWidth variant="contained" disabled>Submit</Button>    
                        </div>)
                    }
                </div>)
            }
            {/*static*/}
            {publishingMethod === 'static' && (statementHash.length > 0) && (
                <div style={{ paddingTop: "20px", width: "100%" }}>
                    <span> Publish this <a download={statementHash+'.txt'} 
                    href={"data:application/octet-stream;charset=utf-8;base64,"+window.btoa(statement)}><Button>text file </Button></a>
                        <span>&nbsp;</span>under<span>&nbsp;</span>
                        <Link target='_blank' style={{ wordWrap: 'break-word'}} 
                        href={`https://static.stated.${domain}/statements/${statementHash}.txt`}>
                            {`https://static.stated.${domain}/statements/${statementHash}.txt`}</Link>
                        <span>&nbsp;</span>or<span>&nbsp;</span>
                        <Link target='_blank' style={{ wordWrap: 'break-word'}} 
                        href={`https://www.${domain}/.well-known/statements/${statementHash}.txt`}>
                            {`https://www.${domain}/.well-known/statements/${statementHash}.txt`}</Link>
                            <span>&nbsp;</span>to verify domain ownership.</span>
                    <p>
                        You can follow these instructions to publish the file and link it with your 'static.stated.' subdomain:
                    </p>
                        <ul>
                            <li><Link href='https://github.com/c-riq/stated/blob/master/static/netlify/README.md'>Instructions for hosting on Netlify</Link></li>
                            <li><Link href='https://github.com/c-riq/stated/blob/master/static/github-pages/README.md'>Instructions for hosting on Github Pages</Link></li>
                        </ul>
                    
                    <Button style={{marginTop: '12px'}}fullWidth variant="contained" onClick={() => {
                        checkStaticStatementAPI() }}>Check if the file can be retrieved</Button>
                </div>)
            }
            {publishingMethod === 'static' && (staticResponse) && (
                <div style={{ paddingTop: "20px", width: "100%" }}>
                    {staticResponse.validated ? (<div>
                        <Alert severity='success' style={{marginTop: "10px", marginBottom: "10px"}}>Domain ownership verified.</Alert>
                        <Button fullWidth variant="contained" color="success" onClick={() => { submitStatementAPI() }}>Submit</Button>
                    </div>)
                    :
                    (<div>
                        <Alert severity='error' style={{marginTop: "10px", marginBottom: "10px"}}>Could not retrieve statement. Response: {staticResponse.response}</Alert>
                        <Button fullWidth variant="contained" disabled>Submit</Button>    
                    </div>)}
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
                        {alertMessage.split('\n').map((t,i) => (<div key={i}>{t}</div>))}
                    </Alert>
                </Snackbar>
            </Portal>
        </div>
    )
}

export default CreateStatement
