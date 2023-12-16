import React, { useEffect } from 'react'

import './App.css';
import CssBaseline from '@mui/material/CssBaseline';

import CreateStatement from './components/CreateStatement'
import Statement from './components/Statement'
import Statements from './components/Statements'
import {FullVerificationGraph} from './components/FullVerificationGraph'
import { FullNetworkGraph } from './components/FullNetworkGraph';

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';

import CloseIcon from '@mui/icons-material/Close';
import { Route, Routes, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';

import { getStatements, statementDB, statementWithDetails } from './api'

// @ts-ignore
import gh from './img/github.png'
// @ts-ignore
import logo from './img/logo.png'
import DebugStatement from './components/DebugStatement';
import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, SelectChangeEvent } from '@mui/material';

const types = [
  'Statements',
  'Domain Verifications',
  'Polls',
  'Collective Signatures',
  'Ratings',
  'Bounties',
  'Observations',
];

type CenterModalProps = {
  lt850px: boolean,
  text?: string,
  modalOpen: boolean,
  onClose: Function,
  children: any
}

const CenterModal = (props: CenterModalProps) => {
  const { lt850px } = props
  return(
  <Modal sx={{backgroundColor:'rgba(0,0,0,0.1)'}} open={props.modalOpen} onClose={() => props.onClose({warning: true})}>
    <div>
  <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: lt850px ? '100vw' : '70vw',
      height:  lt850px ? '100vh' :'90vh',
      bgcolor: '#ffffff',
      borderRadius: '12px',
      borderWidth: '0px',
      boxShadow: 24,
      overflowY: 'scroll',
      p: 0
    }}>
    {!lt850px&&(<div style={{height: 50, padding: '16px 16px 16px 16px'}}>
      <a onClick={() => props.onClose({warning: false})} style={{cursor: 'pointer'}}>
        <CloseIcon sx={{fontSize: "30px"}} /></a>
    </div>)}
    <div style={{...(lt850px?{padding: '30px'}:{padding: '30px 50px 50px 50px'}), overflowY: 'scroll'}}>
      {
        props.children
      }
    </div>
  </Box>
  {lt850px && (<div style={{position: 'fixed', top: "16px", left: "16px", height: "50px", width: "50px"}}>
    <a onClick={() => props.onClose({warning: false})} style={{cursor: 'pointer'}}>
      <CloseIcon sx={{fontSize: "30px"}} /></a>
  </div>)}
</div>
</Modal>)
}

type LayoutProps = {
  setSearchQuery: (arg0: string)=>void,
  searchQuery?: string,
  joinStatement: (arg0: statementWithDetails | statementDB) => void,
  voteOnPoll: (arg0:{statement: string, hash_b64: string}) => void,
  setModalOpen: (arg0: boolean)=>void,
  setServerTime: (arg0: Date) => void,
  serverTime: Date,
  statements: any,
  lt850px: boolean,
  lt500px: boolean,
  canLoadMore: boolean,
  loadingMore: boolean, 
  loadMore: ()=>void,
  setStatementTypes: (arg0: string[])=>void,
  maxSkipId: number,
  initialSearchQuery?: string,
  initialStatementTypes?: string[]
}

const Layout = ({setSearchQuery, searchQuery, joinStatement, voteOnPoll, 
  setModalOpen, setServerTime, statements, lt850px, lt500px, canLoadMore, loadingMore, loadMore, maxSkipId,
  setStatementTypes, initialSearchQuery, initialStatementTypes}:LayoutProps) => {
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>(initialStatementTypes || []);
  const [localSearchQuery, setLocalSearchQuery] = React.useState<string>(initialSearchQuery || '');
  const handleChange = (event: SelectChangeEvent<typeof selectedTypes>) => {
    const value = event.target.value;
    const result = typeof value === 'string' ? value.split(',') : value
    setSelectedTypes(result);
    setStatementTypes(result)
  };
  return(
    <React.Fragment>
      <header style={{width: "100vw", height: "70px", backgroundColor:"rgba(42,74,103,1)", color: "rgba(255,255,255,1)"}}>
      <div style={{ width: "100vw", height: "70px", display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div style={{ maxWidth: "900px", flexGrow: 1, marginRight: "32px", marginLeft: "32px", display: "flex", alignItems: "center", justifyContent: "normal", columnGap: "30px"}}>
          <div>
            {!lt850px && (<Link style={{color: "rgba(255,255,255,1)"}} to="/">{window.location.hostname}</Link>)}
            <a style={{color: "rgba(255,255,255,1)", marginLeft: "2vw"}} href="/full-verification-graph" target='_blank'>verifications</a>
            {!lt500px && (<a style={{color: "rgba(255,255,255,1)", marginLeft: "2vw"}} href="/full-network-graph" target='_blank'>network</a>)}
            <a style={{color: "rgba(255,255,255,1)", marginLeft: "2vw"}} href="https://stated.ai" target='_blank'>stated.ai</a>
          </div>
          <div style={{ flexGrow: 1 }}></div>
          <div style={{minWidth: "200px"}}>
            <TextField id="search-field" label="" variant="outlined" size='small'
              placeholder='search'
              onChange={e => { setLocalSearchQuery(e.target.value) }}
              onKeyDown={e=> {if(e.key === "Enter"){
                setSearchQuery(localSearchQuery)
              }}}
              onBlur={() => setSearchQuery(localSearchQuery)}
              sx={{height: "40px", padding: "0px", borderRadius:"40px", backgroundColor:"rgba(255,255,255,1)", borderWidth: "0px",
                '& label': { paddingLeft: (theme) => theme.spacing(2) },
                '& input': { paddingLeft: (theme) => theme.spacing(3) },
                '& fieldset': {
              paddingLeft: (theme) => theme.spacing(2.5),
              borderRadius: '40px',
              height: '40 px'
            },}}/>
          </div>
        </div>
      </div>
    </header>
    <Statements setServerTime={setServerTime} setStatementToJoin={joinStatement} voteOnPoll={voteOnPoll} statements={statements} lt850px={lt850px}
    canLoadMore={canLoadMore} loadingMore={loadingMore} loadMore={loadMore} maxSkipId={maxSkipId}
    setModalOpen={()=>{setModalOpen(true)}}>
      {!lt850px && (<div>
            <FormControl sx={{ width: 300, height: "40px" }} size="small">
              <InputLabel id="filter-label" sx={{margin: "0px 0px 0px 5px"}} >Filter statement types</InputLabel>
              <Select
                labelId="filter-label"
                id="filter"
                multiple
                value={selectedTypes}
                onChange={handleChange}
                input={<OutlinedInput sx={{height: "40px"}} label="Filter statement types" />}
                renderValue={(selected) => selected.join(', ')}
                MenuProps={{PaperProps: {
                  style: {
                    maxHeight: 224,
                    width: 250,
                  }
                }}}
                style={{backgroundColor:"rgba(255,255,255,1)", borderRadius: 20}}
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
        <Button onClick={()=>{setModalOpen(true)}} variant='contained' 
        sx={{margin: "5px 5px 5px 60px", height: "40px", backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>Create Statement</Button>
      </Link>
    </Statements>
    <Outlet />
    <div id="footer" style={{width: "100%", height: "120px", backgroundColor:"rgba(42,74,103,1)"}}>
      <div style={{display: "flex", flexDirection: "row", justifyContent:"center", alignItems:"center", height: '100%'}}>
        <div style={{display: "flex", flexDirection: "row", justifyContent:"center", alignItems:"center", height: '100%'}}>
          <a href="https://github.com/c-riq/stated" style={{color: "rgba(255,255,255,1)", textDecoration:"none"}}>
            <img src={gh} style={{height: "40px", width: '30px', marginRight: "20px", paddingTop: "10px", flexGrow: 0}}></img>
          </a>
          <a href="https://stated.ai" style={{backgroundColor: "rgba(255,255,255,1)", paddingTop: "10px", paddingRight: "10px", 
          paddingLeft: "10px", borderRadius: "20px", textDecoration:"none"}}>
            <img src={logo} style={{height: "20px", width: '20px', flexGrow: 0}}></img>
          </a>
        </div>
      </div>
    </div>
  </React.Fragment>
  )}

function App() {

  const urlParams = new URLSearchParams(window.location.search);
  const queryFromUrl = urlParams.get('search_query')
  const domainFilterFromUrl = undefined || urlParams.get('domain')
  const typesFromUrl = urlParams.get('types')?.split(',').filter((t:string) => types.includes(t))
  const auhtorFilterFromUrl = undefined || urlParams.get('author')

  const [serverTime, setServerTime] = React.useState(new Date());
  const [statementToJoin, setStatementToJoin] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [statementToRespond, setStatementToRepsond] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [statementToDisputeAuthenticity, setStatementToDisputeAuthenticity] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [statementToDisputeContent, setStatementToDisputeContent] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [statementToSupersede, setStatementToSupersede] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [poll, setPoll] = React.useState(undefined as {statement: string, hash_b64: string} | undefined);
  const [statements, setStatements] = React.useState([] as statementWithDetails[]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [postToView, setPostToView] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(queryFromUrl || undefined as string | undefined);
  const [lt850px, setlt850px] = React.useState(window.matchMedia("(max-width: 850px)").matches)
  const [lt500px, setlt500px] = React.useState(window.matchMedia("(max-width: 500px)").matches)
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [skip, setSkip] = React.useState(0);
  const [maxSkipId, setMaxSkipId] = React.useState(0);
  const [canLoadMore, setCanLoadMore] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [statementTypes, setStatementTypes] = React.useState<string[]>(typesFromUrl || []);
  const [shouldLoadMore, setShouldLoadMore] = React.useState(false);
  const [domainFilter, setDomainFilter] = React.useState<string | undefined>(domainFilterFromUrl || undefined);
  const [authorFilter, setAuthorFilter] = React.useState<string | undefined>(auhtorFilterFromUrl || undefined);

  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    window.matchMedia("(max-width: 850px)").addEventListener('change', e => setlt850px( e.matches ));
    window.matchMedia("(max-width: 500px)").addEventListener('change', e => setlt500px( e.matches ));
  }, []);

  useEffect(() => {
    const queryString = [
      (searchQuery ? 'search_query=' + searchQuery.replace(/\n/g, '%0A').replace(/\t/g, '%09')  : ''),
      (statementTypes?.length ? 'types=' + statementTypes : ''),
      (domainFilter ? 'domain=' + domainFilter : ''),
      (authorFilter ? 'author=' + authorFilter : '')
    ].filter(s => s.length > 0).join('&')
    window.history.replaceState({}, '', queryString.length > 0 ? '?' + queryString : window.location.pathname)
  }, [searchQuery, statementTypes, domainFilter, authorFilter])

  React.useEffect(() => {
    if (location.pathname.match('full-verification-graph') || location.pathname.match('full-network-graph')) {
      return
    }
    const limit = 20
    getStatements({searchQuery, limit, skip: 0, statementTypes, domain: domainFilterFromUrl, author: auhtorFilterFromUrl,
        cb: (  s:({statements: statementWithDetails[], time: string}|undefined) )=>{
        if (s?.statements && (s.statements.length > 0)) {
            setStatements(s.statements)
            const globalMaxSkipId = parseInt(s.statements[0].max_skip_id)
            const currentMaxSkipId = s.statements.reduce((max: number, s: statementWithDetails) => Math.max(max, parseInt(s.skip_id)), 0)
            if(currentMaxSkipId === globalMaxSkipId){
              setCanLoadMore(false)
            } else {
              setCanLoadMore(true)
            }
            setSkip(currentMaxSkipId)
            setMaxSkipId(globalMaxSkipId)
            window.scrollTo(0,0)
        } else {
          setStatements([])
        }
        if (s?.time) {
            setServerTime(new Date(s.time))
        } 
    }})
  }, [statementTypes, searchQuery, location.pathname, typesFromUrl, domainFilterFromUrl, auhtorFilterFromUrl])
  React.useEffect(() => {
    if (shouldLoadMore) {
      const limit = 20
      getStatements({searchQuery, limit, skip, statementTypes, domain: domainFilterFromUrl, author: auhtorFilterFromUrl,
         cb: (  s:({statements: statementWithDetails[], time: string}|undefined) )=>{
          if (s?.statements && (s.statements.length > 0)) {
              const existingStatements = statements
              const newStatements = s.statements.filter((s:statementWithDetails) => !existingStatements.find((s2:statementWithDetails) => s2.hash_b64 === s.hash_b64))
              setStatements([...existingStatements, ...newStatements])
              const globalMaxSkipId = parseInt(s.statements[0].max_skip_id)
              const currentMaxSkipId = s.statements.reduce((max: number, s: statementWithDetails) => Math.max(max, parseInt(s.skip_id)), 0)
              if(currentMaxSkipId === globalMaxSkipId){
                setCanLoadMore(false)
              } else {
                setCanLoadMore(true)
              }
              setLoadingMore(false)
          } 
          if (s?.time) {
              setServerTime(new Date(s.time))
          } 
      }})
      setShouldLoadMore(false)
    }
  }, [shouldLoadMore, statementTypes, searchQuery, skip, statements, domainFilterFromUrl, auhtorFilterFromUrl])
  const joinStatement = (statement: (statementWithDetails | statementDB)) => {
    setStatementToJoin(statement)
    setModalOpen(true)
  }
  const respondToStatement = (statement: (statementWithDetails | statementDB)) => {
    setStatementToRepsond(statement)
    setModalOpen(true)
  }
  const disputeStatementAuthenticity = (statement: (statementWithDetails | statementDB)) => {
    setStatementToDisputeAuthenticity(statement)
    setModalOpen(true)
  }
  const disputeStatementContent = (statement: (statementWithDetails | statementDB)) => {
    setStatementToDisputeContent(statement)
    setModalOpen(true)
  }
  const supersedeStatement = (statement: (statementWithDetails | statementDB)) => {
    setStatementToSupersede(statement)
    setModalOpen(true)
  }
  const voteOnPoll = (poll: {statement: string, hash_b64: string}) => {
    setPoll(poll)
    setModalOpen(true)
  }
  const onPostSuccess = () => {
    resetState()
  }
  const resetState = () => {
    navigate("/"); setModalOpen(false); setStatementToJoin(undefined); setPostToView(false);
    setStatementToRepsond(undefined); setStatementToDisputeAuthenticity(undefined); setStatementToDisputeContent(undefined);
    setStatementToSupersede(undefined); setPoll(undefined)
  }

  return (
    <div className="App" style={{overflow: modalOpen ? 'hidden': 'scroll'}}>
    <CssBaseline />
    <div className='App-main'>
      <Routes>
          <Route element={(<Layout canLoadMore={canLoadMore} loadingMore={loadingMore} 
          setStatementTypes={setStatementTypes} maxSkipId={maxSkipId}
          loadMore={()=>{
            setShouldLoadMore(true)
            setLoadingMore(true)
          }}
          setSearchQuery={setSearchQuery} searchQuery={searchQuery} serverTime={serverTime} joinStatement={joinStatement}
           voteOnPoll={voteOnPoll} setModalOpen={setModalOpen} setServerTime={setServerTime} statements={statements} 
           initialSearchQuery={searchQuery} initialStatementTypes={statementTypes}
           lt850px={lt850px} lt500px={lt500px} />)} >
            {/* @ts-ignore */}
            <Route path='/' exact />
            {/* keep singular until all references are migrated to plural */}
            <Route path='/statement/:statementId' element={(
              <CenterModal modalOpen={true} lt850px={lt850px} onClose={resetState}>
                <Statement voteOnPoll={voteOnPoll} lt850px={lt850px}
                setStatementToJoin={setStatementToJoin}
                disputeStatementAuthenticity={disputeStatementAuthenticity}
                disputeStatementContent={disputeStatementContent}
                supersedeStatement={supersedeStatement}
                respondToStatement={respondToStatement} />
              </CenterModal>)} 
            />
            <Route path='/statements/:statementId' element={(
              <CenterModal modalOpen={true} lt850px={lt850px} onClose={resetState}>
                <Statement voteOnPoll={voteOnPoll} lt850px={lt850px}
                setStatementToJoin={setStatementToJoin}
                disputeStatementAuthenticity={disputeStatementAuthenticity}
                disputeStatementContent={disputeStatementContent}
                supersedeStatement={supersedeStatement}
                respondToStatement={respondToStatement} />
              </CenterModal>)} 
            />
            <Route path='/create-statement' element={
              <CenterModal modalOpen={true} lt850px={lt850px} onClose={({warning}:{warning:string}) => {warning ? setDialogOpen(true) : resetState() }}>
                <CreateStatement serverTime={serverTime} statementToJoin={statementToJoin} statementToRespond={statementToRespond} 
                statementToDisputeAuthenticity={statementToDisputeAuthenticity} statementToDisputeContent={statementToDisputeContent}
                statementToSupersede={statementToSupersede}
                 onPostSuccess={onPostSuccess} poll={poll} lt850px={lt850px}/>
              </CenterModal>} 
            />
            <Route path='/debug-statement' element={
              <CenterModal modalOpen={true} lt850px={lt850px} onClose={({warning}:{warning:string}) => {warning ? setDialogOpen(true) : resetState() }}>
                <DebugStatement lt850px={lt850px}/>
              </CenterModal>} 
            />
          </Route>
          <Route path='/full-verification-graph' element={<FullVerificationGraph />} />
          <Route path='/full-network-graph' element={<FullNetworkGraph/>} />
      </Routes>
    </div>
    <Dialog /* TODO: fix rerendering deleting state */
        open={dialogOpen}
        onClose={()=>setDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Are you sure to discard changes?"}
        </DialogTitle>
        <DialogActions>
          <Button onClick={()=>{setDialogOpen(false)}}>Keep editing</Button>
          <Button color="warning" style={{color: "ff0000"}} onClick={()=>{resetState();setDialogOpen(false)}} autoFocus>
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;
