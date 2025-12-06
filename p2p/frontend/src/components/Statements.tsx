import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { statementTypes } from 'stated-protocol-parser'
import { CompactPoll, CompactStatement } from './CompactStatement';

type props = {
    statements: StatementWithDetailsDB[],
    setStatementToJoin: (arg0: StatementWithDetailsDB | StatementDB) => void,
    setServerTime: (arg0: Date) => void,
    setModalOpen: any,
    lt850px: boolean,
    children: any,
    voteOnPoll: (arg0:{statement: string, hash_b64: string}) => void,
    rateSubject: (arg0: Partial<RatingDB>) => void,
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
            <div style={{...{display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}, margin:"2%"}}>
                {props.children}</div>
            <div style ={{overflow: "hidden", wordWrap:"break-word", ...(lt850px ? {margin: '8px'} : {minHeight: '50vh'})}}>
                    {statements && statements.length === 0 && (<div style={{marginTop: '50px'}}>no statements found.</div>)}
                    {statements && statements.length > 0 && statements.map((s,i) => {
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
                            return (<CompactPoll key={i} statement={s} voteOnPoll={props.voteOnPoll}
                            setStatementToJoin={props.setStatementToJoin} setModalOpen={props.setModalOpen} i={i.toString()}
                            lt850px={props.lt850px} />)
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
