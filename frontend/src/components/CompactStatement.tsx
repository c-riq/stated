import PlusOneIcon from '@mui/icons-material/PlusOne';
import { Button, Chip, Tooltip } from "@mui/material";
import { Link } from "react-router-dom";
import { timeSince } from '../utils/time'

import {
    statementTypes, BountyKeys, organisationVerificationKeys, PDFSigningKeys, ratingKeys,
    BoycottKeys, ObservationKeys, voteKeys, parseResponseContent, responseKeys, disputeAuthenticityKeys, 
    disputeContentKeys, pollKeys, personVerificationKeys
} from '../statementFormats'

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
    setModalOpen: () => void, i: string
}) => {
    const { s, i } = props
    return (
        <div key={i} style={{ display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin: "1%", borderRadius: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "start" }}>
                <div>{s.repost_count}</div>
                <Link to="/create-statement">
                    <Button onClick={() => { props.setStatementToJoin(s); props.setModalOpen() }} variant='contained'
                        sx={{ backgroundColor: "rgba(42,74,103,1)", borderRadius: 8 }}>
                        <PlusOneIcon />
                    </Button>
                </Link>
            </div>
            <Link to={"/statements/" + s.hash_b64} style={{ flexGrow: 1 }} onClick={() => { props.setModalOpen() }} >
                <div className="statement"
                    // @ts-ignore 
                    style={{ padding: "10px", margin: "10px", width: "100%", textAlign: "left", flexGrow: 1, "a:textDecoration": 'none' }} key={i}>

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