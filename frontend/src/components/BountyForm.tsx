import React from 'react'

import { sha256 } from '../utils/hash';

import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';

import { parseStatement, parseBounty, buildStatement, buildBounty, bounty } from '../statementFormats'
import GenerateStatement from './GenerateStatement';



export const BountyForm = (props:FormProps) => {

    let bountyToJoin: bounty|undefined = undefined

    if (props.statementToJoin?.statement){
        try {
            const statementParsed = parseStatement(props.statementToJoin.statement)
            bountyToJoin = parseBounty(statementParsed.content)
            console.log(bountyToJoin)
        } catch (error) {
            console.log(error)
        }
    }

    const [motivation, setMotivation] = React.useState(bountyToJoin?.motivation)
    const [bounty, setBounty] = React.useState(bountyToJoin?.bounty);
    const [reward, setReward] = React.useState(bountyToJoin?.reward);
    const [judge, setJudge] = React.useState(bountyToJoin?.judge);
    const [judgePay, setJudgePay] = React.useState(bountyToJoin?.judgePay);

    const prepareStatement: prepareStatement = ({method}) => {
        if (!motivation || !bounty || !reward || !judge || !judgePay){
            props.setAlertMessage('Please fill in all required fields')
            props.setisError(true)
            return
        }
        props.setViaAPI(method === 'api')
        const content = buildBounty({motivation, bounty, reward, judge, judgePay})
        const statement = buildStatement({domain: props.domain, author: props.author, time: props.serverTime, content})
        const parsedStatement = parseStatement(statement)
        const parsedBounty = parseBounty(parsedStatement.content)
        if(!parsedBounty){
            props.setAlertMessage('Invalid bounty format')
            props.setisError(true)
            return
        }
        props.setStatement(statement)
        sha256(statement).then((value) => {
            props.setStatementHash(value)
            if(method === 'represent'){
                const email = `stated@${window.location.host.replace('stated.','')}`
                const urlEncodedSubject = encodeURIComponent('Quotation request')
                const intro = 'Please distribute the following statement on our behalf.\n' +
                    'Below the statement, we provided authentication evidence below to link our email to the author identity in the statement.'
                const urlEncodedbody = encodeURIComponent(statement + '\n\n\nhash:' + value)
                const href = `mailto:${email}?subject=${urlEncodedSubject}&body=${urlEncodedbody}`
                console.log(href)
                window.location.href = href
            }
        })
    }

    return (
        <FormControl sx={{width: "100%"}}>
        <TextField
            id="motivation"
            variant="outlined"
            placeholder='Enforce international laws'
            label="In order to: ..."
            onChange={e => { setMotivation(e.target.value) }}
            value={motivation}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        <TextField
            id="bounty"
            variant="outlined"
            placeholder='Uncovers an instance of corruption at one of our suppliers'
            label="We will reward any entity that: ..."
            onChange={e => { setBounty(e.target.value) }}
            value={bounty}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        <TextField
            id="reward"
            variant="outlined"
            placeholder='100 USD'
            label="The reward is: ..."
            onChange={e => { setReward(e.target.value) }}
            value={reward}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        <TextField
            id="judge"
            variant="outlined"
            placeholder='Example organisation'
            label="In case of dispute, bounty claims are judged by: ..."
            onChange={e => { setJudge(e.target.value) }}
            value={judge}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
        <TextField
            id="judgePay"
            variant="outlined"
            placeholder='100 USD'
            label="The judge will be paid per investigated case with a maxium of: ..."
            onChange={e => { setJudgePay(e.target.value) }}
            value={judgePay}
            margin="normal"
            sx={{marginTop: '24px'}}
        />
            {props.children}
            <GenerateStatement prepareStatement={prepareStatement} serverTime={props.serverTime}/>
        </FormControl>
    )
}
