import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowLeft, Bell, CalendarDays, CheckCircle2,
  ChevronDown, Clock3, LayoutDashboard, ListChecks, RefreshCw, Search,
  ShieldCheck, Sparkles, TrainFront, TriangleAlert, UserCircle, Wifi,
} from 'lucide-react'
import './styles.css'

const API = 'http://127.0.0.1:8000'
const PLANNING_DATE = '2026-09-02'

type RequestItem = {
  id: string; department: string; task: string; asset: string; section: string;
  date: string; start: string; end: string; duration: number; blockType: string;
  priority: number; requestStatus: string; authorizationStatus: string; power: boolean
}

const mockRequests: RequestItem[] = [
  { id: 'BR00151', department: 'ENG · Track Machine', task: 'T00001 · Corrective maintenance', asset: 'Track S01-UP-KM48', section: 'S01 (DLI - GZB)', date: '10 Sep', start: '18:00', end: '20:00', duration: 120, blockType: 'TRAFFIC', priority: 46.2, requestStatus: 'DRAFT', authorizationStatus: 'REQUESTED', power: false },
  { id: 'BR00150', department: 'S&T · Signaling & Telecom', task: 'T00035 · Inspection', asset: 'Signal equipment S03', section: 'S03 (ALJN - ETW)', date: '09 Sep', start: '21:00', end: '23:00', duration: 120, blockType: 'TRAFFIC', priority: 75, requestStatus: 'QUEUED', authorizationStatus: 'REQUESTED', power: false },
  { id: 'BR00149', department: 'TRD · Traction Distribution', task: 'T00042 · OHE inspection', asset: 'OHE Mast S03-KM17', section: 'S03 (ALJN - ETW)', date: '09 Sep', start: '18:00', end: '20:00', duration: 120, blockType: 'TRAFFIC', priority: 83.8, requestStatus: 'OPTIMIZED', authorizationStatus: 'REQUESTED', power: true },
]

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API + path, options)
  if (!response.ok) throw new Error(`${response.status}`)
  return response.json()
}

function App() {
  const loc = useLocation()
  const nav = useNavigate()
  const [requests, setRequests] = useState<RequestItem[]>(mockRequests)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    api('/api/v1/database/health').then(() => setConnected(true)).catch(() => setConnected(false))
    api<any[]>('/api/v1/requests').then(data => {
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
  }, [])

  const screen = loc.pathname
  const navItems = [
    ['/', 'Overview', LayoutDashboard], ['/requests', 'Requests', ListChecks],
    ['/planner', 'Planner', CalendarDays], ['/recommended', 'Recommended', Sparkles],
    ['/audit', 'More / Audit', ShieldCheck],
  ] as const

  return <div className="appShell">
    <header className="topbar">
      <div className="brand">
        <div className="brandMark"><TrainFront size={17} /></div>
        <div><b>IR-ABPS <span>SIH26027</span></b><small>Northern Rly / DLI Div</small></div>
      </div>
      <div className="topActions">
        <span className="env">♙ Synthetic Data | Demo Environment</span>
        <span className="live">LIVE 4.12</span>
        <button className="iconBtn" aria-label="Notifications"><Bell size={16} /><i /></button>
        <button className="profile" aria-label="Profile"><UserCircle size={19} /></button>
      </div>
    </header>

    <main className="page">
      {screen === '/' && <Overview connected={connected} onRequests={() => nav('/requests')} onRecommended={() => nav('/recommended')} />}
      {screen === '/requests' && <Requests requests={requests} onOpen={r => nav('/requests/' + r.id)} onNew={() => nav('/requests/new')} />}
      {screen.startsWith('/requests/') && <RequestDetail requests={requests} onBack={() => nav('/requests')} />}
      {screen === '/planner' && <Planner />}
      {screen === '/recommended' && <Recommended />}
      {screen === '/audit' && <Audit />}
    </main>

    <nav className="bottomNav">
      {navItems.map(([path, label, Icon]) => <button key={path}
        className={screen === path || (path === '/requests' && screen.startsWith('/requests')) ? 'active' : ''}
        onClick={() => nav(path)}><Icon size={18} /><span>{label}</span></button>)}
    </nav>
  </div>
}

function Overview({ connected, onRequests, onRecommended }: { connected: boolean; onRequests: () => void; onRecommended: () => void }) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const run = async () => {
    setRunning(true); setError('')
    try {
      const r = await api<any>('/api/v1/optimization/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planning_date: PLANNING_DATE, block_type: 'TRAFFIC' })
      })
      setResult(r)
    } catch {
      setResult({ status: 'DEMO', assigned_count: 6, candidate_pairs: 127 })
      setError('Backend result unavailable. Showing the latest synthetic demo result.')
    } finally { setRunning(false) }
  }

  const allocated = result?.assigned_count ?? 6
  const candidates = result?.candidate_pairs ?? 127

  return <>
    <div className="demoRibbon"><Activity size={12} /> Synthetic Data | Demo Environment <span>Planning date: 02 Sep 2026</span></div>

    <section className="context">
      <div>
        <span className="eyebrow">OPERATIONAL SECTION</span>
        <div className="sectionValue">S02: Ghaziabad → Tundla <ChevronDown size={15} /></div>
        <p><Clock3 size={12} /> Horizon: 24h (Today)</p>
      </div>
      <div className="sync"><span className={connected ? 'statusDot online' : 'statusDot'} />{connected ? 'API Connected' : 'Demo Mode'}<button aria-label="Refresh"><RefreshCw size={13} /></button></div>
    </section>

    <section className="guardrail">
      <div className="guardIcon"><ShieldCheck size={19} /></div>
      <div><b>AI Planning Guardrail Active <span>Rule 4.12</span></b><small>AI recommends. Railway personnel review, modify and approve all corridor possession windows.</small></div>
    </section>

    <section className="kpis">
      <Kpi title="Critical Maint." value="4" note="Overdue track work" tone="danger" badge="4 Urgent" />
      <Kpi title="Overdue Tasks" value="2" note="S&T + TRD impact" tone="warn" badge="2 Alerts" />
      <Kpi title="Clear Windows" value="6" note="120+ min available" tone="good" badge="6 Slots" />
      <Kpi title="Block Requests" value="9" note="ENG + S&T + TRD" tone="neutral" badge="9 Queued" />
      <Kpi title="Allocated Plan" value={allocated} note={`${candidates} candidate pairs checked`} tone="good" badge="Ready" />
      <Kpi title="Restrictions" value="3" note="Active section limits" tone="warn" badge="3 TSR/PSR" />
    </section>

    <SectionTitle action={<span className="tinyTag">UP & DN Lines</span>}>Corridor Operational Strip</SectionTitle>
    <div className="timeline">
      <div className="legend"><span><i className="dot train" />Express & Freight</span><span><i className="dot maint" />Planned Maint.</span><span><i className="dot conflict" />Conflict</span><span><i className="dot restr" />TSR / Caution</span><span><i className="dot free" />Free Window</span></div>
      <div className="hours">{['12','13','14','15','16','17','18','19','20','21','22','23'].map(h => <span key={h}>{h}:00</span>)}</div>
      <Track name="UP Main (Track 1)" items={[
        ['13:10','15:00','trainSoft','UP 12306 Shatabdi'], ['14:00','15:00','conf','Overlap!'],
        ['18:00','20:00','maint','ENG Gang R01 (Tamp)'], ['21:00','23:00','free','Open Window (120m)']
      ]} />
      <Track name="DN Main (Track 2)" items={[
        ['14:30','15:30','restr','PSR 30k (km42)'], ['17:00','20:00','train','#12410 Gomti Exp'], ['20:30','22:30','train','CONCOR Freight']
      ]} />
      <div className="timelineAlert"><TriangleAlert size={14} /><span>Overlap: UP Track km 48.2 (14:30). Shatabdi headway breach.</span><button>Resolve</button></div>
    </div>

    <section className="healthCard">
      <div className="healthCircle">94%<small>HEALTH</small></div>
      <div className="healthStats">
        <div><span>Tasks Covered</span><b>18 / 22</b><em>Overdue Reduction <strong>-65%</strong></em></div>
        <div><span>Critical Coverage</span><b>100%</b><em>Punctuality Impact <strong>&lt; 4 min</strong></em></div>
      </div>
      <span className="grade">Optimal Grade A</span>
    </section>

    <section className="topology">
      <div><small>SIMULATED NETWORK TOPOLOGY</small><b>GZB → ALJN → TDL Automatic Territory</b></div>
      <div className="routeLine"><span /><span /><span /><span /></div>
      <span>194.5 Km</span>
    </section>

    <button className="runBtn" onClick={run} disabled={running}>{running ? <><RefreshCw className="spin" size={17} /> Running Optimization Engine...</> : <><Sparkles size={17} /> Run Optimization Engine</>}</button>
    <button className="recommendBtn" onClick={onRecommended}><Sparkles size={13} /> Review {allocated} New Recommendations <b>{allocated}</b></button>
    {error && <div className="softError"><AlertTriangle size={13} /> {error}</div>}
    <div className="demoNote"><Activity size={12} /> Simulated Northern Railway Division Environment · SIH26027 Synthetic Build</div>
  </>
}

function Kpi({ title, value, note, tone, badge }: { title: string; value: React.ReactNode; note: string; tone: string; badge: string }) {
  return <article className={'kpi ' + tone}><div><span>{title}</span><b>{value}</b><small>{note}</small></div><em>{badge}</em></article>
}
function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="sectionTitle"><h2>{children}</h2>{action}</div>
}
function Track({ name, items }: { name: string; items: string[][] }) {
  return <div className="track"><b>{name}</b><div className="trackArea">{items.map(([s, e, c, t], i) => {
    const start = Number(s.slice(0, 2)) + Number(s.slice(3)) / 60
    const end = Number(e.slice(0, 2)) + Number(e.slice(3)) / 60
    const left = Math.max(0, (start - 12) / 11 * 100)
    const width = Math.max(5, (end - start) / 11 * 100)
    return <div key={i} className={'bar ' + c} style={{ left: `${left}%`, width: `${width}%` }}>{t}</div>
  })}</div></div>
}

function Requests({ requests, onOpen, onNew }: { requests: RequestItem[]; onOpen: (r: RequestItem) => void; onNew: () => void }) {
  return <><div className="requestHead"><div><h1>My Block Requests <small>{requests.length} Total</small></h1><p>↔ DLI-GZB-ALJN Slot Window: Night corridor opens 23:30 IST</p></div><button className="newBtn" onClick={onNew}>＋ New Block</button></div>
    <div className="searchRow"><div className="search"><Search size={16} /><input placeholder="Search Task, Block ID, KM mark..." /></div><div className="deptTabs"><button>ENG</button><button>S&T</button><button>TRD</button></div></div>
    <div className="filters">{['All (' + requests.length + ')', 'Draft', 'Validated', 'Queued', 'Optimized', 'Approved'].map((x, i) => <button className={i === 0 ? 'selected' : ''} key={x}>{x}</button>)}</div>
    <div className="dual"><b>ⓘ DUAL GUARDRAIL ARCHITECTURE</b><span>Algorithmic Optimization checks conflicts, but a block is <strong>NOT AUTHORIZED</strong> until formally granted by the Section Controller (SCR).</span></div>
    <div className="cards">{requests.slice(0, 8).map(r => <RequestCard key={r.id} r={r} onOpen={() => onOpen(r)} />)}</div></>
}
function RequestCard({ r, onOpen }: { r: RequestItem; onOpen: () => void }) {
  const level = r.priority >= 85 ? 'critical' : r.priority >= 60 ? 'high' : 'medium'
  return <article className="requestCard"><div className="reqTop"><div><span className="dept">{r.department}</span><b>{r.id}</b></div><span className={'priority ' + level}>● {level.toUpperCase()}</span></div>
    <div className="taskLine"><b>{r.task}</b><span>Asset: {r.asset}</span></div><div className="reqGrid"><span>⌖ {r.section}</span><span>◷ {r.date} {r.start} - {r.end}</span></div>
    <div className="reqMeta"><span>Window: {r.duration} mins</span><span>{r.blockType} (Power: {r.power ? 'Yes' : 'No'})</span></div>
    <div className="state"><span>⚙ Request State:</span><b>{r.requestStatus}</b></div><div className="state"><span>◉ SCR Clearance:</span><em>{r.authorizationStatus}</em></div>
    <div className="cardActions"><button onClick={onOpen}>View Pre-Check</button><button onClick={onOpen}>Track Status</button></div></article>
}

function RequestDetail({ requests, onBack }: { requests: RequestItem[]; onBack: () => void }) {
  const [pre, setPre] = useState<any>(null); const [loading, setLoading] = useState(false)
  const run = async () => { setLoading(true); try { setPre(await api('/api/v1/precheck', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ department_id: 'ENG', section_id: 'S02', location_id: 'L00002', asset_id: 'A00002', maintenance_task_id: 'T00002', preferred_date: PLANNING_DATE, preferred_start_time: '14:00', preferred_end_time: '16:30', minimum_duration_minutes: 120, block_type: 'TRAFFIC', power_block_required: true, resource_ids: ['R01'] }) })) } catch { setPre({ status: 'WARNING', checks_total: 7, checks_passed: 6, warnings: 1, blocks: 0 }) } finally { setLoading(false) } }
  return <><button className="back" onClick={onBack}><ArrowLeft size={17} /> Request Detail <span>IR-ABPS · DLI Div</span></button><div className="steps"><b>✓<small>Details</small></b><b className="current">2<small>Time & Block</small></b><b>3<small>Pre-check</small></b><b>4<small>Submit</small></b></div>
    <div className="detailHero"><div><span>T00022</span><span>ENG Dept</span><h2>Track UP-S02-KM48 (Turnout 12A)</h2><p>Ultrasonic Flaw Detection (USFD) micro-crack detected. Immediate block maintenance mandated.</p></div><em>⚠ Score 92/100 · Overdue 2d</em></div>
    <section className="formCard"><div className="formHead"><h2>Block Specifications</h2><span>⇄ Step 2 of 4</span></div><label>OPERATIONAL SECTION<div className="field locked">⚯ Section S02 (Ghaziabad - Aligarh) <span>🔒</span></div></label>
      <div className="two"><label>PREFERRED DATE<div className="field">▣ Today</div></label><label>BLOCK TARGET<div className="field"><b>150 min</b><small>Min: 120m</small></div></label></div>
      <label>PREFERRED TIME WINDOW<div className="two"><div className="field">Start <b>14:00</b> ◷</div><div className="field">End <b>16:30</b> ◷</div></div></label>
      <label>BLOCK TYPE<div className="seg"><button>Traffic</button><button>Power</button><button className="active">Integrated</button></div></label>
      <div className="toggle"><b>ϟ 25kV OHE Power Isolation</b><span>Requires Traction Substation Permit</span><button>●</button></div>
      <label>ALLOCATED GANG & ROLLING PLANT<div className="chips"><span>Gang R01 (P-Way) ×</span><span>BCM Machine 614 ×</span><span>S&T Escort ×</span><button>＋ Add</button></div></label>
      <label>METHODOLOGY & TSR PLAN<div className="textarea">Deep screening and sleeper renewal under cautionary speed (30 km/h).</div></label>
      <button className="runPre" onClick={run}>{loading ? <RefreshCw className="spin" /> : <Sparkles size={16} />} Run Smart Pre-Check</button><small className="helper">⟳ Simulates dynamic conflict checks against timetable, scheduled movements, and restrictions.</small>
    </section>
    <div className="feas"><b>● Live Feasibility Result</b>{pre && <span>{pre.status} · {pre.checks_passed}/{pre.checks_total} checks passed · {pre.blocks} blocking conflicts</span>}<em>{pre ? pre.status : 'Not Run'}⌄</em></div></>
}

function Planner() { return <div className="placeholder"><CalendarDays size={42} /><h1>Block Planner</h1><p>Timeline planning surface will consume COA windows, train events, restrictions, resources and optimizer assignments.</p><button className="runBtn">Open Planning Horizon</button></div> }
function Recommended() { return <div className="placeholder"><Sparkles size={42} /><h1>Recommended Plan</h1><p>Explainable optimizer recommendations will appear here, with assigned tasks, reasons and unscheduled-task explanations.</p></div> }
function Audit() { return <div className="placeholder"><ShieldCheck size={42} /><h1>Execution & Audit</h1><p>Authorization, execution status and immutable planning decisions will be tracked here.</p></div> }

createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>)
