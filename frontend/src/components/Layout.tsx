import { Button, Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, SelectChangeEvent, TextField } from "@mui/material";
import React from "react";
import { Link, Outlet } from "react-router-dom";
import Statements from "./Statements";
// @ts-ignore
import gh from '../img/github.png'
// @ts-ignore
import logo from '../img/logo.png'

const types = [
    'Statements',
    'Domain Verifications',
    'Polls',
    'Collective Signatures',
    'Ratings',
    'Bounties',
    'Observations',
];

const urlParams = new URLSearchParams(window.location.search);
const queryFromUrl = urlParams.get('search_query')
const typesFromUrl = urlParams.get('types')?.split(',').filter((t:string) => types.includes(t))

type LayoutProps = {
    setSearchQuery: (arg0: string) => void,
    searchQuery?: string,
    joinStatement: (arg0: StatementWithDetailsDB | StatementDB) => void,
    voteOnPoll: (arg0: { statement: string, hash_b64: string }) => void,
    setModalOpen: (arg0: boolean) => void,
    setServerTime: (arg0: Date) => void,
    serverTime: Date,
    statements: any,
    lt850px: boolean,
    lt500px: boolean,
    canLoadMore: boolean,
    loadingMore: boolean,
    loadMore: () => void,
    setStatementTypes: (arg0: string[]) => void,
    maxSkipId: number,
    resetFilters: () => void
}

export const Layout = ({ setSearchQuery, joinStatement, voteOnPoll, resetFilters,
    setModalOpen, setServerTime, statements, lt850px, lt500px, canLoadMore, loadingMore, loadMore, maxSkipId,
    setStatementTypes }: LayoutProps) => {
    const [selectedTypes, setSelectedTypes] = React.useState<string[]>(typesFromUrl || []);
    const [localSearchQuery, setLocalSearchQuery] = React.useState<string>(queryFromUrl || '');
    const handleChange = (event: SelectChangeEvent<typeof selectedTypes>) => {
        const value = event.target.value;
        const result = typeof value === 'string' ? value.split(',') : value
        setSelectedTypes(result);
        setStatementTypes(result)
    };
    return (
        <React.Fragment>
            <header style={{ width: "100vw", height: "70px", backgroundColor: "rgba(42,74,103,1)", color: "rgba(255,255,255,1)" }}>
                <div style={{ width: "100vw", height: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ maxWidth: "900px", flexGrow: 1, marginRight: "32px", marginLeft: "32px", display: "flex", alignItems: "center", justifyContent: "normal", columnGap: "30px" }}>
                        <div>
                            {!lt850px && (<Link style={{ color: "rgba(255,255,255,1)" }} to="/" onClick={() => {
                                resetFilters()
                                setLocalSearchQuery('')
                                setSelectedTypes([])
                            }}>{window.location.hostname}</Link>)}
                            <a style={{ color: "rgba(255,255,255,1)", marginLeft: "2vw" }} href="/full-verification-graph" target='_blank'>Verifications</a>
                            {!lt500px && (<a style={{ color: "rgba(255,255,255,1)", marginLeft: "2vw" }} href="/full-network-graph" target='_blank'>Network</a>)}
                            <a style={{ color: "rgba(255,255,255,1)", marginLeft: "2vw" }} href="https://stated.ai" target='_blank'>stated.ai</a>
                        </div>
                        <div style={{ flexGrow: 1 }}></div>
                        <div style={{ minWidth: "200px" }}>
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
                        </div>
                    </div>
                </div>
            </header>
            <Statements setServerTime={setServerTime} setStatementToJoin={joinStatement} voteOnPoll={voteOnPoll} statements={statements} lt850px={lt850px}
                canLoadMore={canLoadMore} loadingMore={loadingMore} loadMore={loadMore} maxSkipId={maxSkipId}
                setModalOpen={() => { setModalOpen(true) }}>
                {!lt850px && (<div>
                    <FormControl sx={{ width: 300, height: "40px" }} size="small">
                        <InputLabel id="filter-label" sx={{ margin: "0px 0px 0px 5px" }} >Filter statement types</InputLabel>
                        <Select
                            labelId="filter-label"
                            id="filter"
                            multiple
                            value={selectedTypes}
                            onChange={handleChange}
                            input={<OutlinedInput sx={{ height: "40px" }} label="Filter statement types" />}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 224,
                                        width: 250,
                                    }
                                }
                            }}
                            style={{ backgroundColor: "rgba(255,255,255,1)", borderRadius: 20 }}
                        >
                            {types.map((_type) => (
                                <MenuItem key={_type} value={_type}>
                                    <Checkbox checked={selectedTypes.indexOf(_type) > -1} />
                                    <ListItemText primary={_type} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>)}
                <Link to="/create-statement">
                    <Button onClick={() => { setModalOpen(true) }} variant='contained' data-testid="create-statement"
                        sx={{ margin: "5px 5px 5px 60px", height: "40px", backgroundColor: "rgba(42,74,103,1)", borderRadius: 8 }}>Create Statement</Button>
                </Link>
            </Statements>
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
