import { TextField } from "@mui/material";
import React from "react";
import { Link, Outlet } from "react-router-dom";
// @ts-ignore
import gh from '../img/github.png'
// @ts-ignore
import logo from '../img/logo.png'

const urlParams = new URLSearchParams(window.location.search);
const queryFromUrl = urlParams.get('search_query')

type LayoutProps = {
    setSearchQuery: (arg0: string) => void,
    lt850px: boolean,
    lt500px: boolean,
    disableSearch?: boolean
}

export const Layout = ({ setSearchQuery, lt850px, lt500px, disableSearch }: LayoutProps) => {
    const [localSearchQuery, setLocalSearchQuery] = React.useState<string>(queryFromUrl || '');
    return (
        <React.Fragment>
            <header style={{ width: "100vw", height: "70px", backgroundColor: "rgba(42,74,103,1)", color: "rgba(255,255,255,1)" }}>
                <div style={{ width: "100vw", height: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ maxWidth: "900px", flexGrow: 1, marginRight: "32px", marginLeft: "32px", display: "flex", alignItems: "center", justifyContent: "normal", columnGap: "30px" }}>
                        <div>
                            <Link style={{ color: "rgba(255,255,255,1)" }} to="/" onClick={() => {
                                setLocalSearchQuery('')
                            }}>Statements</Link>
                            {!false && (<Link style={{ color: "rgba(255,255,255,1)" , marginLeft: "2vw"}} to="/ratings" onClick={() => {
                                setLocalSearchQuery('')
                            }}>Ratings</Link>)}
                            {!lt850px && (<a style={{ color: "rgba(255,255,255,1)", marginLeft: "2vw" }} href="/full-verification-graph" target='_blank'>Verifications</a>)}
                            {!lt850px && (<a style={{ color: "rgba(255,255,255,1)", marginLeft: "2vw" }} href="/full-network-graph" target='_blank'>Network</a>)}
                            {!lt500px && (<a style={{ color: "rgba(255,255,255,1)", marginLeft: "2vw" }} href="https://stated.ai" target='_blank'>stated.ai</a>)}
                        </div>
                        <div style={{ flexGrow: 1 }}></div>
                        {disableSearch === false ? <></> : <div style={{ minWidth: "200px" }}>
                            <TextField id="search-field" label="" variant="outlined" size='small'
                                placeholder='search'
                                value={localSearchQuery}
                                onChange={e => { setLocalSearchQuery(e.target.value) }}
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        setSearchQuery(localSearchQuery)
                                    }
                                }}
                                onBlur={() => setSearchQuery(localSearchQuery)}
                                sx={{
                                    height: "40px", padding: "0px", borderRadius: "40px", backgroundColor: "rgba(255,255,255,1)", borderWidth: "0px",
                                    '& label': { paddingLeft: (theme) => theme.spacing(2) },
                                    '& input': { paddingLeft: (theme) => theme.spacing(3) },
                                    '& fieldset': {
                                        paddingLeft: (theme) => theme.spacing(2.5),
                                        borderRadius: '40px',
                                        height: '40 px'
                                    },
                                }} />
                        </div>}
                    </div>
                </div>
            </header>
            <Outlet />
            <div id="footer" style={{ width: "100%", height: "120px", backgroundColor: "rgba(42,74,103,1)" }}>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", height: '100%' }}>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", height: '100%' }}>
                        <a href="https://github.com/c-riq/stated" style={{ color: "rgba(255,255,255,1)", textDecoration: "none" }}>
                            <img src={gh} style={{ height: "40px", width: '30px', marginRight: "20px", paddingTop: "10px", flexGrow: 0 }}></img>
                        </a>
                        <a href="https://stated.ai" style={{
                            backgroundColor: "rgba(255,255,255,1)", paddingTop: "10px", paddingRight: "10px",
                            paddingLeft: "10px", borderRadius: "20px", textDecoration: "none"
                        }}>
                            <img src={logo} style={{ height: "20px", width: '20px', flexGrow: 0 }}></img>
                        </a>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}
