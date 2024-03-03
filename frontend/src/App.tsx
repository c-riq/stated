import React, { useEffect } from 'react'

import './App.css';
import CssBaseline from '@mui/material/CssBaseline';

import CreateStatement from './components/CreateStatement'
import StatementDetail from './components/StatementDetail'
import {FullVerificationGraph} from './components/FullVerificationGraph'
import { FullNetworkGraph } from './components/FullNetworkGraph';

import Button from '@mui/material/Button';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';

import { Route, Routes, useNavigate, useLocation, Link } from 'react-router-dom';

import { getStatements } from './api'

import DebugStatement from './components/DebugStatement';
import { CenterModal } from './components/CenterModal';
import { Layout } from './components/Layout';
import { backwardsCompatibility, statementTypeQueryValues, updateQueryString } from './utils/searchQuery';
import Ratings from './components/Ratings';
import RatingList from './components/RatingList';
import RatingsTable from './components/RatingsTable';
import Statements from './components/Statements';
import { Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, SelectChangeEvent } from '@mui/material';


const urlParams = new URLSearchParams(window.location.search);
const queryFromUrl = urlParams.get('search_query')
const domainFilterFromUrl = undefined || urlParams.get('domain')
const tagFilterFromUrl = undefined || urlParams.get('tag')
const subjectNameFilterFromUrl = undefined || urlParams.get('subject_name')
const subjectReferenceFilterFromUrl = undefined || urlParams.get('subject_reference')
const qualityFilterFromUrl = undefined || urlParams.get('quality')
const typesFromUrl = urlParams.get('types')?.split(',')
  .map((t:string)=> (backwardsCompatibility[t] ? backwardsCompatibility[t] : t))
  .filter((t:string) => statementTypeQueryValues.includes(t))
const auhtorFilterFromUrl = undefined || urlParams.get('author')

function App() {

  const [serverTime, setServerTime] = React.useState(new Date());
  const [statementToJoin, setStatementToJoin] = React.useState(undefined as (StatementWithDetailsDB | StatementDB) | undefined);
  const [statementToRespond, setStatementToRepsond] = React.useState(undefined as (StatementWithDetailsDB | StatementDB) | undefined);
  const [statementToDisputeAuthenticity, setStatementToDisputeAuthenticity] = React.useState(undefined as (StatementWithDetailsDB | StatementDB) | undefined);
  const [statementToDisputeContent, setStatementToDisputeContent] = React.useState(undefined as (StatementWithDetailsDB | StatementDB) | undefined);
  const [statementToSupersede, setStatementToSupersede] = React.useState(undefined as (StatementWithDetailsDB | StatementDB) | undefined);
  const [poll, setPoll] = React.useState(undefined as {statement: string, hash_b64: string} | undefined);
  const [subjectToRate, setSubjectToRate] = React.useState(undefined as subjectToRate | undefined);
  const [statements, setStatements] = React.useState([] as StatementWithDetailsDB[]);
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
  const [statementTypesFilter, setStatementTypesFilter] = React.useState<string[]>(typesFromUrl || []);
  const [shouldLoadMore, setShouldLoadMore] = React.useState(false);
  const [domainFilter, setDomainFilter] = React.useState<string | undefined>(domainFilterFromUrl || undefined);
  const [authorFilter, setAuthorFilter] = React.useState<string | undefined>(auhtorFilterFromUrl || undefined);
  const [tagFilter, setTagFilter] = React.useState<string | undefined>(tagFilterFromUrl || undefined);
  const [subjectNameFilter, setSubjectNameFilter] = React.useState<string | undefined>(subjectNameFilterFromUrl || undefined)
  const [subjectReferenceFilter, setSubjectReferenceFilter] = React.useState<string | undefined>(subjectReferenceFilterFromUrl || undefined)
  const [qualityFilter, setQualityFilter] = React.useState<string | undefined>(qualityFilterFromUrl || undefined)
  const [triggerUrlRefresh, setTriggerUrlRefresh] = React.useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleStatementTypeChange = (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      const result = typeof value === 'string' ? value.split(',') : value
      setStatementTypesFilter(result)
  };

  const StatementsSection = () => (<Statements setServerTime={setServerTime} setStatementToJoin={joinStatement} voteOnPoll={voteOnPoll}
    rateSubject={rateSubject} statements={statements} lt850px={lt850px} 
    canLoadMore={canLoadMore} loadingMore={loadingMore} loadMore={()=>{
      setShouldLoadMore(true)
      setLoadingMore(true)
    }} maxSkipId={maxSkipId}
    setModalOpen={() => { setModalOpen(true) }}>
    {!lt850px && (<div>
        <FormControl sx={{ width: 300, height: "40px" }} size="small">
            <InputLabel id="filter-label" sx={{ margin: "0px 0px 0px 5px" }} >Filter statement types</InputLabel>
            <Select
                labelId="filter-label"
                id="filter"
                multiple
                value={statementTypesFilter}
                onChange={handleStatementTypeChange}
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
                {statementTypeQueryValues.map((_type) => (
                    <MenuItem key={_type} value={_type}>
                        <Checkbox checked={statementTypesFilter.indexOf(_type) > -1} />
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
    </Statements>)


  React.useEffect(() => {
    window.matchMedia("(max-width: 850px)").addEventListener('change', e => setlt850px( e.matches ));
    window.matchMedia("(max-width: 500px)").addEventListener('change', e => setlt500px( e.matches ));
  }, []);

  useEffect(() => {
    updateQueryString({searchQuery, tagFilter, domainFilter, authorFilter, subjectNameFilter, subjectReferenceFilter, statementTypes: statementTypesFilter, qualityFilter})
  }, [searchQuery, tagFilter, statementTypesFilter, domainFilter, authorFilter, subjectNameFilter, subjectReferenceFilter, triggerUrlRefresh, qualityFilter])

  React.useEffect(() => {
    if (location.pathname.match('full-verification-graph') || location.pathname.match('full-network-graph') ||
    location.pathname.match('ratings') || location.pathname.match('create-statement')) {
      return
    }
    const limit = 20
    getStatements({searchQuery, tag: tagFilter, limit, skip: 0, statementTypes: statementTypesFilter, domain: domainFilter, author: authorFilter,
        cb: (  s:({statements: StatementWithDetailsDB[], time: string}|undefined) )=>{
        if (s?.statements && (s.statements.length > 0)) {
            setStatements(s.statements)
            const globalMaxSkipId = parseInt(s.statements[0].max_skip_id)
            const currentMaxSkipId = s.statements.reduce((max: number, s: StatementWithDetailsDB) => Math.max(max, parseInt(s.skip_id)), 0)
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
  }, [statementTypesFilter, searchQuery, location.pathname, domainFilter, authorFilter, triggerUrlRefresh, tagFilter])
  React.useEffect(() => {
    if (shouldLoadMore) {
      const limit = 20
      getStatements({searchQuery, tag: tagFilter, limit, skip, statementTypes: statementTypesFilter, domain: domainFilter, author: authorFilter,
         cb: (  s:({statements: StatementWithDetailsDB[], time: string}|undefined) )=>{
          if (s?.statements && (s.statements.length > 0)) {
              const existingStatements = statements
              const newStatements = s.statements.filter((s:StatementWithDetailsDB) => !existingStatements.find((s2:StatementWithDetailsDB) => s2.hash_b64 === s.hash_b64))
              setStatements([...existingStatements, ...newStatements])
              const globalMaxSkipId = parseInt(s.statements[0].max_skip_id)
              const currentMaxSkipId = s.statements.reduce((max: number, s: StatementWithDetailsDB) => Math.max(max, parseInt(s.skip_id)), 0)
              if(currentMaxSkipId === globalMaxSkipId){
                setCanLoadMore(false)
              } else {
                setCanLoadMore(true)
              }
              setSkip(currentMaxSkipId)
              setMaxSkipId(globalMaxSkipId)
              setLoadingMore(false)
          } 
          if (s?.time) {
              setServerTime(new Date(s.time))
          } 
      }})
      setShouldLoadMore(false)
    }
  }, [shouldLoadMore, statementTypesFilter, searchQuery, skip, statements, domainFilter, authorFilter, tagFilter])
  const joinStatement = (statement: (StatementWithDetailsDB | StatementDB)) => {
    setStatementToJoin(statement)
    setModalOpen(true)
  }
  const respondToStatement = (statement: (StatementWithDetailsDB | StatementDB)) => {
    setStatementToRepsond(statement)
    setModalOpen(true)
  }
  const disputeStatementAuthenticity = (statement: (StatementWithDetailsDB | StatementDB)) => {
    setStatementToDisputeAuthenticity(statement)
    setModalOpen(true)
  }
  const disputeStatementContent = (statement: (StatementWithDetailsDB | StatementDB)) => {
    setStatementToDisputeContent(statement)
    setModalOpen(true)
  }
  const supersedeStatement = ({statement, pollOfVote}:
  {statement: (StatementWithDetailsDB | StatementDB), pollOfVote: StatementDB | undefined}) => {
    if (pollOfVote) {
      setPoll({statement: pollOfVote?.statement as string, hash_b64: pollOfVote?.hash_b64 as string})
    } 
    setStatementToSupersede(statement)
    setModalOpen(true)
  }
  const voteOnPoll = (poll: {statement: string, hash_b64: string}) => {
    setPoll(poll)
    setModalOpen(true)
  }
  const rateSubject = (subject: subjectToRate) => {
    setSubjectToRate(subject)
    setModalOpen(true)
  }
  const onPostSuccess = () => {
    resetState()
  }
  const resetState = () => {
    navigate("/"); setModalOpen(false); setStatementToJoin(undefined); setPostToView(false);
    setStatementToRepsond(undefined); setStatementToDisputeAuthenticity(undefined); setStatementToDisputeContent(undefined);
    setStatementToSupersede(undefined); setPoll(undefined); setSubjectToRate(undefined); setTriggerUrlRefresh(!triggerUrlRefresh)
  }
  const resetFilters = () => {
    setDomainFilter(undefined); setAuthorFilter(undefined); setStatementTypesFilter([]); setSearchQuery(undefined);
    setTriggerUrlRefresh(!triggerUrlRefresh)
  }

  return (
    <div className="App" style={{overflow: modalOpen ? 'hidden': 'scroll'}}>
    <CssBaseline />
    <div className='App-main'>
      <Routes>
          <Route path='/' element={(<Layout disableSearch={!location.pathname.match('ratings')} 
              setSearchQuery={setSearchQuery} 
              lt850px={lt850px} lt500px={lt500px} />)}
          >
            <Route index element={(<StatementsSection />)} />
            {/* keep singular until all references are migrated to plural */}
            <Route path='/statement/:statementId' element={(
              <>
                <StatementsSection />
                <CenterModal modalOpen={true} lt850px={lt850px} onClose={resetState}>
                  <StatementDetail voteOnPoll={voteOnPoll} rateSubject={rateSubject} lt850px={lt850px}
                    setStatementToJoin={setStatementToJoin}
                    disputeStatementAuthenticity={disputeStatementAuthenticity}
                    disputeStatementContent={disputeStatementContent}
                    supersedeStatement={supersedeStatement}
                    respondToStatement={respondToStatement} />
                </CenterModal>
              </>)} 
            />
            <Route path='/statements/:statementId' element={(
              <>
                <StatementsSection />
                <CenterModal modalOpen={true} lt850px={lt850px} onClose={resetState}>
                  <StatementDetail voteOnPoll={voteOnPoll} rateSubject={rateSubject} lt850px={lt850px}
                    setStatementToJoin={setStatementToJoin}
                    disputeStatementAuthenticity={disputeStatementAuthenticity}
                    disputeStatementContent={disputeStatementContent}
                    supersedeStatement={supersedeStatement}
                    respondToStatement={respondToStatement} />
                </CenterModal>
              </>)} 
            />
            <Route path='/create-statement' element={(
              <>
                <StatementsSection />
                <CenterModal modalOpen={true} lt850px={lt850px} onClose={({warning}:{warning:string}) => {warning ? setDialogOpen(true) : resetState() }}>
                  <CreateStatement serverTime={serverTime} statementToJoin={statementToJoin} statementToRespond={statementToRespond} 
                    statementToDisputeAuthenticity={statementToDisputeAuthenticity} statementToDisputeContent={statementToDisputeContent}
                    statementToSupersede={statementToSupersede}
                    onPostSuccess={onPostSuccess} poll={poll} subjectToRate={subjectToRate} lt850px={lt850px}/>
                </CenterModal>
              </>)} 
            />
            <Route path='/debug-statement' element={
              <CenterModal modalOpen={true} lt850px={lt850px} onClose={({warning}:{warning:string}) => {warning ? setDialogOpen(true) : resetState() }}>
                <DebugStatement lt850px={lt850px}/>
              </CenterModal>} 
            />
            <Route path='/ratings' element={(<RatingsTable lt850px={lt850px} maxSkipId={99} rateSubject={rateSubject} subjectNameFilter={subjectNameFilter} subjectReferenceFilter={subjectReferenceFilter} qualityFilter={qualityFilter}/>)}
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
