import React from 'react'

import './App.css';
import CssBaseline from '@mui/material/CssBaseline';

import CreateStatement from './components/CreateStatement'
import Statement from './components/Statement'
import Statements from './components/Statements'

import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import CloseIcon from '@mui/icons-material/Close';
import { Route, Routes, Link, useParams, useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';

import { getStatements } from './api.js'
import gh from './img/github.png'


// profile form

// add post form

// send data

// backend verification via domain

// publish results / news feed with upload

const CenterModal = (props) => {
  const { lt850px } = props
  return(
  <Modal sx={{backgroundColor:'rgba(0,0,0,0.1)'}} open={props.modalOpen} onClose={props.onClose}>
    <div>
  <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: lt850px ? '100vw' : '70vw',
      height:  lt850px ? '100vh' :'70vh',
      bgcolor: '#ffffff',
      borderRadius: '12px',
      borderWidth: '0px',
      boxShadow: 24,
      overflowY: 'scroll',
      p: 0
    }}>
    {!lt850px&&(<div style={{height: 50, padding: '16px 16px 16px 16px'}}>
      <a onClick={props.onClose} style={{cursor: 'pointer'}}><CloseIcon sx={{fontSize: "30px"}} /></a>
    </div>)}
    <div style={{padding: '20px', overflowY: 'scroll'}}>
      {
        props.children
      }
    </div>
  </Box>
  {lt850px && (<div style={{position: 'fixed', top: "16px", left: "16px", height: "50px", width: "50px"}}>
    <a onClick={props.onClose} style={{cursor: 'pointer'}}><CloseIcon sx={{fontSize: "30px"}} /></a>
  </div>)}
</div>
</Modal>)
}


function App() {
  const [serverTime, setServerTime] = React.useState(new Date().toUTCString());
  const [statementToJoin, setStatementToJoin] = React.useState("");
  const [posts, setPosts] = React.useState([]);
  const [postsFetched, setPostsFetched] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [postToView, setPostToView] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(false);
  const [lt850px, setlt850px] = React.useState(window.matchMedia("(max-width: 850px)").matches)
  const navigate = useNavigate();

  React.useEffect(() => {window.matchMedia("(max-width: 850px)").addEventListener('change', e => setlt850px( e.matches ));}, []);

  const getStatementsAPI = () => {
    console.log("getPosts", searchQuery)
      getStatements(searchQuery, (s)=>{
          console.log(s)
          if ("statements" in s) {
              setPosts(s.statements)
              window.scrollTo(0,0)
          } 
          if ("time" in s) {
              setServerTime(s.time)
          } 
      })
  }
  const joinStatement = (statement) => {
    setStatementToJoin(statement)
    setModalOpen(true)
  }
  const onPostSuccess = () => {
    setStatementToJoin("")
    setModalOpen(false)
    getStatementsAPI()
    navigate("/")
  }
  React.useEffect(() => { if(!postsFetched) {
    console.log("useEffect")
      getStatementsAPI()
      setPostsFetched(true)
    }
  })
  return (
    <div className="App">
    <CssBaseline />
    <div className='App-main'>
      <header style={{width: "100%", height: "70px", backgroundColor:"rgba(42,74,103,1)", color: "rgba(255,255,255,1)"}}>
        <div style={{ width: "100%", height: "70px", display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{ maxWidth: "900px", flexGrow: 1, marginRight: "32px", marginLeft: "32px", display: "flex", alignItems: "center", justifyContent: "normal", columnGap: "30px"}}>
            <div>
              <Link style={{color: "rgba(255,255,255,1)"}} to="/">{window.location.hostname}</Link>
            </div>
            <div style={{ flexGrow: 1 }}></div>
            <div>
              <TextField id="search-field" label="" variant="outlined" size='small'
                onChange={e => { setSearchQuery(e.target.value) }}
                onKeyDown={e=> (e.key === "Enter") && getStatementsAPI()}
                onBlur={() => (searchQuery.length === 0) && getStatementsAPI()}
                sx={{height: "40px", padding: "0px", borderRadius:"15px", backgroundColor:"rgba(255,255,255,1)", borderWidth: "0px",
                  '& label': { paddingLeft: (theme) => theme.spacing(2) },
                  '& input': { paddingLeft: (theme) => theme.spacing(3.5) },
                  '& fieldset': {
                paddingLeft: (theme) => theme.spacing(2.5),
                borderRadius: '15px',
                height: '40 px'
              },}}/>
            </div>
            {/* <div>
              <Link style={{color: "rgba(255,255,255,1)"}} to="/">home</Link>
            </div>
            <div>
              <Link style={{color: "rgba(255,255,255,1)"}} to="/contact">contact</Link>
            </div> */}
          </div>
        </div>
      </header>
      <Statements setServerTime={setServerTime} setStatementToJoin={joinStatement} posts={posts} lt850px={lt850px}>
        <Link to="/create-statement">
          <Button onClick={()=>{setModalOpen(true)}} variant='contained' 
          sx={{margin: "5px 5px 5px 60px", height: "40px", backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>Create Statement</Button>
        </Link>
      </Statements>

      <Routes>
          <Route path='/' exact />
          <Route path='/statement/:statementId' element={(
            <CenterModal modalOpen={true} lt850px={lt850px} onClose={() => {navigate("/"); setModalOpen(false); setStatementToJoin(""); setPostToView(false)}}>
              <Statement hash_b16={useParams()} hash_b64={Buffer.from(useParams().statementId || '', 'hex').toString('base64')} />
            </CenterModal>)} 
          />
          <Route path='/create-statement' element={
            <CenterModal modalOpen={true} lt850px={lt850px} onClose={() => {navigate("/"); setModalOpen(false); setStatementToJoin(""); setPostToView(false)}}>
              <CreateStatement serverTime={serverTime} statementToJoin={statementToJoin} onPostSuccess={onPostSuccess} key={Math.random()} />
            </CenterModal>} 
          />
      </Routes>
      <div id="footer" style={{width: "100%", height: "120px", backgroundColor:"rgba(42,74,103,1)"}}>

      <div style={{display: "flex", flexDirection: "row", justifyContent:"center", alignItems:"center", height: '100%'}}>
        <div style={{display: "flex", flexDirection: "column", justifyContent:"center", alignItems:"center", height: '100%'}}>
          <a href="https://github.com/c-riq/stated" style={{color: "rgba(255,255,255,1)", textDecoration:"none"}}>
            <img src={gh} style={{height: "30px", width: '30px', flexGroq: 0}}></img>
            </a>
        </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default App;
