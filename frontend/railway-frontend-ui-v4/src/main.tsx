import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowLeft, Bell, CalendarDays, CheckCircle2, ChevronDown,
  Clock3, Filter, LayoutDashboard, ListChecks, MapPin, RefreshCw, Search, ShieldCheck,
  Sparkles, TrainFront, TriangleAlert, UserCircle, Wifi, Zap, SlidersHorizontal,
  FileCheck2, LockKeyhole, Route, ClipboardList, CircleAlert, Check, X, Info
} from 'lucide-react'
import './styles.css'

const API = 'http://127.0.0.1:8000'
const PLANNING_DATE = '2026-09-02'

type RequestItem = {
  id: string; department: string; task: string; asset: string; section: string;
  date: string; start: string; end: string; duration: number; blockType: string;
  priority: number; requestStatus: string; authorizationStatus: string; power: boolean
}

type Assignment = {
  task_id: string; section_id: string; window_id: string; start_time: string; end_time: string;
  duration_min: number; priority_score: number; resource_id?: string; restriction_penalty?: number
}

const mockRequests: RequestItem[] = [
  { id: 'BR00151', department: 'ENG · Track Machine', task: 'T00022 · Deep Screening Ballast', asset: 'Track S02-UP-KM48 (Continuous Welded Rail)', section: 'S02 (GZB - ALJN)', date: '02 Sep', start: '18:00', end: '20:00', duration: 120, blockType: 'TRAFFIC', priority: 92, requestStatus: 'OPTIMIZED', authorizationStatus: 'REQUESTED', power: false },
  { id: 'BR00150', department: 'S&T · Signaling & Telecom', task: 'T00035 · Point Machine Overhaul', asset: 'Point 104A GZB Yard Interlock', section: 'S01 (Delhi Inbound)', date: '03 Sep', start: '02:00', end: '04:00', duration: 120, blockType: 'TRAFFIC', priority: 75, requestStatus: 'QUEUED', authorizationStatus: 'REQUESTED', power: false },
  { id: 'BR00149', department: 'TRD · Traction Distribution', task: 'T00042 · OHE Inspection', asset: 'OHE Mast S03-KM17', section: 'S03 (ALJN - ETW)', date: '02 Sep', start: '18:00', end: '20:00', duration: 120, blockType: 'INTEGRATED', priority: 83.8, requestStatus: 'OPTIMIZED', authorizationStatus: 'REQUESTED', power: true },
]

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API + path, options)
  if (!response.ok) throw new Error(`${response.status}`)
  return response.json()
}

function App() {
  const loc = useLocation(); const nav = useNavigate()
  const [requests, setRequests] = useState<RequestItem[]>(mockRequests)
  const [connected, setConnected] = useState(false)

  const loadRequests = () => api<any[]>('/api/v1/requests').then(data => {
    if (!Array.isArray(data) || !data.length) return
    setRequests(data.map((x: any) => ({
      id: x.block_request_id, department: x.department_id, task: x.task_id,
      asset: x.asset_id || 'Asset linked to maintenance task', section: x.section_id,
      date: x.requested_date, start: x.preferred_start, end: x.preferred_end,
      duration: x.minimum_duration_min, blockType: x.block_type,
      priority: Number(x.priority_score || 0), requestStatus: x.request_status,
      authorizationStatus: x.authorization_status, power: Boolean(x.power_block_required),
    })))
  }).catch(() => {})

  useEffect(() => { api('/api/v1/database/health').then(() => setConnected(true)).catch(() => setConnected(false)); loadRequests() }, [])

  const screen = loc.pathname
  const navItems = [
    ['/', 'Overview', LayoutDashboard], ['/requests', 'Requests', ListChecks], ['/planner', 'Planner', CalendarDays],
    ['/recommended', 'Recommended', Sparkles], ['/audit', 'More / Audit', ShieldCheck],
  ] as const

  return <div className="appShell">
    <header className="topbar">
      <div className="brand"><div className="brandMark"><TrainFront size={18}/></div><div><b>IR-ABPS <span>SIH26027</span></b><small>Northern Rly / DLI Div</small></div></div>
      <div className="topActions"><span className="env">⌁ Synthetic Data | Demo Environment</span><span className="live">LIVE 4.12</span><button className="iconBtn"><Bell size={17}/><i/></button><button className="profile"><UserCircle size={21}/></button></div>
    </header>
    <main className="page">
      {screen === '/' && <Overview connected={connected} onRequests={() => nav('/requests')} onRecommended={() => nav('/recommended')} />}
      {screen === '/requests' && <Requests requests={requests} onOpen={r => nav('/requests/' + r.id)} onNew={() => nav('/requests/new')} />}
      {screen === '/requests/new' && <RequestDetail requests={requests} onBack={() => nav('/requests')} isNew />}
      {screen.startsWith('/requests/') && screen !== '/requests/new' && <RequestDetail requests={requests} onBack={() => nav('/requests')} />}
      {screen === '/planner' && <Planner />}
      {screen === '/recommended' && <Recommended />}
      {screen === '/audit' && <Audit />}
    </main>
    <nav className="bottomNav">{navItems.map(([path,label,Icon]) => <button key={path} className={screen === path || (path==='/requests' && screen.startsWith('/requests')) ? 'active':''} onClick={()=>nav(path)}><Icon size={19}/><span>{label}</span></button>)}</nav>
  </div>
}

function Overview({connected,onRequests,onRecommended}:{connected:boolean;onRequests:()=>void;onRecommended:()=>void}) {
  const [running,setRunning]=useState(false); const [result,setResult]=useState<any>(null)
  const run=async()=>{setRunning(true);try{const r=await api<any>('/api/v1/optimization/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planning_date:PLANNING_DATE,block_type:'TRAFFIC'})});setResult(r)}catch{setResult({assigned_count:6,candidate_pairs:127,status:'DEMO'})}finally{setRunning(false)}}
  const allocated=result?.assigned_count ?? 7
  return <>
    <div className="context">
      <div><span className="eyebrow">OPERATIONAL SECTION</span><div className="sectionValue">S02: Ghaziabad → Tundla <ChevronDown size={15}/></div><p><Clock3 size={12}/> Planning horizon: 02 Sep 2026 · 24h</p></div>
      <div className="sync"><Wifi size={14}/>{connected?'API Connected':'Demo Mode'}<button><RefreshCw size={14}/></button></div>
    </div>
    <section className="guardrail"><ShieldCheck size={22}/><div><b>AI Planning Guardrail Active <span>Rule 4.12</span></b><small>AI recommends. Railway personnel review, modify and approve all corridor possession windows.</small></div></section>
    <section className="kpis"><Kpi title="Critical Maint." value="4" note="Overdue track gang" tone="danger" badge="4 Urgent"/><Kpi title="Overdue Tasks" value="2" note="OHE + S&T impact" tone="warn" badge="2 Alerts"/><Kpi title="Clear Windows" value="6" note="Optimal 120+ min" tone="good" badge="6 Slots"/><Kpi title="Block Requests" value="9" note="Eng + S&T + TRD" tone="neutral" badge="9 Queued"/><Kpi title="Allocated Plan" value={allocated} note={result?`${result.candidate_pairs ?? 0} candidates checked`:'No conflict lock'} tone="good" badge={result?'Updated':'Ready'}/><Kpi title="Restrictions" value="3" note="Km 42, 68, 104" tone="warn" badge="3 TSR/PSR"/></section>
    <SectionTitle action={<span className="tinyTag">UP & DN Lines</span>}>Corridor Operational Strip</SectionTitle>
    <div className="timeline"><div className="legend"><span><i className="dot train"/>Express & Freight</span><span><i className="dot maint"/>Planned Maint.</span><span><i className="dot conflict"/>Conflict</span><span><i className="dot restr"/>TSR / Caution</span><span><i className="dot free"/>Free Window</span></div><div className="hours">{['12','13','14','15','16','17','18','19','20','21','22','23'].map(h=><span key={h}>{h}:00</span>)}</div><Track name="UP Main (Track 1)" items={[["13:10","14:10","trainSoft","UP 12306 Shatabdi"],["14:00","15:00","conf","Overlap!"],["18:00","20:00","maint","ENG Gang R01 (Tamp)"],["21:00","23:00","free","Open Window (120m)"]]}/><Track name="DN Main (Track 2)" items={[["14:30","15:30","restr","PSR 30k (km42)"],["17:00","20:00","train","#12410 Gomti Exp"],["20:30","22:30","train","CONCOR Freight"]]}/><div className="timelineAlert"><TriangleAlert size={15}/><span>Overlap: UP Track km 48.2 (14:30). Shatabdi headway breach.</span><button>Resolve</button></div></div>
    <section className="healthCard"><div className="healthCircle">94%<small>HEALTH</small></div><div className="healthStats"><div><span>Tasks Covered</span><b>18 / 22</b><em>Overdue Reduction <strong>-65%</strong></em></div><div><span>Critical Coverage</span><b>100%</b><em>Punctuality Impact <strong>&lt; 4 min</strong></em></div></div><span className="grade">Optimal Grade A</span></section>
    <section className="topology"><div><small>SIMULATED NETWORK TOPOLOGY</small><b>GZB → ALJN → TDL Automatic Territory</b></div><div className="routeLine"><span/><span/><span/><span/></div><span>194.5 Km</span></section>
    <button className="runBtn" onClick={run} disabled={running}>{running?<><RefreshCw className="spin" size={17}/> Running Optimization Engine...</>:<><Sparkles size={17}/> Run Optimization Engine</>}</button>
    <button className="recommendBtn" onClick={onRecommended}><Sparkles size={13}/> Review {allocated} New Recommendations <b>{allocated}</b></button>
    <div className="demoNote"><Activity size={12}/> Simulated Northern Railway Division Environment · SIH26027 Synthetic Build</div>
  </>
}

function Kpi({title,value,note,tone,badge}:{title:string;value:React.ReactNode;note:string;tone:string;badge:string}){return <div className={`kpi ${tone}`}><div><span>{title}</span><b>{value}</b><small>{note}</small></div><em>{badge}</em></div>}
function SectionTitle({children,action}:{children:React.ReactNode;action?:React.ReactNode}){return <div className="sectionTitle"><h2>{children}</h2>{action}</div>}
function Track({name,items}:{name:string;items:string[][]}){const start=12;const end=24;const pct=(t:string)=>{const [h,m]=t.split(':').map(Number);return ((h+m/60-start)/(end-start))*100};return <div className="track"><b>{name}</b><div className="trackLane">{items.map((x,i)=><div key={i} className={`bar ${x[2]}`} style={{left:`${pct(x[0])}%`,width:`${pct(x[1])-pct(x[0])}%`}}>{x[3]}</div>)}</div></div>}

function Requests({requests,onOpen,onNew}:{requests:RequestItem[];onOpen:(r:RequestItem)=>void;onNew:()=>void}){
 const [q,setQ]=useState(''); const [status,setStatus]=useState('All'); const [dept,setDept]=useState('ENG')
 const filtered=useMemo(()=>requests.filter(r=>(status==='All'||r.requestStatus===status)&&(dept==='ALL'||r.department.startsWith(dept))&&(`${r.id} ${r.task} ${r.asset} ${r.section}`.toLowerCase().includes(q.toLowerCase()))),[requests,status,dept,q])
 return <>
  <div className="requestHead"><div><h1>My Block Requests <small>{requests.length} Total</small></h1><p>↔ DLI-GZB-ALJN Slot Window: Night corridor opens 23:30 IST</p></div><button className="newBtn" onClick={onNew}>＋ New Block</button></div>
  <div className="searchRow"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search Task, Block ID, KM mark..."/></div><div className="deptTabs">{['ENG','S&T','TRD'].map(d=><button key={d} className={dept===d?'selected':''} onClick={()=>setDept(d)}>{d}</button>)}</div></div>
  <div className="filters">{['All','DRAFT','VALIDATED','QUEUED','OPTIMIZED','APPROVED'].map(s=><button key={s} className={status===s?'selected':''} onClick={()=>setStatus(s)}>{s==='All'?`All (${requests.length})`:s}</button>)}</div>
  <div className="dual"><b><ShieldCheck size={13}/> DUAL GUARDRAIL ARCHITECTURE</b>Algorithmic Optimization checks track conflicts, but a block is <strong>NOT AUTHORIZED</strong> until formally granted by the Section Controller (SCR).</div>
  <div className="cards">{filtered.map(r=><RequestCard key={r.id} r={r} onOpen={()=>onOpen(r)}/>)}</div>
  {!filtered.length&&<div className="empty"><Search size={25}/><b>No requests match the current filters</b><span>Try another department, status or search term.</span></div>}
 </>
}
function RequestCard({r,onOpen}:{r:RequestItem;onOpen:()=>void}){const p=r.priority>=85?'critical':r.priority>=70?'high':'medium';return <article className="requestCard"><div className="reqTop"><div><span className="dept">{r.department}</span><b>{r.id}</b></div><span className={`priority ${p}`}>• {p.toUpperCase()}</span></div><div className="taskLine"><b>{r.task}</b><span>Asset: {r.asset}</span></div><div className="reqGrid"><span><MapPin size={11}/> {r.section}</span><span><Clock3 size={11}/> {r.date} {r.start} - {r.end}</span></div><div className="reqMeta"><span>Window: {r.duration} mins</span><span>{r.blockType==='INTEGRATED'?'Integrated':'Traffic Block'} (Power: {r.power?'Yes':'No'})</span></div><div className="state"><span>⚙ Request State:</span><b>{r.requestStatus==='OPTIMIZED'?'Optimized (In Plan)':r.requestStatus}</b></div><div className="state"><span>◉ SCR Clearance:</span><em>Pending Controller Approval</em></div><div className="cardActions"><button onClick={onOpen}>View Pre-Check</button><button onClick={onOpen}>Track Status</button></div></article>}

function RequestDetail({requests,onBack,isNew=false}:{requests:RequestItem[];onBack:()=>void;isNew?:boolean}){
 const r=requests[0]||mockRequests[0]; const [blockType,setBlockType]=useState('INTEGRATED'); const [power,setPower]=useState(true); const [running,setRunning]=useState(false); const [precheck,setPrecheck]=useState<any>(null)
 const run=async()=>{setRunning(true);try{const result=await api<any>('/api/v1/precheck',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({department_id:'ENG',section_id:'S02',location_id:'L00006',asset_id:'A00001',maintenance_task_id:'T00022',preferred_date:PLANNING_DATE,preferred_start_time:'14:00:00',preferred_end_time:'16:30:00',minimum_duration_minutes:120,block_type:blockType==='INTEGRATED'?'TRAFFIC':blockType,power_block_required:power,resource_ids:['R01']})});setPrecheck(result)}catch{setPrecheck({status:'WARNING',can_submit:false,checks_total:7,checks_passed:6,warnings:0,blocks:1,issues:[{code:'CONFLICT_WINDOW',severity:'BLOCK',message:'Requested window conflicts with current operational constraints.'}],suggested_windows:[{start_time:'18:00:00',end_time:'20:00:00',score:100,reason:'Available COA window with sufficient duration.'}]})}finally{setRunning(false)}}
 return <>
  <button className="back" onClick={onBack}><ArrowLeft size={17}/> <span>Request Detail</span><small>IR-ABPS · DLI Div</small></button>
  <div className="steps"><b className="done"><Check size={12}/> Details<small>Task selected</small></b><b className="current">2<small>Time & Block</small></b><b>3<small>Pre-check</small></b><b>4<small>Submit</small></b></div>
  <section className="detailHero"><div><span>T00022</span><span>ENG Dept</span><h2>Track UP-S02-KM48 (Turnout 12A)</h2><p><Zap size={11}/> Ultrasonic flaw detection (USFD) micro-crack detected. Immediate block maintenance mandated.</p></div><em>△ Score 92/100 · Overdue 2d</em></section>
  <section className="formCard"><div className="formHead"><h2>Block Specifications</h2><span>⇆ Step 2 of 4</span></div><label>OPERATIONAL SECTION<div className="field locked"><span>⚯ Section S02 (Ghaziabad - Aligarh)</span><LockKeyhole size={12}/></div></label><div className="two"><label>PREFERRED DATE<div className="field"><span>▣ Today (24 Oct)</span></div></label><label>BLOCK TARGET<div className="field"><span>150 min</span><small>Min: 120m</small></div></label></div><label>PREFERRED TIME WINDOW<div className="two"><div className="field"><span>Start<br/><b>14:00</b></span><Clock3 size={12}/></div><div className="field"><span>End<br/><b>16:30</b></span><Clock3 size={12}/></div></div></label><label>BLOCK TYPE<div className="seg">{['Traffic','Power','Integrated'].map(x=><button key={x} className={blockType===x.toUpperCase()?'active':''} onClick={()=>setBlockType(x.toUpperCase())}>{x}</button>)}</div></label><div className="toggle"><b>⚡ 25kV OHE Power Isolation</b><span>Requires Traction Substation Permit</span><button onClick={()=>setPower(!power)}>{power?'ON':'OFF'}</button></div><label>ALLOCATED GANG & ROLLING PLANT<div className="chips"><span>Gang R01 (P-Way) ×</span><span>BCM Machine 814 ×</span><span>S&T Escort ×</span><button>＋ Add</button></div></label><label>METHODOLOGY & TSR PLAN<div className="textarea">Deep screening and sleeper renewal under cautionary speed (30 km/h).</div></label><button className="runPre" onClick={run} disabled={running}>{running?<RefreshCw className="spin" size={14}/>:<Sparkles size={14}/>} Run Smart Pre-Check</button><small className="helper">⟳ Simulates dynamic conflict solver against live IR timetable, scheduled rakes, and speed restrictions.</small></section>
  <section className={`feas ${precheck?.blocks?'bad':'good'}`}><div><CircleAlert size={17}/></div><div><b>{precheck?`${precheck.status} feasibility result`:'Live Feasibility Result'}</b><span>{precheck?`${precheck.checks_passed}/${precheck.checks_total} checks passed · ${precheck.suggested_windows?.length||0} alternatives`: 'Run pre-check to validate this request against current constraints.'}</span></div>{precheck&&<em>{precheck.blocks?`${precheck.blocks} Conflict`:'CLEAR'}</em>}</section>
 </>
}

function Planner(){
 const [data,setData]=useState<any>(null); const [loading,setLoading]=useState(false); const [date,setDate]=useState(PLANNING_DATE)
 const run=async()=>{setLoading(true);try{setData(await api<any>('/api/v1/optimization/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planning_date:date,block_type:'TRAFFIC'})}))}catch{setData({status:'DEMO',assigned_count:6,candidate_pairs:127,total_priority:444.8,assignments:[{task_id:'T00021',section_id:'S02',window_id:'W00023',start_time:'18:00:00',end_time:'20:00:00',duration_min:90,priority_score:57.4,resource_id:'R02'},{task_id:'T00035',section_id:'S03',window_id:'W00026',start_time:'21:00:00',end_time:'23:00:00',duration_min:60,priority_score:75,resource_id:'R01'},{task_id:'T00042',section_id:'S03',window_id:'W00025',start_time:'18:00:00',end_time:'20:00:00',duration_min:120,priority_score:83.8,resource_id:'R03'}]})}finally{setLoading(false)}}
 return <><div className="plannerHead"><div><span className="eyebrow">CENTRAL PLANNING WORKSPACE</span><h1>Block Planner</h1><p>Build a coordinated corridor plan from maintenance tasks, COA windows, train movements, restrictions and resource availability.</p></div><button className="runSmall" onClick={run} disabled={loading}>{loading?<RefreshCw className="spin" size={14}/>:<Sparkles size={14}/>} {loading?'Optimizing...':'Run Optimization'}</button></div><div className="plannerTools"><label>Planning Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><span><Filter size={14}/> Traffic Block</span><span><LockKeyhole size={13}/> Human approval required</span></div>{data?<PlanBoard data={data}/>:<div className="plannerEmpty"><CalendarDays size={42}/><h2>Planning horizon ready</h2><p>Run the constraint optimizer to place eligible maintenance tasks into available COA windows while respecting trains, restrictions, dependencies and resource availability.</p><div className="emptyFacts"><span><b>24h</b> horizon</span><span><b>CP-SAT</b> solver</span><span><b>Human</b> approval</span></div><button className="runBtn" onClick={run}><Sparkles size={15}/> Run Optimization</button></div>}</>
}
function PlanBoard({data}:{data:any}){const a:Assignment[]=data.assignments||[];return <><div className="planMetrics"><div><span>Assigned</span><b>{data.assigned_count}</b></div><div><span>Candidate pairs</span><b>{data.candidate_pairs}</b></div><div><span>Total priority</span><b>{Number(data.total_priority||0).toFixed(1)}</b></div><div><span>Solver</span><b>{data.status}</b></div></div><div className="board"><div className="boardHead"><b>Section / Task</b>{['18:00','19:00','20:00','21:00','22:00','23:00'].map(x=><span key={x}>{x}</span>)}</div>{a.map((x,i)=><div className="boardRow" key={i}><div><b>{x.task_id}</b><small>{x.section_id} · {x.resource_id||'Auto resource'}</small></div><div className="boardLane"><div className="planBar" style={{left:`${timePct(x.start_time)}%`,width:`${Math.max(9,timePct(x.end_time)-timePct(x.start_time))}%`}}><b>{x.window_id}</b><span>{x.duration_min}m · P{x.priority_score}</span></div></div></div>)}</div><div className="planNotice"><CheckCircle2 size={15}/> {a.length} assignments selected by the constraint optimizer. Review before authorization.</div></>}
function timePct(t:string){const [h,m]=t.split(':').map(Number);return Math.max(0,Math.min(100,((h+m/60-18)/6)*100))}

function Recommended(){const [data,setData]=useState<any>(null);const [loading,setLoading]=useState(false);const run=async()=>{setLoading(true);try{setData(await api<any>('/api/v1/plan/explanations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planning_date:PLANNING_DATE,block_type:'TRAFFIC'})}))}catch{setData({assigned_count:6,unscheduled_count:4,explanations:[{task_id:'T00022',priority_score:92,reason_code:'NO_SUITABLE_WINDOW',message:'No suitable COA window remains after train and existing block checks.',suggestion:'Try the 21:00-23:00 corridor window.'},{task_id:'T00006',priority_score:91.4,reason_code:'HIGH_RESTRICTION',message:'A high-severity restriction blocks candidate windows on this section.',suggestion:'Replan after restriction clearance or select another section window.'},{task_id:'T00023',priority_score:87.8,reason_code:'TRAIN_CONFLICT',message:'Available windows overlap a higher-priority train movement.',suggestion:'Shift to the next available corridor window.'}]})}finally{setLoading(false)}};return <><div className="recommendHead"><div><span className="eyebrow">EXPLAINABLE DECISION SUPPORT</span><h1>Recommended Plan</h1><p>Every optimizer decision is shown with its assignment, constraints and the reason an eligible task was not scheduled.</p></div><button className="runSmall" onClick={run} disabled={loading}>{loading?<RefreshCw className="spin" size={14}/>:<Sparkles size={14}/>} {loading?'Analyzing...':'Refresh Recommendations'}</button></div>{data?<><div className="recommendSummary"><div><b>{data.assigned_count}</b><span>Tasks assigned</span></div><div><b>{data.unscheduled_count}</b><span>Need review</span></div><div><b>Human</b><span>Final authority</span></div></div><div className="recommendGrid">{(data.explanations||[]).map((e:any,i:number)=><article className="explainCard" key={i}><div className="explainTop"><span className="priority high">P{e.priority_score}</span><b>{e.task_id}</b><span>{e.reason_code?.replaceAll('_',' ')}</span></div><p>{e.message}</p><div className="suggestion"><Sparkles size={14}/><span><b>Suggested action</b>{e.suggestion}</span></div></article>)}</div></>:<div className="plannerEmpty"><Sparkles size={42}/><h2>Recommendations are ready to calculate</h2><p>Run the analysis to show selected assignments, unscheduled tasks, constraint reasons and practical alternatives for the planner.</p><div className="emptyFacts"><span><b>Explainable</b> reasons</span><span><b>Alternatives</b> suggested</span><span><b>Human</b> final authority</span></div><button className="runBtn" onClick={run}><Sparkles size={15}/> Analyze Current Plan</button></div>}</>}

function Audit(){return <><div className="recommendHead"><div><span className="eyebrow">CONTROLLED WORKFLOW</span><h1>Execution & Audit</h1><p>Authorization, execution state and planning decisions are kept separate from optimization output.</p></div><span className="auditPill"><ShieldCheck size={14}/> Human approval boundary</span></div><div className="auditGrid"><AuditCard icon={<FileCheck2/>} title="Plan Review" status="Awaiting review" text="7 optimized assignments are ready for controller review."/><AuditCard icon={<LockKeyhole/>} title="Authorization" status="Not authorized" text="Optimization does not grant track possession or power isolation."/><AuditCard icon={<Route/>} title="Execution" status="Not started" text="Execution status will be recorded after an authorized block is granted."/><AuditCard icon={<ClipboardList/>} title="Decision Audit" status="6 events" text="Optimization inputs, solver result and review actions are retained."/></div><div className="auditLog"><div className="logHead"><h2>Recent Planning Events</h2><span>IMMUTABLE DEMO LOG</span></div>{[['10:42','Optimization completed','6 assignments selected','OPTIMAL'],['10:43','Recommendation review created','4 unscheduled tasks require review','OPEN'],['10:46','Controller approval boundary','No authorization issued automatically','GUARDRAIL']].map((x,i)=><div className="logRow" key={i}><b>{x[0]}</b><div><strong>{x[1]}</strong><span>{x[2]}</span></div><em>{x[3]}</em></div>)}</div></>}
function AuditCard({icon,title,status,text}:{icon:React.ReactNode;title:string;status:string;text:string}){return <article className="auditCard"><div className="auditIcon">{icon}</div><h3>{title}</h3><span className="auditStatus">{status}</span><p>{text}</p><button>View details <ArrowLeft size={12}/></button></article>}

createRoot(document.getElementById('root')!).render(<BrowserRouter><App/></BrowserRouter>)
