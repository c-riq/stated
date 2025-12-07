import React from 'react'

import { sha256 } from 'stated-protocol-parser';

import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';

import { parseStatement, parseBounty, buildStatement, buildBounty } from 'stated-protocol-parser'
import type { Bounty } from 'stated-protocol-parser'
import PublishStatement from './PublishStatement';
import { sendEmail } from './generateEmail';

export const BountyForm = (props:FormProps) => {

    let bountyToJoin: Bounty|undefined = undefined

    if (props.statementToJoin?.statement){
        try {
            const statementParsed = parseStatement({statement: props.statementToJoin.statement, allowNoVersion: true})
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
        props.setPublishingMethod(method)
        try {
            const content = buildBounty({motivation, bounty, reward, judge, judgePay})
            if(method === 'represent'){
                parseBounty(content)
                sendEmail({content, props})
                return
            }
            const statement = buildStatement({domain: props.metaData.domain, author: props.metaData.author, 
                representative: props.metaData.representative, tags: props.metaData.tags, supersededStatement: props.metaData.supersededStatement, time: props.serverTime, content})
            const parsedStatement = parseStatement({statement})
            parseBounty(parsedStatement.content)
            props.setStatement(statement)
            sha256(statement).then((hash) => {
                props.setStatementHash(hash)
            })
        } catch (error) {
            props.setAlertMessage('Invalid bounty format')
            props.setisError(true)
        }
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
            <PublishStatement prepareStatement={prepareStatement} serverTime={props.serverTime} authorDomain={props.metaData.domain}/>
        </FormControl>
    )
}
