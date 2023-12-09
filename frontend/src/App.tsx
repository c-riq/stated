import React from 'react'

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
import { Route, Routes, Link, useNavigate, Outlet } from 'react-router-dom';

import { getStatements, statementDB, statementWithDetails } from './api'

// @ts-ignore
import gh from './img/github.png'
// @ts-ignore
import logo from './img/logo.png'
import DebugStatement from './components/DebugStatement';

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
  getStatementsAPI: (arg0:{reset:boolean|undefined})=>void,
  setSearchQuery: (arg0: string)=>void,
  searchQuery?: string,
  joinStatement: (arg0: statementWithDetails | statementDB) => void,
  voteOnPoll: (arg0:{statement: string, hash_b64: string}) => void,
  setModalOpen: (arg0: boolean)=>void,
  setServerTime: (arg0: Date) => void,
  serverTime: Date,
  statements: any,
  lt850px: boolean,
  canLoadMore: boolean,
  loadingMore: boolean, 
  loadMore: ()=>void
}

const Layout = ({getStatementsAPI, setSearchQuery, searchQuery, joinStatement, voteOnPoll, 
  setModalOpen, setServerTime, statements, lt850px, canLoadMore, loadingMore, loadMore}:LayoutProps) => {
  return(
    <React.Fragment>
      <header style={{width: "100%", height: "70px", backgroundColor:"rgba(42,74,103,1)", color: "rgba(255,255,255,1)"}}>
      <div style={{ width: "100%", height: "70px", display: "flex", alignItems: "center", justifyContent: "center"}}>
        <div style={{ maxWidth: "900px", flexGrow: 1, marginRight: "32px", marginLeft: "32px", display: "flex", alignItems: "center", justifyContent: "normal", columnGap: "30px"}}>
          <div>
            <Link style={{color: "rgba(255,255,255,1)"}} to="/">{window.location.hostname}</Link>
          </div>
          <div style={{ flexGrow: 1 }}></div>
          <div>
            <TextField id="search-field" label="" variant="outlined" size='small'
              placeholder='search'
              onChange={e => { setSearchQuery(e.target.value) }}
              onKeyDown={e=> {if(e.key === "Enter"){
                getStatementsAPI({reset:true})
              }}}
              onBlur={() => (searchQuery?.length === 0) && getStatementsAPI({reset:true})}
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
    canLoadMore={canLoadMore} loadingMore={loadingMore} loadMore={loadMore}
    setModalOpen={()=>{setModalOpen(true)}}>
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
  const [serverTime, setServerTime] = React.useState(new Date());
  const [statementToJoin, setStatementToJoin] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [statementToRespond, setStatementToRepsond] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [statementToDisputeAuthenticity, setStatementToDisputeAuthenticity] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [statementToDisputeContent, setStatementToDisputeContent] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [statementToSupersede, setStatementToSupersede] = React.useState(undefined as (statementWithDetails | statementDB) | undefined);
  const [poll, setPoll] = React.useState(undefined as {statement: string, hash_b64: string} | undefined);
  const [statements, setStatements] = React.useState([] as statementWithDetails[]);
  const [postsFetched, setPostsFetched] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [postToView, setPostToView] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(undefined as string | undefined);
  const [lt850px, setlt850px] = React.useState(window.matchMedia("(max-width: 850px)").matches)
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [skip, setSkip] = React.useState(0);
  const [canLoadMore, setCanLoadMore] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const navigate = useNavigate();

  React.useEffect(() => {window.matchMedia("(max-width: 850px)").addEventListener('change', e => setlt850px( e.matches ));}, []);

  const getStatementsAPI = ({reset}:{reset:boolean|undefined}) => {
      const limit = 20
      if (reset) {
        setStatements([])
        setSkip(0)
      }
      getStatements(searchQuery, limit, reset ? 0 : skip, (  s:({statements: statementWithDetails[], time: string}|undefined) )=>{
          if (s?.statements && (s.statements.length > 0)) {
              const existingStatements = reset ? [] : statements
              const newStatements = s.statements.filter((s:statementWithDetails) => !existingStatements.find((s2:statementWithDetails) => s2.hash_b64 === s.hash_b64))
              setStatements([...existingStatements, ...newStatements])
              const maxSkipId = s.statements.reduce((max: number, s: statementWithDetails) => Math.max(max, parseInt(s.skip_id)), 0)
              setSkip(maxSkipId)
              if(maxSkipId === parseInt(s.statements[0].max_skip_id)){
                setCanLoadMore(false)
              } else {
                setCanLoadMore(true)
              }
              if(!reset) setLoadingMore(false)
              if(reset) window.scrollTo(0,0)
          } 
          if (s?.time) {
              setServerTime(new Date(s.time))
          } 
      })
  }
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
    getStatementsAPI({reset: true})
  }
  React.useEffect(() => { if(!postsFetched) {
      getStatementsAPI({reset: true})
      setPostsFetched(true)
    }
  })
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
          <Route element={(<Layout getStatementsAPI={getStatementsAPI} canLoadMore={canLoadMore} loadingMore={loadingMore} 
          loadMore={()=>{
            setLoadingMore(true)
            getStatementsAPI({reset:false})
          }}
          setSearchQuery={setSearchQuery} searchQuery={searchQuery} serverTime={serverTime} joinStatement={joinStatement}
           voteOnPoll={voteOnPoll} setModalOpen={setModalOpen} setServerTime={setServerTime} statements={statements} lt850px={lt850px} />)} >
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
