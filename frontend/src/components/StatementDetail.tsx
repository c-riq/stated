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
import Alert from '@mui/material/Alert';
import ReplyIcon from '@mui/icons-material/Reply';
import PlusOneIcon from '@mui/icons-material/PlusOne';
import ReportIcon from '@mui/icons-material/Report';
import Tooltip from '@mui/material/Tooltip';
import DangerousIcon from '@mui/icons-material/Dangerous';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { getStatement, getJoiningStatements, getOrganisationVerifications,
    getPersonVerifications, getVotes, getResponses, getDisputes, getAggregatedRatings } from '../api'
import { statementTypes, parsePDFSigning, parseStatement,
    parseObservation, parseBounty, parseRating, parseDisputeAuthenticity, parseDisputeContent, parseBoycott,
    parseOrganisationVerification, parsePersonVerification, parsePoll, parseVote, parseResponseContent } from '../statementFormats';

import { VerificationGraph } from './VerificationGraph'

import { getWorkingFileURL } from './SignPDFForm'
import { DecryptedContent } from './DecryptedContent';
import VerificationLogGraph from './VerificationLogGraph';
import { ConfirmActionWithApiKey } from './ConfirmActionWithApiKey';
import { Chip } from '@mui/material';
import { CompactStatementSmall, Dispute, Response } from './CompactStatement';
import { CompactRating } from './CompactRating';

type props = {
    lt850px: boolean,
    voteOnPoll: (arg0:{statement: string, hash_b64: string}) => void,
    rateSubject: (arg0: Partial<RatingDB>) => void,
    setStatementToJoin: (arg0: StatementWithDetailsDB | StatementDB) => void,
    respondToStatement: (arg0: StatementWithDetailsDB | StatementDB) => void,
    disputeStatementAuthenticity: (arg0: StatementWithDetailsDB | StatementDB) => void,
    disputeStatementContent: (arg0: StatementWithDetailsDB | StatementDB) => void,
    supersedeStatement: (arg0:{statement: StatementWithDetailsDB | StatementDB, pollOfVote: StatementDB | undefined }) => void,
}

const StatementDetail = (props:props) => {
    const [joiningStatements, setJoiningStatements] = React.useState(undefined as undefined | (StatementDB & {name: string})[]);
    const [votes, setVotes] = React.useState([] as (VoteDB & StatementWithSupersedingDB)[]);
    const [responses, setResponses] = React.useState([] as StatementDB[]);
    const [disputes, setDisputes] = React.useState([] as StatementDB[]);
    const [pollOfVote, setPollOfVote] = React.useState(undefined as undefined | StatementWithSupersedingDB);
    const [statement, setStatement] = React.useState(undefined as StatementWithSupersedingDB | StatementWithHiddenDB | undefined );
    const [parsedStatement, setParsedStatement] = React.useState(undefined as undefined | Observation | 
        Bounty | Rating | PDFSigning | DisputeAuthenticity | DisputeContent | Boycott | OrganisationVerification 
        | PersonVerification | Vote | Poll );
    const [statementCollision, setStatementCollision] = React.useState(undefined as StatementDB[] | undefined );
    const [organisationVerifications, setOrganisationVerifications] = React.useState([] as OrganisationVerificationDB[]);
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [personVerifications, setPersonVerifications] = React.useState([] as PersonVerificationDB[]);
    const [dataFetched, setDataFetched] = React.useState(false);
    const [workingFileURL, setWorkingFileURL] = React.useState('');
    const [ratings, setRatings] = React.useState([] as AggregatedRatingDB[]);

    const hashInURL = useParams().statementId || ''
    const [hash, setHash] = React.useState(hashInURL)
    const {search} = useLocation()
    const queryParams = new URLSearchParams(search)
    const key = queryParams.get('key')
    const algorithm = queryParams.get('algorithm')

    const clearState = () => {
        setVotes([])
        setJoiningStatements([])
        setDisputes([])
        setStatement(undefined)
        setParsedStatement(undefined)
        setWorkingFileURL('')
        setStatementCollision(undefined)
        setOrganisationVerifications([])
        setPersonVerifications([])
        setResponses([])
    }

    React.useEffect(() => {
        if (hashInURL !== hash) {
            clearState()
            setHash(hashInURL)
            setDataFetched(false)
        }
    }, [hash, hashInURL])

    React.useEffect(() => { if(!dataFetched) {
        getStatement(hash, s => {
            if((s?.length || 0) > 1) {
                setStatementCollision(s)
                setStatement(undefined)
                return
            } 
            if ((s?.length || 0) === 1) {
                setStatement(s![0])
                setStatementCollision(undefined)
                if (hash !== s![0].hash_b64) {
                    setHash(s![0].hash_b64)
                    setDataFetched(false)
                }
                try {
                    const {type, content} = parseStatement({statement: s![0].statement, allowNoVersion: true})
                    if (type === statementTypes.signPdf) {
                        setParsedStatement(parsePDFSigning(content))
                    } if (type === statementTypes.observation) {
                        setParsedStatement(parseObservation(content) as Observation)
                    } if (type === statementTypes.bounty) {
                        setParsedStatement(parseBounty(content) as Bounty)
                    } if (type === statementTypes.rating) {
                        setParsedStatement(parseRating(content) as Rating)
                    } if (type === statementTypes.disputeAuthenticity) {
                        setParsedStatement(parseDisputeAuthenticity(content) as DisputeAuthenticity)
                    } if (type === statementTypes.disputeContent) {
                        setParsedStatement(parseDisputeContent(content) as DisputeContent)
                    } if (type === statementTypes.boycott) {
                        setParsedStatement(parseBoycott(content) as Boycott)
                    } if (type === statementTypes.organisationVerification) {
                        setParsedStatement(parseOrganisationVerification(content) as OrganisationVerification)
                    } if (type === statementTypes.personVerification) {
                        setParsedStatement(parsePersonVerification(content) as PersonVerification)
                    } if (type === statementTypes.vote) {
                        const vote = parseVote(content) as Vote
                        setParsedStatement(vote)
                        getStatement(vote.pollHash, p => p?.[0] && setPollOfVote(p[0] as StatementWithSupersedingDB))
                    } if (type === statementTypes.poll) {
                        setParsedStatement(parsePoll(content) as Poll)
                        getVotes(hash, v => setVotes(v || []))
                    } if (type === statementTypes.response) {
                        setParsedStatement(parseResponseContent(content) as ResponseContent)
                    }
                } catch (e) {             
                    console.log(e)              
                }
                return
            }
            setStatement(undefined)
            setStatementCollision(undefined)
        })
        getJoiningStatements(hash, s => setJoiningStatements(s))
        getOrganisationVerifications(hash, v => setOrganisationVerifications(v || []))
        getPersonVerifications(hash, v => setPersonVerifications(v || []))
        getResponses(hash, r => setResponses(r || []))
        getDisputes(hash, r => setDisputes(r || []))
        setDataFetched(true)
      }
    }, [dataFetched, hash])
    let location = useLocation()
    React.useEffect(() => {
        setDataFetched(false)
    }, [location])
    React.useEffect(() => {
        if (statement && (statement.type === statementTypes.signPdf) && statement.content){
            getWorkingFileURL(parsePDFSigning(statement.content).hash, 'https://stated.' + statement.domain)
            .then(setWorkingFileURL)
        }
        if (statement && (statement.type === statementTypes.rating) && statement.content){
            const rating = parseRating(statement.content)
            getAggregatedRatings({subject: rating.subjectName, subjectReference: rating.subjectReference, cb: (result) => {
                setRatings(result)
            }})
        }
    }, [statement])

    if (statementCollision) return (
        <div style={{ maxWidth: "100vw", width: "100%", backgroundColor: "rgba(238,238,238,1)", borderRadius: 8, display:'flex',
         flexDirection:'row', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{width : "100%"}}>
            <h3>Multiple statements found</h3>
            <p>To avoid confusion, use the complete statement id when referencing.</p>
            {statementCollision.map((s,i) => (
                <div key={i}>
                    <RouterLink key={i} onClick={()=>setDataFetched(false)} 
                        to={"/statements/"+s.hash_b64}>
                        {s.hash_b64 + " | " + s.domain + " | " + (s.proclaimed_publication_time && new Date(s.proclaimed_publication_time).toUTCString())}
                    </RouterLink>
                </div>
            ))}
            </div>
        </div>
    )
    if (!statement) return (<div style={{marginTop: "20px"}}>Statement not found</div>)
    return (
        <div style={{ maxWidth: "100vw", width: "100%", backgroundColor: "rgba(238,238,238,1)", borderRadius: 8, display:'flex',
         flexDirection:'row', justifyContent: 'center', overflow: 'hidden', padding: "8px" }}>
            <div style={{width : "100%"}}>
            <h3>Statement details</h3>
            {(statement as StatementWithSupersedingDB).superseding_statement && (<Alert severity="error">
                This statement has been replaced by the author with another statement:
                <RouterLink onClick={()=>setDataFetched(false)} 
                    to={"/statements/"+(statement as StatementWithSupersedingDB).superseding_statement}> {
                    (statement as StatementWithSupersedingDB).superseding_statement}</RouterLink>
            </Alert>)}
            {statement.superseded_statement && (<Alert severity="info">
                This statement has a previous version:
                <RouterLink onClick={()=>setDataFetched(false)} 
                    to={"/statements/"+statement.superseded_statement}> {statement.superseded_statement}</RouterLink>
            </Alert>)}
            {(statement as StatementWithHiddenDB).hidden && (<Alert severity="info">
                This is a hidden statement.
            </Alert>)}
            <CompactStatementSmall s={statement} >
                <div style={{position: 'absolute', top: '5px', right: '10px'}}>
                    <RouterLink to="/create-statement">
                        <Tooltip title={"Replace with a new statement as "+ statement.author} >
                            <IconButton aria-label="Replace with a new statement" onClick={()=>{props.supersedeStatement({statement, pollOfVote})}}>
                                <EditIcon/>
                            </IconButton>
                        </Tooltip>
                    </RouterLink>
                    <ConfirmActionWithApiKey statementHash={hash} statement={statement}/>
                </div>
            </CompactStatementSmall>
            {statement && ([statementTypes.bounty, statementTypes.statement, statementTypes.signPdf,
                statementTypes.rating, statementTypes.disputeAuthenticity, statementTypes.disputeContent,
                statementTypes.boycott, statementTypes.observation, statementTypes.organisationVerification,
                statementTypes.personVerification, statementTypes.vote, statementTypes.poll, statementTypes.response
            ].includes(statement.type) && (
                <>
                    {statement && (statement.type === statementTypes.poll && (<RouterLink to="/create-statement">
                        <Button onClick={()=>{props.voteOnPoll(statement)}} variant='contained' 
                        sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                            Vote
                        </Button>
                    </RouterLink>))}
                    <RouterLink to="/create-statement">
                        <Tooltip title="Join statement">
                            <IconButton aria-label="join statement" onClick={()=>{
                                const s = statement
                                if (s.type === statementTypes.rating){
                                    const rating = parseRating(s.content)
                                    props.rateSubject({subject_name: rating.subjectName,
                                        subject_reference: rating.subjectReference, comment: rating.comment,
                                        quality: rating.quality, rating: rating.rating})
                                } else { props.setStatementToJoin(s); }
                            }}>
                                <PlusOneIcon />
                            </IconButton>
                        </Tooltip>
                    </RouterLink>
                    <RouterLink to="/create-statement">
                        <Tooltip title="Respond to statement">
                            <IconButton aria-label="Respond to statement" onClick={()=>{props.respondToStatement(statement);}}>
                                <ReplyIcon/>
                            </IconButton>
                        </Tooltip>
                    </RouterLink>
                    <RouterLink to="/create-statement">
                        <Tooltip title="Dispute statement authenticity">
                            <IconButton aria-label="Dispute statement authenticity" onClick={()=>{props.disputeStatementAuthenticity(statement);}}>
                                <DangerousIcon/>
                            </IconButton>
                        </Tooltip>
                    </RouterLink>
                    <RouterLink to="/create-statement">
                        <Tooltip title="Dispute statement content">
                            <IconButton aria-label="Dispute statement content" onClick={()=>{props.disputeStatementContent(statement);}}>
                                <ReportIcon/>
                            </IconButton>
                        </Tooltip>
                    </RouterLink>
                </>
            ))}
            {statement?.type === statementTypes.observation && (parsedStatement as Observation)?.subjectReference && 
                (<div><a style={{color: '#1976d2'}} href={`/statements/${(parsedStatement as Observation).subjectReference}`} target='_blank' rel="noreferrer">
                <OpenInNewIcon style={{height: '14px'}} />View referenced verification statement</a></div>)
            }
            {statement?.type === statementTypes.vote && (parsedStatement as Vote)?.pollHash && 
                (<div><a style={{color: '#1976d2'}} href={`/statements/${(parsedStatement as Vote).pollHash}`} target='_blank' rel="noreferrer">
                <OpenInNewIcon style={{height: '14px'}} />View referenced poll statement</a></div>)
            }
            {statement?.type === statementTypes.poll && (parsedStatement as Poll)?.scopeQueryLink && 
                (<div><a style={{color: '#1976d2'}} href={(parsedStatement as Poll).scopeQueryLink} target='_blank' rel="noreferrer">
                <OpenInNewIcon style={{height: '14px'}} />View referenced query defining who can participate</a></div>)
            }
            {statement?.type === statementTypes.response && (parsedStatement as ResponseContent)?.hash && 
                (<div><a style={{color: '#1976d2'}} href={`/statements/${(parsedStatement as ResponseContent).hash}`} target='_blank' rel="noreferrer">
                <OpenInNewIcon style={{height: '14px'}} />View referenced statement</a></div>)
            }
            {responses.length > 0 && responses.map((s,i) => (
                <Response key={i} s={s} />
            ))}
            {disputes.length > 0 && disputes.map((s,i) => (
                <Dispute key={i} s={s} />
            ))}
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
            {key && algorithm &&
            (<DecryptedContent statement={statement} decryptionKey={key} decryptionAlgorithm={algorithm} />)}
            <VerificationGraph organisationVerifications={organisationVerifications} personVerifications={personVerifications} statement={statement} lt850px={props.lt850px}/>
            <VerificationLogGraph lt850px={props.lt850px} hash={hash}/>
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
                <p>Check if the domain owner also published the domain under this URL: <Link href={
                    `https://stated.${statement.domain}/statements/${statement.hash_b64}`}>
                    {`https://stated.${statement.domain}/statements/${statement.hash_b64}`}</Link>
                     <span>&nbsp;</span>or under this URL: <br />
                    <Link href={
                        `https://static.stated.${statement.domain}/statements/${statement.hash_b64}.txt`}>
                        {`https://static.stated.${statement.domain}/statements/${statement.hash_b64}.txt`}</Link></p>
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

            { (joiningStatements?.length?? 0) > 0
                 && 
            (<div><h3>Organisations that joined the statemet</h3>
                {joiningStatements!.map(({domain, proclaimed_publication_time, name, hash_b64},i)=>(
                    <div key={i}>
                        <RouterLink key={i} onClick={()=>setDataFetched(false)} to={"/statements/"+hash_b64}>
                            {domain + " | " + (proclaimed_publication_time && new Date(proclaimed_publication_time).toUTCString())}{name ? " | " + name + " ✅":  ""}
                        </RouterLink>
                    </div>
                    )
                )}
            </div>
            )}

            
            {votes.length > 0 && (<div><h3>All votes (including unqualified votes)</h3>
                {votes.map(({proclaimed_publication_time, domain, option, hash_b64, author, qualified},i)=>(
                    <div key={i}>
                        <RouterLink key={i} onClick={()=>setDataFetched(false)} to={"/statements/"+hash_b64}>
                            {option + " | " + domain + " | " +
                             author + " | " + (new Date(proclaimed_publication_time as unknown as string).toUTCString()) +
                             " | "}
                                {qualified ? 
                                <Chip label="qualified" color="success" size='small' variant="outlined" /> : 
                                <Chip label="not qualified" color="error" size='small' variant="outlined"/>}
                        </RouterLink>
                    </div>
                    )
                )}
            </div>
            )}
            {ratings.length > 0 && (<div><h3>Aggregated ratings</h3>
                {ratings.map((r,i)=>(
                    <CompactRating key={i} r={r} i={i.toString()} rateSubject={props.rateSubject} />
                    )
                )}
                </div>)}
            
            </div>
        </div>
        
    )
}


export default StatementDetail

