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


// profile form

// add post form

// send data

// backend verification via domain

// publish results / news feed with upload

const CenterModal = (props) => {
  return(
  <Modal sx={{backgroundColor:'rgba(0,0,0,0.1)'}} open={props.modalOpen} onClose={props.onClose}>
  <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '70vw',
      height: '70vh',
      bgcolor: '#ffffff',
      borderRadius: '12px',
      borderWidth: '0px',
      boxShadow: 24,
      overflow: 'scroll',
      p: 0
    }}>
<div style={{
    height: 50,
    padding: '16px 16px 16px 16px'
}}>
  <a onClick={props.onClose} style={{cursor: 'pointer'}}>
    <CloseIcon sx={{fontSize: "30px"}} />
  </a>
</div>
    <div style={{padding: '20px', yOverflow: 'scroll'}}>
      {
        props.children
      }
    </div>
  </Box>
</Modal>)
}


function App() {
  const [serverTime, setServerTime] = React.useState(new Date().toUTCString());
  const [statementToJoin, setStatementToJoin] = React.useState("");
  const [posts, setPosts] = React.useState([]);
  const [postsFetched, setPostsFetched] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [postToView, setPostToView] = React.useState(false);
  const navigate = useNavigate();

  const getStatementsAPI = () => {
    console.log("getPosts")
      getStatements((s)=>{
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
      <header style={{width: "100%", height: "50px", backgroundColor:"rgba(42,74,103,1)", color: "rgba(255,255,255,1)"}}>
        <div style={{ width: "100%", height: "50px", display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{ maxWidth: "900px", flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "normal", columnGap: "30px"}}>
            <div>
              <a href="https://github.com/c-riq/stated" style={{color: "rgba(255,255,255,1)", textDecoration:"none"}}>stated</a>
            </div>
            <div style={{ flexGrow: 1 }}></div>
            <div>
              <TextField id="standard-size-normal" variant="standard" label="search"
              style={{height: "30px", padding: "0px", borderRadius:"15px", backgroundColor:"rgba(255,255,255,1)"}}/>
            </div>
            <div>
              <Link style={{color: "rgba(255,255,255,1)"}} to="/">home</Link>
            </div>
            <div>
              <Link style={{color: "rgba(255,255,255,1)"}} to="/contact">contact</Link>
            </div>
          </div>
        </div>
      </header>
      <Statements setServerTime={setServerTime} setStatementToJoin={joinStatement} posts={posts} >
        <Link to="/create-statement">
          <Button onClick={()=>{setModalOpen(true)}} variant='contained' 
          sx={{margin: "5px 5px 5px 60px", height: "40px", backgroundColor:"rgba(42,74,103,1)", borderRadius: 8}}>Create Statement</Button>
        </Link>
      </Statements>

      <Routes>
          <Route path='/' exact />
          <Route path='/statement/:statementId' element={(
            <CenterModal modalOpen={true} onClose={() => {navigate("/"); setModalOpen(false); setStatementToJoin(""); setPostToView(false)}}>
              <Statement hash_b16={useParams()} hash_b64={Buffer.from(useParams().statementId || '', 'hex').toString('base64')} />
            </CenterModal>)} 
          />
          <Route path='/create-statement' element={
            <CenterModal modalOpen={true}  onClose={() => {navigate("/"); setModalOpen(false); setStatementToJoin(""); setPostToView(false)}}>
              <CreateStatement serverTime={serverTime} statementToJoin={statementToJoin} onPostSuccess={onPostSuccess} key={Math.random()} />
            </CenterModal>} 
          />
      </Routes>
      <div id="footer" style={{width: "100%", height: "120px", backgroundColor:"rgba(42,74,103,1)"}}></div>
    </div>
    </div>
  );
}

export default App;
