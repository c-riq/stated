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
  getStatementsAPI: ()=>void,
  setSearchQuery: (arg0: string)=>void,
  searchQuery?: string,
  joinStatement: (arg0: statementWithDetails | statementDB) => void,
  voteOnPoll: (arg0:{statement: string, hash_b64: string}) => void,
  setModalOpen: (arg0: boolean)=>void,
  setServerTime: (arg0: Date) => void,
  serverTime: Date,
  statements: any,
  lt850px: boolean
}

const Layout = ({getStatementsAPI, setSearchQuery, searchQuery, joinStatement, voteOnPoll, setModalOpen, setServerTime, statements, lt850px}:LayoutProps) => {
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
              onKeyDown={e=> (e.key === "Enter") && getStatementsAPI()}
              onBlur={() => (searchQuery?.length === 0) && getStatementsAPI()}
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
  const [poll, setPoll] = React.useState(undefined as {statement: string, hash_b64: string} | undefined);
  const [statements, setStatements] = React.useState([] as statementWithDetails[]);
  const [postsFetched, setPostsFetched] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [postToView, setPostToView] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(undefined as string | undefined);
  const [lt850px, setlt850px] = React.useState(window.matchMedia("(max-width: 850px)").matches)
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const navigate = useNavigate();

  React.useEffect(() => {window.matchMedia("(max-width: 850px)").addEventListener('change', e => setlt850px( e.matches ));}, []);

  const getStatementsAPI = () => {
    console.log("getPosts", searchQuery)
      getStatements(searchQuery, (  s:({statements: statementWithDetails[], time: string}|undefined) )=>{
          console.log(s)
          if (s?.statements) {
              setStatements(s.statements)
              window.scrollTo(0,0)
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
  const voteOnPoll = (poll: {statement: string, hash_b64: string}) => {
    setPoll(poll)
    console.log('poll', poll)
    setModalOpen(true)
  }
  const onPostSuccess = () => {
    resetState()
    getStatementsAPI()
  }
  React.useEffect(() => { if(!postsFetched) {
    console.log("useEffect")
      getStatementsAPI()
      setPostsFetched(true)
    }
  })
  const resetState = () => {
    navigate("/"); setModalOpen(false); setStatementToJoin(undefined); setPostToView(false)
  }
  return (
    <div className="App" style={{overflow: modalOpen ? 'hidden': 'scroll'}}>
    <CssBaseline />
    <div className='App-main'>
      <Routes>
          <Route element={(<Layout getStatementsAPI={getStatementsAPI}
          setSearchQuery={setSearchQuery} searchQuery={searchQuery} serverTime={serverTime} joinStatement={joinStatement}
           voteOnPoll={voteOnPoll} setModalOpen={setModalOpen} setServerTime={setServerTime} statements={statements} lt850px={lt850px} />)} >
            {/* @ts-ignore */}
            <Route path='/' exact />
            <Route path='/statement/:statementId' element={(
              <CenterModal modalOpen={true} lt850px={lt850px} onClose={resetState}>
                <Statement voteOnPoll={voteOnPoll} lt850px={lt850px} setStatementToJoin={setStatementToJoin}/>
              </CenterModal>)} 
            />
            <Route path='/create-statement' element={
              <CenterModal modalOpen={true} lt850px={lt850px} onClose={({warning}:{warning:string}) => {warning ? setDialogOpen(true) : resetState() }}>
                <CreateStatement serverTime={serverTime} statementToJoin={statementToJoin} onPostSuccess={onPostSuccess} poll={poll} lt850px={lt850px}/>
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
