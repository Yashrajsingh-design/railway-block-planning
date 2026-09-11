import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  ListChecks,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrainFront,
  TriangleAlert,
  UserCircle,
  Wifi,
} from 'lucide-react'

import './styles.css'

import {
  getDashboardOverview,
  type DashboardOverview,
} from './api/dashboard'

import {
  getPlanExplanations,
  type PlanExplanationsResponse,
} from './api/recommendations'


// ============================================================
// API
// ============================================================

const API = 'http://127.0.0.1:8000'

async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(API + path, options)

  if (!response.ok) {
    throw new Error(`${response.status}`)
  }

  return response.json()
}


// ============================================================
// REQUEST TYPES
// ============================================================

type RequestItem = {
  id: string
  department: string
  task: string
  asset: string
  section: string
  date: string
  start: string
  end: string
  duration: number
  blockType: string
  priority: number
  requestStatus: string
  authorizationStatus: string
  power: boolean
}


// ============================================================
// DEMO FALLBACK REQUESTS
// ============================================================

const mockRequests: RequestItem[] = [
  {
    id: 'REQ-2025-089',
    department: 'ENG · Track Machine',
    task: 'T00022 · Deep Screening Ballast',
    asset: 'Track S02-UP-KM48 (Continuous Welded Rail)',
    section: 'S02 (GZB - ALJN)',
    date: 'Today',
    start: '18:00',
    end: '20:00',
    duration: 120,
    blockType: 'Traffic Block',
    priority: 92,
    requestStatus: 'OPTIMIZED (In Plan)',
    authorizationStatus: 'Pending Controller Approval',
    power: false,
  },
  {
    id: 'REQ-2025-091',
    department: 'S&T · Signaling & Telecom',
    task: 'T00035 · Point Machine Overhaul',
    asset: 'Point 104A GZB Yard Interlock',
    section: 'S01 (Delhi Inbound)',
    date: 'Tmrw',
    start: '02:00',
    end: '04:00',
    duration: 120,
    blockType: 'Traffic Block',
    priority: 74,
    requestStatus: 'QUEUED FOR OPTIMIZATION',
    authorizationStatus: 'Not Submitted for Clearance',
    power: true,
  },
  {
    id: 'REQ-2025-093',
    department: 'TRD · Traction Distribution',
    task: 'T00042 · OHE inspection',
    asset: 'OHE Mast S03-KM17',
    section: 'S03 (ALJN - ETW)',
    date: 'Today',
    start: '21:00',
    end: '23:00',
    duration: 120,
    blockType: 'Power Block',
    priority: 84,
    requestStatus: 'VALIDATED',
    authorizationStatus: 'Not Submitted for Clearance',
    power: true,
  },
]


// ============================================================
// APP
// ============================================================

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  const [requests, setRequests] =
    useState<RequestItem[]>(mockRequests)

  const [connected, setConnected] =
    useState(false)

  useEffect(() => {
    api('/api/v1/database/health')
      .then(() => setConnected(true))
      .catch(() => setConnected(false))

    api<any[]>('/api/v1/requests')
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setRequests(
            data.map((x: any) => ({
              id: x.block_request_id,
              department: x.department_id,
              task: x.task_id,
              asset:
                x.asset_id ||
                'Asset linked to maintenance task',
              section: x.section_id,
              date: x.requested_date,
              start: x.preferred_start,
              end: x.preferred_end,
              duration: x.minimum_duration_min,
              blockType: x.block_type,
              priority: Number(x.priority_score || 0),
              requestStatus: x.request_status,
              authorizationStatus: x.authorization_status,
              power: Boolean(x.power_block_required),
            })),
          )
        }
      })
      .catch(() => {})
  }, [])

  const screen = location.pathname

  const navItems = [
    ['/','Overview',LayoutDashboard],
    ['/requests','Requests',ListChecks],
    ['/planner','Planner',CalendarDays],
    ['/recommended','Recommended',Sparkles],
    ['/audit','More / Audit',ShieldCheck],
  ] as const

  return (
    <div className="appShell">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="topbar">

        <div className="brand">

          <div className="brandMark">
            <TrainFront size={17} />
          </div>

          <div>
            <b>IR-ABPS</b>
            <span>SIH26027</span>
            <small>Northern Rly / DLI Div</small>
          </div>

        </div>

        <div className="topActions">

          <span className="env">
            ⌁ Synthetic Data | Demo Environment
          </span>

          <span className="live">
            LIVE 4.12
          </span>

          <button className="iconBtn">
            <Bell size={16} />
            <i />
          </button>

          <button className="profile">
            <UserCircle size={19} />
          </button>

        </div>

      </header>


      {/* =====================================================
          PAGE
      ===================================================== */}

      <main className="page">

        {screen === '/' && (
          <Overview
            connected={connected}
            onRequests={() => navigate('/requests')}
          />
        )}

        {screen === '/requests' && (
          <Requests
            requests={requests}
            onOpen={(request) =>
              navigate('/requests/' + request.id)
            }
            onNew={() =>
              navigate('/requests/new')
            }
          />
        )}

        {screen.startsWith('/requests/') && (
          <RequestDetail
            requests={requests}
            onBack={() => navigate('/requests')}
          />
        )}

        {screen === '/planner' && <Planner />}

        {screen === '/recommended' && <Recommended />}

        {screen === '/audit' && <Audit />}

      </main>


      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <nav className="bottomNav">

        {navItems.map(
          ([path, label, Icon]) => (
            <button
              key={path}
              className={
                screen === path ||
                (
                  path === '/requests' &&
                  screen.startsWith('/requests')
                )
                  ? 'active'
                  : ''
              }
              onClick={() => navigate(path)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ),
        )}

      </nav>

    </div>
  )
}


// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="sectionTitle">
      <h2>{children}</h2>
      {action}
    </div>
  )
}


// ============================================================
// OVERVIEW DASHBOARD
// ============================================================

function Overview({
  connected,
  onRequests,
}: {
  connected: boolean
  onRequests: () => void
}) {

  const [running, setRunning] =
    useState(false)

  const [result, setResult] =
    useState<any>(null)

  const [dashboard, setDashboard] =
    useState<DashboardOverview | null>(null)

  const [dashboardLoading, setDashboardLoading] =
    useState(true)

  const [dashboardError, setDashboardError] =
    useState(false)


  // ----------------------------------------------------------
  // LOAD REAL DASHBOARD DATA
  // ----------------------------------------------------------

  async function loadDashboard() {

    setDashboardLoading(true)
    setDashboardError(false)

    try {

      const data =
        await getDashboardOverview()

      setDashboard(data)

    } catch (error) {

      console.error(
        'Dashboard API error:',
        error,
      )

      setDashboardError(true)

    } finally {

      setDashboardLoading(false)

    }
  }


  // ----------------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------------

  useEffect(() => {
    loadDashboard()
  }, [])


  // ----------------------------------------------------------
  // RUN OPTIMIZATION
  // ----------------------------------------------------------

  const run = async () => {

    setRunning(true)

    try {

      const optimizationResult =
        await api<any>(
          '/api/v1/optimization/run',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              planning_date:
                '2026-09-02',
              block_type:
                'TRAFFIC',
            }),
          },
        )

      setResult(optimizationResult)

      // Refresh dashboard using
      // the latest optimizer result.
      await loadDashboard()

    } catch (error) {

      console.error(
        'Optimization error:',
        error,
      )

      setResult({
        status: 'DEMO',
        assigned_count: 6,
        total_priority: 444.8,
      })

    } finally {

      setRunning(false)

    }
  }


  // ----------------------------------------------------------
  // DASHBOARD VALUES
  // ----------------------------------------------------------

  const critical =
    dashboard?.critical_maintenance ?? 0

  const overdue =
    dashboard?.overdue_tasks ?? 0

  const windows =
    dashboard?.clear_windows ?? 0

  const requests =
    dashboard?.block_requests ?? 0

  const allocated =
    result?.assigned_count ??
    dashboard?.allocated_plan ??
    0

  const restrictions =
    dashboard?.restrictions ?? 0


  // ----------------------------------------------------------
  // HEALTH VALUES
  // ----------------------------------------------------------

  const covered =
    dashboard?.planning_health
      .tasks_covered ?? 0

  const totalTasks =
    dashboard?.planning_health
      .total_tasks ?? 0

  const coverage =
    dashboard?.planning_health
      .coverage_percent ?? 0

  const criticalCoverage =
    dashboard?.planning_health
      .critical_coverage_percent ?? 0

  const overdueReduction =
    dashboard?.planning_health
      .overdue_reduction_percent ?? 0


  return (
    <>

      {/* =====================================================
          OPERATIONAL SECTION
      ===================================================== */}

      <div className="context">

        <div>

          <span className="eyebrow">
            OPERATIONAL SECTION
          </span>

          <b>
            S02: Ghaziabad → Tundla
          </b>

          <span className="select">
            ⌄
          </span>

          <p>
            <Clock3 size={12} />
            Horizon: 24h (Today)
          </p>

        </div>


        <div className="sync">

          <Wifi size={13} />

          {connected
            ? 'API Connected'
            : 'Demo Mode'}

          <button
            onClick={loadDashboard}
            title="Refresh dashboard"
          >
            <RefreshCw
              size={13}
              className={
                dashboardLoading
                  ? 'spin'
                  : ''
              }
            />
          </button>

        </div>

      </div>


      {/* =====================================================
          AI GUARDRAIL
      ===================================================== */}

      <div className="guardrail">

        <ShieldCheck size={19} />

        <div>

          <b>

            AI Planning Guardrail Active

            <span>
              Rule 4.12
            </span>

          </b>

          <small>
            AI recommends. Railway personnel
            review, modify and approve all
            corridor possession windows.
          </small>

        </div>

      </div>


      {/* =====================================================
          API ERROR
      ===================================================== */}

      {dashboardError && (

        <div className="dashboardError">

          <TriangleAlert size={14} />

          <span>
            Dashboard data could not be loaded
            from the planning server.
          </span>

          <button
            onClick={loadDashboard}
          >
            Retry
          </button>

        </div>

      )}


      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <div className="kpis">

        <Kpi
          title="Critical Maint."
          value={
            dashboardLoading
              ? '—'
              : critical
          }
          note="Priority ≥ 80"
          tone="danger"
          badge={`${critical} Urgent`}
        />


        <Kpi
          title="Overdue Tasks"
          value={
            dashboardLoading
              ? '—'
              : overdue
          }
          note="Maintenance overdue"
          tone="warn"
          badge={`${overdue} Alerts`}
        />


        <Kpi
          title="Clear Windows"
          value={
            dashboardLoading
              ? '—'
              : windows
          }
          note="Available 120+ min"
          tone="good"
          badge={`${windows} Slots`}
        />


        <Kpi
          title="Block Requests"
          value={
            dashboardLoading
              ? '—'
              : requests
          }
          note="Active requests"
          tone="neutral"
          badge={`${requests} Active`}
        />


        <Kpi
          title="Allocated Plan"
          value={
            dashboardLoading
              ? '—'
              : allocated
          }
          note={
            dashboard?.optimizer_status ===
            'OPTIMAL'
              ? 'Optimizer: Optimal'
              : 'Awaiting optimization'
          }
          tone="good"
          badge={
            dashboard?.optimizer_status ===
            'OPTIMAL'
              ? 'Optimal'
              : 'Ready'
          }
        />


        <Kpi
          title="Restrictions"
          value={
            dashboardLoading
              ? '—'
              : restrictions
          }
          note="Active corridor restrictions"
          tone="warn"
          badge={`${restrictions} Active`}
        />

      </div>


      {/* =====================================================
          CORRIDOR STRIP
      ===================================================== */}

      <SectionTitle
        action={
          <span className="tinyTag">
            UP & DN Lines
          </span>
        }
      >
        Corridor Operational Strip
      </SectionTitle>


      <div className="timeline">

        <div className="legend">

          <span>
            <i className="dot train" />
            Express & Freight
          </span>

          <span>
            <i className="dot maint" />
            Planned Maint.
          </span>

          <span>
            <i className="dot conflict" />
            Conflict
          </span>

          <span>
            <i className="dot restr" />
            TSR / Caution
          </span>

          <span>
            <i className="dot free" />
            Free Window
          </span>

        </div>


        <div className="hours">

          {[
            '12',
            '13',
            '14',
            '15',
            '16',
            '17',
            '18',
            '19',
            '20',
            '21',
            '22',
            '23',
          ].map((hour) => (

            <span key={hour}>
              {hour}:00
            </span>

          ))}

        </div>


        <Track
          name="UP Main (Track 1)"
          items={[
            [
              '13:10',
              '15:00',
              '#dce5f5',
              'UP 12306 Shatabdi',
            ],
            [
              '14:00',
              '15:00',
              'conf',
              'Overlap!',
            ],
            [
              '18:00',
              '20:00',
              'maint',
              'ENG Gang R01 (Temp)',
            ],
            [
              '21:00',
              '23:00',
              'free',
              'Open Window (120m)',
            ],
          ]}
        />


        <Track
          name="DN Main (Track 2)"
          items={[
            [
              '14:30',
              '15:30',
              'restr',
              'PSR 30k (km42)',
            ],
            [
              '17:00',
              '20:00',
              'train',
              '#12410 Gomti Exp',
            ],
            [
              '20:30',
              '22:30',
              'train',
              'CONCOR Freight',
            ],
          ]}
        />


        <div className="timelineAlert">

          <TriangleAlert size={14} />

          Overlap: UP Track km 48.2
          (14:30). Shatabdi trail headway breach.

          <button>
            Resolve
          </button>

        </div>

      </div>


      {/* =====================================================
          PLANNING HEALTH
      ===================================================== */}

      <div className="healthCard">

        <div className="healthCircle">

          {dashboardLoading
            ? '—'
            : `${Math.round(coverage)}%`}

          <small>
            HEALTH
          </small>

        </div>


        <div className="healthStats">

          <div>

            <span>
              Tasks Covered
            </span>

            <b>
              {dashboardLoading
                ? '—'
                : `${covered} / ${totalTasks}`}
            </b>

            <em>

              Overdue Reduction{' '}

              <strong>
                {dashboardLoading
                  ? '—'
                  : `${overdueReduction}%`}
              </strong>

            </em>

          </div>


          <div>

            <span>
              Critical Coverage
            </span>

            <b>
              {dashboardLoading
                ? '—'
                : `${criticalCoverage}%`}
            </b>

            <em>

              Optimizer Status{' '}

              <strong>
                {dashboard?.optimizer_status ?? '—'}
              </strong>

            </em>

          </div>

        </div>


        <span className="grade">

          {dashboard?.optimizer_status ===
          'OPTIMAL'
            ? 'Optimal Grade A'
            : 'Planning Ready'}

        </span>

      </div>


      {/* =====================================================
          NETWORK TOPOLOGY
      ===================================================== */}

      <div className="topology">

        <div>

          <small>
            SIMULATED NETWORK TOPOLOGY
          </small>

          <b>
            GZB → ALJN → TDL Automatic Territory
          </b>

        </div>

        <span>
          194.5 Km
        </span>

      </div>


      {/* =====================================================
          OPTIMIZATION BUTTON
      ===================================================== */}

      <button
        className="runBtn"
        onClick={run}
        disabled={running}
      >

        {running ? (

          <>
            <RefreshCw
              className="spin"
              size={17}
            />

            Running Optimization Engine...

          </>

        ) : (

          <>
            <Sparkles size={17} />

            Run Optimization Engine

          </>

        )}

      </button>


      {/* =====================================================
          RECOMMENDATIONS
      ===================================================== */}

      <button
        className="recommendBtn"
        onClick={onRequests}
      >

        <Sparkles size={13} />

        Review{' '}

        {dashboard?.allocated_plan ?? 0}

        {' '}New Recommendations

        <b>
          {dashboard?.candidate_pairs ?? 0}
        </b>

      </button>


      {/* =====================================================
          DEMO NOTE
      ===================================================== */}

      <div className="demoNote">

        <Activity size={12} />

        Planning data from PostgreSQL ·
        SIH26027 Synthetic Build

      </div>

    </>
  )
}


// ============================================================
// KPI
// ============================================================

function Kpi({
  title,
  value,
  note,
  tone,
  badge,
}: {
  title: string
  value: React.ReactNode
  note: string
  tone: string
  badge: string
}) {
  return (

    <div className={'kpi ' + tone}>

      <div>

        <span>
          {title}
        </span>

        <b>
          {value}
        </b>

        <small>
          {note}
        </small>

      </div>

      <em>
        {badge}
      </em>

    </div>

  )
}


// ============================================================
// TRACK TIMELINE
// ============================================================

function Track({
  name,
  items,
}: {
  name: string
  items: string[][]
}) {

  return (

    <div className="track">

      <b>
        {name}
      </b>

      <div className="trackArea">

        {items.map(
          ([start, end, className, text], index) => {

            const startHour =
              parseInt(start)

            const endHour =
              parseInt(end)

            return (

              <div
                key={index}
                className={
                  'bar ' + className
                }
                style={{
                  left:
                    `${(startHour - 12) * 8.33}%`,
                  width:
                    `${Math.max(
                      5,
                      (endHour - startHour) * 8.33,
                    )}%`,
                }}
              >

                {text}

              </div>

            )
          },
        )}

      </div>

    </div>

  )
}


// ============================================================
// REQUESTS
// ============================================================

function Requests({
  requests,
  onOpen,
  onNew,
}: {
  requests: RequestItem[]
  onOpen: (request: RequestItem) => void
  onNew: () => void
}) {

  return (

    <>

      <div className="requestHead">

        <div>

          <h1>

            My Block Requests

            <small>
              {requests.length} Total
            </small>

          </h1>

          <p>
            ↔ DLI-GZB-ALJN Slot Window:
            Night corridor opens 23:30 IST
          </p>

        </div>


        <button
          className="newBtn"
          onClick={onNew}
        >
          ＋ New Block
        </button>

      </div>


      <div className="searchRow">

        <div className="search">

          <Search size={16} />

          <input
            placeholder="Search Task, Block ID, KM mark..."
          />

        </div>


        <div className="deptTabs">

          <button>ENG</button>
          <button>S&T</button>
          <button>TRD</button>

        </div>

      </div>


      <div className="filters">

        {[
          `All (${requests.length})`,
          'Draft (1)',
          'Validated (2)',
          'Queued (3)',
          'Optimized (4)',
          'Approved (2)',
        ].map((text, index) => (

          <button
            className={
              index === 0
                ? 'selected'
                : ''
            }
            key={text}
          >
            {text}
          </button>

        ))}

      </div>


      <div className="dual">

        <b>
          ⓘ DUAL GUARDRAIL ARCHITECTURE
        </b>

        <span>

          Algorithmic Optimization checks
          track conflicts, but a block is{' '}

          <strong>
            NOT AUTHORIZED
          </strong>

          {' '}until formally granted by
          the Section Controller (SCR).

        </span>

      </div>


      <div className="cards">

        {requests.map((request) => (

          <RequestCard
            key={request.id}
            r={request}
            onOpen={() =>
              onOpen(request)
            }
          />

        ))}

      </div>

    </>
  )
}


// ============================================================
// REQUEST CARD
// ============================================================

function RequestCard({
  r,
  onOpen,
}: {
  r: RequestItem
  onOpen: () => void
}) {

  return (

    <article className="requestCard">

      <div className="reqTop">

        <div>

          <span className="dept">
            {r.department}
          </span>

          <b>
            {r.id}
          </b>

        </div>


        <span
          className={
            'priority ' +
            (r.priority >= 85
              ? 'critical'
              : 'high')
          }
        >
          ●{' '}
          {r.priority >= 85
            ? 'CRITICAL'
            : 'HIGH'}
        </span>

      </div>


      <div className="taskLine">

        <b>
          {r.task}
        </b>

        <span>
          Asset: {r.asset}
        </span>

      </div>


      <div className="reqGrid">

        <span>
          ⌖ {r.section}
        </span>

        <span>
          ◷ {r.date} {r.start} - {r.end}
        </span>

      </div>


      <div className="reqMeta">

        <span>
          Window: {r.duration} mins
        </span>

        <span>
          {r.blockType}
          {' '}
          (Power: {r.power ? 'Yes' : 'No'})
        </span>

      </div>


      <div className="state">

        <span>
          ⚙ Request State:
        </span>

        <b>
          {r.requestStatus}
        </b>

      </div>


      <div className="state">

        <span>
          ◉ SCR Clearance:
        </span>

        <em>
          {r.authorizationStatus}
        </em>

      </div>


      <div className="cardActions">

        <button onClick={onOpen}>
          View Pre-Check
        </button>

        <button onClick={onOpen}>
          Track Status
        </button>

      </div>

    </article>
  )
}


// ============================================================
// REQUEST DETAIL
// ============================================================

function RequestDetail({
  requests,
  onBack,
}: {
  requests: RequestItem[]
  onBack: () => void
}) {

  const request =
    requests[0]

  const [pre, setPre] =
    useState<any>(null)

  const [loading, setLoading] =
    useState(false)


  const run = async () => {

    setLoading(true)

    try {

      const result =
        await api<any>(
          '/api/v1/precheck',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              department_id: 'ENG',
              section_id: 'S02',
              location_id: 'L00002',
              asset_id: 'A00002',
              maintenance_task_id: 'T00002',
              preferred_date:
                '2026-09-02',
              preferred_start_time:
                '14:00',
              preferred_end_time:
                '16:30',
              minimum_duration_minutes:
                120,
              block_type:
                'TRAFFIC',
              power_block_required:
                true,
              resource_ids: ['R01'],
            }),
          },
        )

      setPre(result)

    } catch {

      setPre({
        status: 'WARNING',
        checks_total: 7,
        checks_passed: 6,
        warnings: 1,
        blocks: 0,
        suggested_windows: [],
      })

    } finally {

      setLoading(false)

    }
  }


  return (

    <>

      <button
        className="back"
        onClick={onBack}
      >

        <ArrowLeft size={17} />

        Request Detail

        <span>
          IR-ABPS · DLI Div
        </span>

      </button>


      <div className="steps">

        <b>
          ✓
          <small>
            Details
          </small>
        </b>

        <b className="current">
          2
          <small>
            Time & Block
          </small>
        </b>

        <b>
          3
          <small>
            Pre-check
          </small>
        </b>

        <b>
          4
          <small>
            Submit
          </small>
        </b>

      </div>


      <div className="detailHero">

        <div>

          <span>
            T00022
          </span>

          <span>
            ENG Dept
          </span>

          <h2>
            Track UP-S02-KM48
            (Turnout 12A)
          </h2>

          <p>
            Ultrasonic Flaw Detection
            (USFD) micro-crack detected.
            Immediate block maintenance
            mandated.
          </p>

        </div>


        <em>
          ⚠ Score 92/100 · Overdue 2d
        </em>

      </div>


      <section className="formCard">

        <div className="formHead">

          <h2>
            Block Specifications
          </h2>

          <span>
            ⇄ Step 2 of 4
          </span>

        </div>


        <label>

          OPERATIONAL SECTION

          <div className="field locked">
            ⚯ Section S02
            (Ghaziabad - Aligarh)
            <span>🔒</span>
          </div>

        </label>


        <div className="two">

          <label>

            PREFERRED DATE

            <div className="field">
              ▣ Today (24 Oct)
            </div>

          </label>


          <label>

            BLOCK TARGET

            <div className="field">

              <b>
                150 min
              </b>

              <small>
                Min: 120m
              </small>

            </div>

          </label>

        </div>


        <label>

          PREFERRED TIME WINDOW

          <div className="two">

            <div className="field">
              Start
              <b>14:00</b>
              ◷
            </div>

            <div className="field">
              End
              <b>16:30</b>
              ◷
            </div>

          </div>

        </label>


        <label>

          BLOCK TYPE

          <div className="seg">

            <button>
              Traffic
            </button>

            <button>
              Power
            </button>

            <button className="active">
              Integrated
            </button>

          </div>

        </label>


        <div className="toggle">

          <b>
            ϟ 25kV OHE Power Isolation
          </b>

          <span>
            Requires Traction Substation Permit
            <i>●</i>
          </span>

          <button>
            ●
          </button>

        </div>


        <label>

          ALLOCATED GANG & ROLLING PLANT

          <div className="chips">

            <span>
              Gang R01 (P-Way) ×
            </span>

            <span>
              BCM Machine 614 ×
            </span>

            <span>
              S&T Escort ×
            </span>

            <button>
              ＋ Add
            </button>

          </div>

        </label>


        <label>

          METHODOLOGY & TSR PLAN

          <div className="textarea">
            Deep screening and sleeper
            renewal under cautionary
            speed (30 km/h).
          </div>

        </label>


        <button
          className="runPre"
          onClick={run}
        >

          {loading ? (
            <RefreshCw className="spin" />
          ) : (
            <Sparkles size={16} />
          )}

          Run Smart Pre-Check

        </button>


        <small className="helper">

          ⟳ Simulates dynamic conflict
          solver against live IR timetable,
          scheduled rakes, and speed
          restrictions.

        </small>

      </section>


      <div className="feas">

        <b>
          ● Live Feasibility Result
        </b>

        {pre && (

          <span>

            {pre.status}
            {' · '}
            {pre.checks_passed}/
            {pre.checks_total}
            {' checks passed · '}
            {pre.blocks}
            {' blocking conflicts'}

          </span>

        )}

        <em>
          {pre
            ? `${pre.status}`
            : 'Awaiting pre-check'}
          ⌄
        </em>

      </div>

    </>
  )
}


// ============================================================
// PLACEHOLDER SCREENS
// ============================================================

function Planner() {

  return (

    <div className="placeholder">

      <CalendarDays size={42} />

      <h1>
        Block Planner
      </h1>

      <p>
        Timeline planning surface is next.
        It will consume COA windows, train
        events, restrictions, resources and
        optimizer assignments.
      </p>

      <button className="runBtn">
        Open Planning Horizon
      </button>

    </div>

  )
}




function Recommended() {
  const [data, setData] = useState<PlanExplanationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadRecommendations() {
    try {
      setLoading(true)
      setError(null)

      const result = await getPlanExplanations()
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load recommended plan.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecommendations()
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="pageHeader">
          <div>
            <div className="eyebrow">AI PLANNING</div>
            <h1>Recommended Plan</h1>
            <p>Generating an explainable maintenance plan...</p>
          </div>
        </div>

        <div className="placeholder">
          <Sparkles size={42} />
          <h2>Running optimizer</h2>
          <p>
            Checking corridor windows, restrictions, conflicts,
            dependencies and resource availability.
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page">
        <div className="pageHeader">
          <div>
            <div className="eyebrow">AI PLANNING</div>
            <h1>Recommended Plan</h1>
            <p>Explainable optimizer recommendations</p>
          </div>
        </div>

        <div className="errorCard">
          <strong>Could not load recommendations</strong>
          <p>{error ?? 'No planning data was returned.'}</p>

          <button
            className="primaryButton"
            onClick={loadRecommendations}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const sortedAssignments = [...data.assignments].sort(
    (a, b) =>
      a.start_time.localeCompare(b.start_time) ||
      a.section_id.localeCompare(b.section_id),
  )

  const topExplanations = data.explanations.slice(0, 12)

  const reasonLabel: Record<string, string> = {
    NO_SUITABLE_WINDOW: 'No suitable window',
    BLOCK_CONFLICT: 'Block conflict',
    HIGH_RESTRICTION: 'High restriction',
    OPTIMIZER_CAPACITY: 'Optimizer capacity',
    TRAIN_CONFLICT: 'Train conflict',
  }

  const formatTime = (value: string) => value.slice(0, 5)

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="eyebrow">AI PLANNING</div>
          <h1>Recommended Plan</h1>
          <p>
            Explainable maintenance plan for{' '}
            {data.planning_date} · {data.block_type} block
          </p>
        </div>

        <button
          className="secondaryButton"
          onClick={loadRecommendations}
        >
          Refresh Plan
        </button>
      </div>

      <div className="recommendationSummary">
        <div className="summaryMain">
          <div className="summaryIcon">
            <Sparkles size={24} />
          </div>

          <div>
            <div className="eyebrow">OPTIMIZER RESULT</div>
            <h2>{data.assigned_count} tasks allocated</h2>
            <p>
              The optimizer found the best feasible allocation
              for the selected planning horizon.
            </p>
          </div>
        </div>

        <div className="summaryStats">
          <div>
            <span>Allocated</span>
            <strong>{data.assigned_count}</strong>
          </div>

          <div>
            <span>Unscheduled</span>
            <strong>{data.unscheduled_count}</strong>
          </div>

          <div>
            <span>Total priority</span>
            <strong>{data.total_priority.toFixed(1)}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong className="successText">{data.status}</strong>
          </div>
        </div>
      </div>

      <section className="contentSection">
        <div className="sectionHeading">
          <div>
            <div className="eyebrow">RECOMMENDED ALLOCATION</div>
            <h2>Recommended Block Plan</h2>
          </div>

          <span className="countBadge">
            {data.assigned_count} tasks
          </span>
        </div>

        <div className="planAssignmentList">
          {sortedAssignments.map((item) => (
            <div
              className="planAssignmentCard"
              key={item.task_id}
            >
              <div className="planAssignmentTime">
                <strong>{formatTime(item.start_time)}</strong>
                <span>to</span>
                <strong>{formatTime(item.end_time)}</strong>
              </div>

              <div className="planAssignmentMain">
                <div className="recommendationTop">
                  <div>
                    <strong>{item.task_id}</strong>

                    <span className="sectionTag">
                      {item.section_id}
                    </span>

                    <span className="resourceTag">
                      {item.resource_id}
                    </span>
                  </div>

                  <span className="priorityBadge">
                    Priority {item.priority_score.toFixed(1)}
                  </span>
                </div>

                <div className="assignmentDetails">
  <span>Window {item.window_id}</span>

  <span>{item.duration_min} min</span>

 {(item.restriction_penalty ?? 0) > 0 && (
      <span className="restrictionWarning">
        Restriction penalty {item.restriction_penalty}
      </span>
    )}
</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="contentSection">
        <div className="sectionHeading">
          <div>
            <div className="eyebrow">DECISION SUPPORT</div>
            <h2>Why tasks were not scheduled</h2>
          </div>

          <span className="countBadge">
            {data.explanations.length} tasks
          </span>
        </div>

        <div className="recommendationList">
          {topExplanations.map((item) => (
            <div
              className="recommendationCard"
              key={item.task_id}
            >
              <div className="recommendationTop">
                <div>
                  <strong>{item.task_id}</strong>

                  <span className="sectionTag">
                    {item.section_id}
                  </span>
                </div>

                <span className="priorityBadge">
                  Priority {item.priority_score.toFixed(1)}
                </span>
              </div>

              <div className="reasonRow">
                <span className="reasonBadge">
                  {reasonLabel[item.reason_code] ??
                    item.reason_code}
                </span>
              </div>

              <p>{item.reason}</p>
          {item.best_alternative && (
            <div className="alternativeBox">
              <div className="alternativeHeader">
                <span className="alternativeLabel">
                  BEST ALTERNATIVE
                </span>

                <span className="alternativeWindow">
                  {item.best_alternative.window_id}
                </span>
              </div>

              <div className="alternativeDetails">
                <strong>
                  {formatTime(item.best_alternative.start_time)}
                  {' '}to{' '}
                  {formatTime(item.best_alternative.end_time)}
                </strong>

                <span>
                  {item.best_alternative.duration_min} min
                </span>

                {(item.best_alternative.restriction_penalty ?? 0) > 0 && (
                    <span className="restrictionWarning">
                      Restriction penalty{' '}
                      {item.best_alternative.restriction_penalty}
                    </span>
                  )}
              </div>
            </div>
          )}
            </div>
          ))}
        </div>

        {data.explanations.length > 12 && (
          <div className="moreNotice">
            Showing the 12 highest-priority unscheduled tasks.
            Additional explanations are available from the planning
            API.
          </div>
        )}
      </section>
    </div>
  )
}



function Audit() {

  return (

    <div className="placeholder">

      <ShieldCheck size={42} />

      <h1>
        Execution & Audit
      </h1>

      <p>
        Authorization, execution status and
        immutable planning decisions will be
        tracked here.
      </p>

    </div>

  )
}


// ============================================================
// MOUNT APP
// ============================================================

createRoot(
  document.getElementById('root')!,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)