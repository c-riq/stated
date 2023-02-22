import React from 'react'

import Button from '@mui/material/Button';

const GenerateStatement = props => {

    return (
        <React.Fragment>
            <div style={{textAlign: "left", marginTop: "16px"}}>Time: {props.serverTime}</div>
            <div style={{display: "flex", flexDirection:"row"}}>
                <Button variant="contained" onClick={() => props.generateHash({viaAPI: false})} margin="normal"
                    sx={{marginTop: "24px", flexGrow: 1, marginRight: "10px"}}>
                    Authenticate via DNS
                </Button>
                <Button variant="contained" onClick={() => props.generateHash({viaAPI: true})} margin="normal"
                    sx={{marginTop: "24px", flexGrow: 1}}>
                    Publish as {window.location.hostname}
                </Button>
            </div>
        </React.Fragment>
    )
}

export default GenerateStatement
