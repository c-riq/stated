import React from 'react'
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { Link as RouterLink, useParams, useLocation } from 'react-router-dom';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import IconButton from '@mui/material/IconButton';

import { getStatement, getJoiningStatements, getOrganisationVerifications, getDomainVerifications,
    getPersonVerifications, getVotes } from '../api'
import { statementTypes, parsePDFSigning } from '../statementFormats';

import {VerificationGraph} from './VerificationGraph'

import {filePath, getWorkingFileURL} from './SignPDFForm'


const Statement = props => {
    const [joiningStatements, setJoiningStatements] = React.useState([]);
    const [votes, setVotes] = React.useState([]);
    const [statement, setStatement] = React.useState({statement: undefined, 
        type: undefined, domain: undefined, 
        hash_b64: undefined, content: undefined});
    const [organisationVerifications, setOrganisationVerifications] = React.useState([]);
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [personVerifications, setPersonVerifications] = React.useState([]);
    const [dataFetched, setDataFetched] = React.useState(false);
    const [workingFileURL, setWorkingFileURL] = React.useState('');

    const hash_b64 = useParams().statementId || '';


    React.useEffect(() => { if(!dataFetched) {
        getStatement(hash_b64, s => setStatement(s))
        getJoiningStatements(hash_b64, s => setJoiningStatements(s))
        getVotes(hash_b64, v => setVotes(v))
        getOrganisationVerifications(hash_b64, v => setOrganisationVerifications(v))
        getPersonVerifications(hash_b64, v => setPersonVerifications(v))
        setDataFetched(true)
      }
    })
    let location = useLocation()
    React.useEffect(() => {
        setDataFetched(false)
    }, [location])
    React.useEffect(() => {
        if (statement && statement.type === statementTypes.signPdf){
            getWorkingFileURL({hash: parsePDFSigning(statement.content).hash_b64, host: 'https://stated.' + statement.domain}).then(setWorkingFileURL)
        }
    }, [statement])

    let fileURL = ""
    if (statement && (statement.type === statementTypes.signPdf)) {
        const parsedSigning = parsePDFSigning(statement.content)
        fileURL = filePath({hash: parsedSigning.hash_b64, host: null})
    }

    console.log('verifications',organisationVerifications, personVerifications)
    if (!statement) return (<div style={{marginTop: "20px"}}>Statement not found</div>)
    return (
        <div style={{ maxWidth: "90vw", width: "100%", backgroundColor: "rgba(255,255,255,1)", borderRadius: 8, display:'flex',
         flexDirection:'row', justifyContent: 'center', overflow: 'hidden' }}>
            <div>
            <h3>Statement details</h3>
            <p>Raw statement</p>
            <TextareaAutosize style={{width:"100%", height:((''+statement?.statement).match(/\n/g) ? 
            (40 + ((''+statement?.statement).match(/\n/g)?.length || 0) * 18) + 'px' : "250px"), 
                overflow: "scroll", fontFamily:"Helvetica", fontSize: "15px"}} value={statement?.statement} />
            {statement.type === statementTypes.signPdf && (
                <div style={{border: "1px solid rgba(0,0,0,0.1)",
                minWidth: !props.lt850px ? "50vw": "70vw", minHeight: !props.lt850px ? "50vh": "70vw"}}>
                    {workingFileURL ? ( 
                    <embed
                    src={workingFileURL}
                    style={{minWidth: !props.lt850px ? "50vw": "70vw", minHeight: !props.lt850px ? "50vh": "70vw"}}
                    height="300px"
                    type="application/pdf"
                    />) : (
                    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                        <p>File not found</p>
                    </div>
                    )}
                </div>
            )}
            {statement && (statement.type === statementTypes.poll && (<RouterLink to="/create-statement">
                <Button onClick={()=>{props.voteOnPoll(statement)}} variant='contained' 
                sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                    Vote
                </Button>
            </RouterLink>))}
            <VerificationGraph organisationVerifications={organisationVerifications} personVerifications={personVerifications} statement={statement} lt850px={props.lt850px}/>
        <Card style={{
                width: "100%",
                minWidth: !props.lt850px ? "50vw": "70vw",
                border: "1px solid rgba(0,0,0,0.1)",
            }}>
        <CardHeader
                    title="Verify the statement's authenticity"
                    style={{fontSize: "14px"}}
                    action={
                        <IconButton
                            onClick={() => setDetailsOpen(!detailsOpen)}
                            aria-label="expand"
                            size="small"
                        >
                            {detailsOpen ? <KeyboardArrowUpIcon />
                                : <KeyboardArrowDownIcon />}
                        </IconButton>
                    }
            ></CardHeader>
            <Collapse in={detailsOpen} timeout="auto" unmountOnExit style={{padding: "20px"}}>
                <p>A statements authenticity should be independently verifiable by following the steps below.</p>
                <h4>1. Check the domain owners intention to publish the statement</h4>
                <p>There are 2 supported methods for this: via a running stated server application on the authors website domain (1.1) and via DNS TXT entries of the authors domain (1.2).</p>
                <h4>1.1 Via the domain owners website</h4>
                <p>Check if the domain owner also published the domain under this URL: <Link href={`https://stated.${statement.domain}/statement/${statement.hash_b64}`}>
                    {`https://stated.${statement.domain}/statement/${statement.hash_b64}`}</Link> or as part of a text file under this URL: <br />
                    <Link href={`https://stated.${statement.domain}/statements.txt`}>{`https://stated.${statement.domain}/statements.txt`}</Link></p>
                <h4>1.2 Via the domain DNS records</h4>
                <h4>1.2.1 Generate the statement hash</h4>
                <p>The SHA256 hash (in URL compatible base 64 representation) is a transformed version of the above statement text. 
                    Due to its limited length and limited set of characters it can be more easily stored and shared than the full text of the statement. 
                    Running the following command in the mac terminal allows you to independently verify that the statement generates this hash:</p>
                <div>
                    <TextareaAutosize style={{width:"100%", fontSize: "15px", fontFamily:"Helvetica"}} value={"echo -n \""+ statement.statement +"\"| openssl sha256 -binary | base64 | tr -d '=' | tr '/+' '_-' "} />
                </div>
                <h4>1.2.2 via DNS records </h4>
                <p>Only the owner of a website domain should be able change the DNS records. If the hash representing the statement was added there, 
                    this implies that the domain owner is also the author of the statement. Running the following command in the mac terminal 
                    allows you to verify that the statement hash <span style={{backgroundColor:"#cccccc"}}>{statement.hash_b64}</span> is published in the domain's DNS records:</p>
                <div>
                    <TextareaAutosize style={{width:"100%", fontSize: "15px", fontFamily:"Helvetica"}} value={"delv @1.1.1.1 TXT stated."+statement.domain+" +short +trust"}/>
                </div>
                <p>DNS responses are only secure if they are DNSSEC validated, which is indicated by <span style={{backgroundColor:"#cccccc"}}>; fully validated</span> at the beginnig of the output of the delv command.
                    You can also inspect the DNSSEC verification chain here: <Link href={`https://dnsviz.net/d/stated.${statement.domain}/dnssec/`}>{`https://dnsviz.net/d/stated.${statement.domain}/dnssec/`}</Link></p>
                
                <h4>2. Check who owns the domain</h4>
                <p>Inspect the steps in the verification graph. By clicking on the arrows you can view the details at each step. The graph includes: </p>
                <ul>
                    <li>Verifications within the stated network, where an organisation associates another organisation or persons with a domains</li>
                    <li>SSL Organisation Validation certificates issued by audited Certificate Authorities. (These certificates are also used for establishing secure connections via HTTPS)</li>
                </ul>
                <p></p>
            </Collapse>
            </Card>

            
            {joiningStatements.length > 0 && statement?.type && 
                [statementTypes.statement, statementTypes.signPdf, statementTypes.personVerification, 
                    statementTypes.organisationVerification].includes(statement.type) && 
            (<div><h3>Organisations that joined the statemet</h3>
                {joiningStatements.map(({domain, proclaimed_publication_time, name, hash_b64},i)=>(
                    <div key={i}>
                        <RouterLink key={i} onClick={()=>setDataFetched(false)} to={"/statement/"+hash_b64}>
                            {domain + " | " + (new Date(proclaimed_publication_time).toUTCString())}{name ? " | " + name + " ✅":  ""}
                        </RouterLink>
                    </div>
                    )
                )}
            </div>
            )}

            
            {votes.length > 0 && (<div><h3>Qualified votes</h3>
                {votes.map(({proclaimed_publication_time, domain, option, hash_b64, name},i)=>(
                    <div key={i}>
                        <RouterLink key={i} onClick={()=>setDataFetched(false)} to={"/statement/"+hash_b64}>
                            {option + " | " + domain + " | " + (new Date(parseInt(proclaimed_publication_time)).toUTCString())}{name ? " | " + name + " ✅":  ""}
                        </RouterLink>
                    </div>
                    )
                )}
            </div>
            )}
            </div>
        </div>
        
    )
}


export default Statement

