import PollIcon from '@mui/icons-material/Poll';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';

import { Link } from 'react-router-dom';
import { timeSince } from '../utils/time'

import { parsePoll, statementTypes, parseStatement } from '../statementFormats'
import { CompactStatement } from './CompactStatement';

type props = {
    statements: StatementWithDetailsDB[],
    setStatementToJoin: (arg0: StatementWithDetailsDB | StatementDB) => void,
    setServerTime: (arg0: Date) => void,
    setModalOpen: any,
    lt850px: boolean,
    children: any,
    voteOnPoll: (arg0:{statement: string, hash_b64: string}) => void,
    rateSubject: (arg0: subjectToRate) => void,
    canLoadMore: boolean,
    loadingMore: boolean,
    loadMore: ()=>void,
    maxSkipId: number,
}

const Statements = (props:props) => {
    const { lt850px, statements, maxSkipId } = props
    return (
        <div style={lt850px ? {marginBottom : "10%" } : { margin: "2%", borderRadius: 8 }}>
            <div style={lt850px ? {width: "100vw"} : { width: "70vw", maxWidth: "900px" }}>
            <div style={{...{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, ...(lt850px ? {margin:"4%"}:{})}}>
                <h3>Statements ({maxSkipId})</h3> {props.children}</div>
                <div style ={(lt850px ? {} : {minHeight: '50vh'})}>
                    {statements && statements.length === 0 && (<div style={{marginTop: '50px'}}>no statements found.</div>)}
                    {statements && statements.length > 0 && statements.map((s,i) => {
                        let author: string|undefined = undefined
                        try {
                            author = parseStatement({statement: s.statement, allowNoVersion:true}).author
                        } catch(error) {
                            // console.log(error)
                        }
                        if ([
                            statementTypes.statement,statementTypes.organisationVerification,
                            statementTypes.personVerification,
                            statementTypes.signPdf, statementTypes.rating, statementTypes.bounty,
                            statementTypes.boycott, statementTypes.observation, statementTypes.vote
                        ].includes(s.type || '')){
                            return (<CompactStatement key={i} s={s} rateSubject={props.rateSubject}
                                setStatementToJoin={props.setStatementToJoin} setModalOpen={props.setModalOpen} i={i.toString()} />)
                        }
                        if (s.type === statementTypes.poll){
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
                            return (<div key={i} style={{display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin:"1%", borderRadius: 8 }}>
                            <div style={{display: "flex", flexDirection: "column", justifyContent:"start"}}>
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
                                    style={{padding: "10px",margin: "10px", width:"100%", textAlign: "left", flexGrow: 1, "a:textDecoration":'none'}} key={i}> 
                                    
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
                    return (<></>)
                    })}
                    {statements && statements.length > 0 && props.canLoadMore && (
                        props.loadingMore ? (<CircularProgress/>)
                        :(<Button onClick={props.loadMore}>Load more</Button>))}
                </div>
            </div>
        </div>
    )
}

export default Statements
