import PlusOneIcon from '@mui/icons-material/PlusOne';
import PollIcon from '@mui/icons-material/Poll';

import { Button, Chip, Rating, Stack, Tooltip } from "@mui/material";
import { Link } from "react-router-dom";
import { timeSince } from '../utils/time'

import {
    statementTypes, BountyKeys, organisationVerificationKeys, PDFSigningKeys, ratingKeys,
    BoycottKeys, ObservationKeys, voteKeys, parseResponseContent, responseKeys, disputeAuthenticityKeys, 
    disputeContentKeys, pollKeys, personVerificationKeys, parseRating, parsePoll, parseStatement
} from 'stated-protocol-parser'

const highlightedStatement = (text: string, type: string, adjustColor=false) => {
    let regex = /(\nType: )/
    let highlightColor = 'rgb(42, 72, 103)'
    if (type === statementTypes.bounty) {
        regex = BountyKeys
    }
    if (type === statementTypes.organisationVerification) {
        regex = organisationVerificationKeys
    }
    if (type === statementTypes.personVerification) {
        regex = personVerificationKeys
    }
    if (type === statementTypes.signPdf) {
        regex = PDFSigningKeys
    }
    if (type === statementTypes.rating) {
        regex = ratingKeys
        const parts = text.split(new RegExp(regex, 'g'));
        return <span>{parts.map((v, i) =>
            <span key={i}><span style={regex.test(v) ?
                { fontWeight: '200', color: 'rgb(58,58,58)', fontSize: '13px' } :
                { fontWeight: '550', color: highlightColor }}>
                {(['1/5 Stars', '2/5 Stars', '3/5 Stars', '4/5 Stars', '5/5 Stars'].includes(v)) ?
                    (<span style={{position: 'relative', bottom: '-4px'}}><Rating name="read-only" size="small" value={parseInt(v[0])} readOnly /></span>)
                :
                (regex.test(v) ? v.replace(/: $/, ':') : v)
                }
            </span>
                {regex.test(v) ? ' ' : ''}
            </span>)
        } </span>;
    }
    if (type === statementTypes.boycott) {
        regex = BoycottKeys
    }
    if (type === statementTypes.observation) {
        regex = ObservationKeys
    }
    if (type === statementTypes.vote) {
        regex = voteKeys
    }
    if (type === statementTypes.poll) {
        regex = pollKeys
    }
    if (type === statementTypes.response) {
        regex = responseKeys
    }
    if (type === statementTypes.disputeAuthenticity) {
        regex = disputeAuthenticityKeys
        adjustColor && (highlightColor = 'rgb(91,45,42)')
    }
    if (type === statementTypes.disputeContent) {
        regex = disputeContentKeys
        adjustColor && (highlightColor = 'rgb(91,45,42)')
    }
    const parts = text.split(new RegExp(regex, 'g'));
    return <span>{parts.map((v, i) =>
        <span key={i}><span style={regex.test(v) ?
            { fontWeight: '200', color: 'rgb(58,58,58)', fontSize: '13px' } :
            { fontWeight: '550', color: highlightColor }}>
            {regex.test(v) ? v.replace(/: $/, ':') : v}
        </span>
            {regex.test(v) ? ' ' : ''}
        </span>)
    } </span>;
}


export const CompactStatement = (props: {
    s: StatementWithDetailsDB, setStatementToJoin: (s: StatementWithDetailsDB) => void,
    rateSubject: (s: Partial<RatingDB & StatementDB>) => void,
    setModalOpen: () => void, i: string
}) => {
    const { s, i } = props
    return (
        <div key={i} style={{ display: "flex", flexDirection: "row", backgroundColor: "#ffffff",
        padding: '16px', marginBottom: "8px", borderRadius: 8, width: "100%", overflow: "hidden"}}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "start",  overflow: "hidden", width: "70px", flexShrink: 0 }}>
                <div>{s.repost_count}</div>
                <Link to="/create-statement">
                    <Button onClick={() => {
                        if (s.type === statementTypes.rating){
                            const rating = parseRating(s.content)
                            props.rateSubject({...rating, ...s})
                        } else { props.setStatementToJoin(s); props.setModalOpen() }
                    }} variant='contained'
                        sx={{ backgroundColor: "rgba(42,74,103,1)", borderRadius: 8 }}>
                        <PlusOneIcon />
                    </Button>
                </Link>
            </div>
            <Link to={"/statements/" + s.hash_b64} onClick={() => { props.setModalOpen() }} >
                <div className="statement"
                    // @ts-ignore 
                    style={{ padding: "10px", margin: "10px", width: "100%", textAlign: "left", flexGrow: 1, "a:textDecoration": 'none', overflow:"hidden", maxWidth:"60vw" }} key={i}>

                    <span>{s.domain}</span>
                    {s.author && (<>
                        <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                        <span style={{ fontSize: "10pt", color: "rgba(80,80,80,1" }}>{s.author}</span>
                    </>)}
                    <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                    {s.proclaimed_publication_time && <Tooltip title={s.proclaimed_publication_time}>
                        <span>{timeSince(new Date(s.proclaimed_publication_time))}</span>
                    </Tooltip>
                    }

                    {!s.tags ? <></> : (
                        <>
                            <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                            <span>tags: </span>
                            {s.tags.split(',').map((t: string, i: number) => (<Chip key={i} label={t} style={{ margin: '5px' }} />))}
                        </>
                    )}
                    {s.content.split("\n").map((s1: string, i: number) => (<div key={i} style={{width: "100%", overflow:"hidden"}}>{highlightedStatement(s1, s.type || '')}</div>))}
                </div>
            </Link>
        </div>
    )
}

export const CompactStatementSmall = (props: { s: StatementDB, children: React.ReactNode }) => {
    const { s } = props
    return (
        <div style={{ display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '8px', borderRadius: 8, position: 'relative' }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "start" }}>
            </div>
            <div className="statement"
                // @ts-ignore 
                style={{ padding: "10px", margin: "10px", width: "100%", textAlign: "left", flexGrow: 1, "a:textDecoration": 'none' }}>

                <span>{s.domain}</span>
                {s.author && (<>
                    <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                    <span style={{ fontSize: "10pt", color: "rgba(80,80,80,1" }}>{s.author}</span>
                </>)}
                <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                {s.proclaimed_publication_time && <Tooltip title={s.proclaimed_publication_time}>
                    <span>{timeSince(new Date(s.proclaimed_publication_time))}</span>
                </Tooltip>
                }

                {!s.tags ? <></> : (
                    <>
                        <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                        <span>tags: </span>
                        {s.tags.split(',').map((t: string, i: number) => (<Chip key={i} label={t} style={{ margin: '5px' }} />))}
                    </>
                )}
                {s.content.split("\n").map((s1: string, i: number) => (<div key={i}>{highlightedStatement(s1, s.type || '')}</div>))}
            </div>
            {props.children}
        </div>
    )
}



export const Response = (props: { s: StatementDB }) => {
    const { s } = props
    const response = parseResponseContent(s.content)
    return (
        <Link to={"/statements/" + s.hash_b64} >
        <div style={{ display: "flex", flexDirection: "row"}}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "start", width: "15px" }}>
            </div>
            <div className="statement"
                // @ts-ignore 
                style={{ margin: "10px", width: "100%", textAlign: "left", flexGrow: 1, "a:textDecoration": 'none',
                 backgroundColor: "#ffffff", padding: '18px', borderRadius: 8 }}>

                <span>{s.domain}</span>
                {s.author && (<>
                    <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                    <span style={{ fontSize: "10pt", color: "rgba(80,80,80,1" }}>{s.author}</span>
                </>)}
                <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                {s.proclaimed_publication_time && <Tooltip title={s.proclaimed_publication_time}>
                    <span>{timeSince(new Date(s.proclaimed_publication_time))}</span>
                </Tooltip>
                }

                {!s.tags ? <></> : (
                    <>
                        <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                        <span>tags: </span>
                        {s.tags.split(',').map((t: string, i: number) => (<Chip key={i} label={t} style={{ margin: '5px' }} />))}
                    </>
                )}
                {/* <div>{response.response}</div> */}
                {response.response.split("\n").map((s1: string, i: number) => (<div key={i}>{highlightedStatement(s1, s.type || '')}</div>))}
            </div>
        </div>
        </Link>
    )
}


export const Dispute = (props: { s: StatementDB }) => {
    const { s } = props
    return (
        <Link to={"/statements/" + s.hash_b64} >
        <div style={{ display: "flex", flexDirection: "row"}}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "start", width: "15px" }}>
            </div>
            <div className="statement"
                // @ts-ignore 
                style={{ margin: "10px", width: "100%", textAlign: "left", flexGrow: 1, "a:textDecoration": 'none',
                 backgroundColor: "rgba(251,235,234,1)", padding: '18px', borderRadius: 8 }}>

                <span>{s.domain}</span>
                {s.author && (<>
                    <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                    <span style={{ fontSize: "10pt", color: "rgba(80,80,80,1" }}>{s.author}</span>
                </>)}
                <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                {s.proclaimed_publication_time && <Tooltip title={s.proclaimed_publication_time}>
                    <span>{timeSince(new Date(s.proclaimed_publication_time))}</span>
                </Tooltip>
                }

                {!s.tags ? <></> : (
                    <>
                        <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                        <span>tags: </span>
                        {s.tags.split(',').map((t: string, i: number) => (<Chip key={i} label={t} style={{ margin: '5px' }} />))}
                    </>
                )}
                {s.content.split("\n").map((s1: string, i: number) => (<div key={i}>{highlightedStatement(s1, s.type || '', true)}</div>))}
            </div>
        </div>
        </Link>
    )
}

type CompactPollProps = {
    setStatementToJoin: (arg0: StatementWithDetailsDB | StatementDB) => void,
    setModalOpen: any,
    lt850px: boolean,
    voteOnPoll: (arg0:{statement: string, hash_b64: string}) => void,
    statement: StatementWithDetailsDB,
    i: string
}

export const CompactPoll = (props: CompactPollProps) => {
    const s = props.statement
    let author = undefined
    try {
        author = parseStatement({ statement: s.statement, allowNoVersion: true }).author
    } catch (error) {
        // console.log(error)
    }
    let parsedPoll = undefined
            try{
                parsedPoll = parsePoll(s.content)
            } catch (e){
                console.log(e)
                return (<></>)
            }
            const options = parsedPoll.options
            let votes: {[key: string]: number} = {} 
            if (s.votes){
                for (let o of Object.keys(s.votes)){
                    // @ts-ignore
                    votes[o] = s.votes[o]
                }
            }
            for (let o of options){
                if(!(votes[o])){
                    votes[o] = 0
                }
            }
            const totalVotes = Object.values((votes || [0])).reduce((a:number,b:number)=>a+b, 0)
            return (<div key={props.i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', marginBottom:"8px", borderRadius: 8 }}>
            <div style={{display: "flex", flexDirection: "column", justifyContent:"start", width: "70px"}}>
                    <div>{s.repost_count}</div>
                <Link to="/create-statement">
                    <Button data-testid='vote-on-poll' onClick={()=>{
                        const {statement,hash_b64} = s
                        props.voteOnPoll({statement, hash_b64})
                        props.setModalOpen()}} variant='contained' 
                    sx={{backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>
                        <PollIcon/>
                    </Button>
                </Link>
            </div>
            <Link to={"/statements/" + s.hash_b64} style={{flexGrow: 1}}>
                <div className="statement"
                    // @ts-ignore
                    style={{padding: "10px",margin: "10px", width:"100%", textAlign: "left", flexGrow: 1, "a:textDecoration":'none'}}> 
                    
                    <span>{s.domain}</span>
                    {author && (<>
                        <span style={{marginLeft: '5px', marginRight: '5px'}}>•</span>
                        <span style={{fontSize: "10pt", color: "rgba(80,80,80,1"}}>{author}</span>
                    </>)}
                    <span style={{marginLeft: '5px', marginRight: '5px'}}>•</span>
                    {s.proclaimed_publication_time && <Tooltip title={s.proclaimed_publication_time}>
                        <span>{timeSince(new Date(s.proclaimed_publication_time))}</span>
                    </Tooltip>}
                    
                    {s.tags && (
                        <>
                        <span style={{marginLeft: '5px', marginRight: '5px'}}>•</span>
                        <span>tags: </span>
                        { s.tags.split(',').map((t:string, i:number)=>(<Chip key={i} label={t} style={{margin: '5px'}}/>)) }
                        </>
                    )}
                    <div>{parsedPoll.poll}</div>
                    <Stack spacing={2} sx={{paddingTop: "10px", paddingBottom: "10px"}}>
                        {Object.keys(votes).map(o=>(
                            <div key={o} style={{display: "grid"}}>
                                <div style={{gridArea: "1 / 1"}}>
                                    <div style={{backgroundColor: "rbga(0,0,0,0)", width:"200px", height:"30px", borderRadius: "15px", borderWidth: "1px", borderStyle: "solid", borderColor: "#cccccc"}} />
                                </div>
                                <div style={{gridArea: "1 / 1"}}>
                                    <div style={{backgroundColor: "rgba(42, 74, 103, 0.5)", width: (totalVotes === 0 ? 0 : 200 * votes[o] / totalVotes) + 'px', height:"30px", borderRadius: "15px"}} />
                                </div>
                                <div style={{gridArea: "1 / 1"}}>
                                    <div style={{backgroundColor: "rbga(0,0,0,0)", width:"200px", height:"30px", borderRadius: "15px", padding: "3px 5px 0px 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                                        {o + ": " + votes[o] + "/" + totalVotes}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Stack>
                </div>
            </Link>
        </div>
    )
}