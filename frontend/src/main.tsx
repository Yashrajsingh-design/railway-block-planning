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

import {
  runPreCheck,
  type PreCheckResponse,
} from './api/precheck'

// ============================================================
// API
// ============================================================

type PlanAssignment = {
  task_id: string;
  section_id: string;
  window_id: string;
  resource_id: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  priority_score: number;
  restriction_penalty?: number;
};

type PlanExplanation = {
  task_id: string;
  section_id: string;
  priority_score: number;
  reason_code: string;
  reason: string;
  best_alternative?: {
    start_time: string;
    end_time: string;
    score: number;
    reason: string;
  } | null;
  alternatives?: {
    start_time: string;
    end_time: string;
    score: number;
    reason: string;
  }[];
};

type PlanResponse = {
  planning_date: string;
  block_type: string;
  status: string;
  candidate_pairs: number;
  assigned_count: number;
  total_priority: number;
  assignments: PlanAssignment[];
  unscheduled_count: number;
  explanations: PlanExplanation[];
};


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
  assetId?: string
  locationId?: string
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
              assetId: x.asset_id,
              locationId: x.location_id,
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

        {screen.startsWith('/requests/') && screen !== '/requests/new' && (
          <RequestDetail
            requests={requests}
            onBack={() => navigate('/requests')}
            onUpdated={(updated) => {
              setRequests((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              )
            }}
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
  onUpdated,
}: {
  requests: RequestItem[]
  onBack: () => void
  onUpdated: (updated: RequestItem) => void
}) {
  const location = useLocation()

  const requestId =
    location.pathname.split('/').filter(Boolean).pop() ?? ''

  const request =
    requests.find((item) => item.id === requestId)

  const [preferredDate, setPreferredDate] =
    useState(request?.date ?? '2026-09-02')

  const [startTime, setStartTime] =
    useState(request?.start ?? '18:00')

  const [endTime, setEndTime] =
    useState(request?.end ?? '20:00')

  const [minimumDuration, setMinimumDuration] =
    useState(request?.duration ?? 120)

  const [blockType, setBlockType] =
    useState(
      request?.blockType
        ?.toUpperCase()
        .replace(' BLOCK', '') ?? 'TRAFFIC',
    )

  const [powerBlock, setPowerBlock] =
    useState(request?.power ?? false)

  const [resourceIds, setResourceIds] =
    useState<string[]>(
      request?.department === 'ENG'
        ? ['R01']
        : request?.department === 'SNT'
          ? ['R02']
          : ['R03'],
    )

  const [pre, setPre] =
    useState<PreCheckResponse | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [submitting, setSubmitting] =
    useState(false)

  useEffect(() => {
    if (!request) return

    setPreferredDate(request.date ?? '2026-09-02')
    setStartTime(request.start ?? '18:00')
    setEndTime(request.end ?? '20:00')
    setMinimumDuration(request.duration ?? 120)
    setBlockType(
      request.blockType
        ?.toUpperCase()
        .replace(' BLOCK', '') ?? 'TRAFFIC',
    )
    setPowerBlock(Boolean(request.power))
    setResourceIds(
      request.department === 'ENG'
        ? ['R01']
        : request.department === 'SNT'
          ? ['R02']
          : ['R03'],
    )
    setPre(null)
    setError(null)
  }, [request?.id])

  if (!request) {
    return (
      <div className="placeholder">
        <h1>Request not found</h1>
        <p>
          The selected block request could not be loaded.
        </p>

        <button
          className="runBtn"
          onClick={onBack}
        >
          Back to Requests
        </button>
      </div>
    )
  }

  const taskId =
    request.task.split('·')[0].trim()

  const departmentId =
    request.department.split('·')[0].trim()

  const sectionId =
    request.section
      .split(' ')[0]
      .trim()

  const locationId = request.locationId
  const assetId = request.assetId

  const run = async () => {
    setLoading(true)
    setError(null)
    setPre(null)

    try {
      const result = await runPreCheck({
        block_request_id: request.id,
        department_id: departmentId,
        section_id: sectionId,
        location_id: locationId,
        asset_id: assetId,
        maintenance_task_id: taskId,
        preferred_date: preferredDate,
        preferred_start_time: startTime,
        preferred_end_time: endTime,
        minimum_duration_minutes: minimumDuration,
        block_type: blockType,
        power_block_required: powerBlock,
        resource_ids: resourceIds,
      })

      setPre(result)
    } catch (err) {
      console.error('Pre-check error:', err)

      setError(
        'Could not reach the planning server. Check that the backend is running.',
      )
    } finally {
      setLoading(false)
    }
  }

  const submitRequest = async () => {
    if (!pre?.can_submit) return

    setSubmitting(true)
    setError(null)

    try {
      const updated = await api<any>(
        `/api/v1/requests/${request.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'VALIDATED' }),
        },
      )

      const updatedRequest: RequestItem = {
        ...request,
        requestStatus: updated.request_status ?? 'VALIDATED',
        authorizationStatus:
          updated.authorization_status ?? request.authorizationStatus,
      }

      onUpdated(updatedRequest)
      setPre(null)
      alert(`Request ${request.id} submitted and validated.`)
    } catch (err) {
      console.error('Submit request error:', err)
      setError(
        'The request could not be submitted. The lifecycle service rejected the transition.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const toggleResource = (resourceId: string) => {
    setResourceIds((current) =>
      current.includes(resourceId)
        ? current.filter((id) => id !== resourceId)
        : [...current, resourceId],
    )
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
        <b className="done">
          ✓
          <small>Details</small>
        </b>

        <b className={!pre ? 'current' : 'done'}>
          {!pre ? '2' : '✓'}
          <small>Time & Block</small>
        </b>

        <b className={pre ? (pre.can_submit ? 'done' : 'current') : ''}>
          {pre?.can_submit ? '✓' : '3'}
          <small>Pre-check</small>
        </b>

        <b className={pre?.can_submit ? 'current' : ''}>
          4
          <small>Submit</small>
        </b>
      </div>

      <div className="detailHero">
        <div>
          <span>{taskId}</span>
          <span>{request.department}</span>

          <h2>
            {request.asset}
          </h2>

          <p>
            Maintenance task {taskId} for
            {' '}
            {request.section}.
          </p>
        </div>

        <em>
          ⚠ Score {request.priority}/100
        </em>
      </div>

      <section className="formCard">

        <div className="formHead">
          <h2>
            Block Specifications
          </h2>

          <span>
            Step 2 of 4
          </span>
        </div>

        {/* SECTION */}

        <label>
          OPERATIONAL SECTION

          <div className="field locked">
            {request.section}
            <span>🔒</span>
          </div>
        </label>

        {/* DATE + DURATION */}

        <div className="two">

          <label>
            PREFERRED DATE

            <input
              className="fieldInput"
              type="date"
              value={preferredDate}
              onChange={(event) =>
                setPreferredDate(event.target.value)
              }
            />
          </label>

          <label>
            MINIMUM DURATION

            <div className="numberField">
              <input
                type="number"
                min={1}
                max={1440}
                value={minimumDuration}
                onChange={(event) =>
                  setMinimumDuration(
                    Number(event.target.value),
                  )
                }
              />

              <span>minutes</span>
            </div>
          </label>

        </div>

        {/* TIME */}

        <label>
          PREFERRED TIME WINDOW

          <div className="two">

            <input
              className="fieldInput"
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
            />

            <input
              className="fieldInput"
              type="time"
              value={endTime}
              onChange={(event) =>
                setEndTime(event.target.value)
              }
            />

          </div>
        </label>

        {/* BLOCK TYPE */}

        <label>
          BLOCK TYPE

          <div className="seg">

            {[
              ['TRAFFIC', 'Traffic'],
              ['POWER', 'Power'],
              ['INTEGRATED', 'Integrated'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  blockType === value
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setBlockType(value)
                }
              >
                {label}
              </button>
            ))}

          </div>
        </label>

        {/* POWER */}

        <div className="toggle">

          <div>
            <b>
              ⚡ 25kV OHE Power Isolation
            </b>

            <span>
              Requires Traction Substation Permit
            </span>
          </div>

          <button
            type="button"
            className={
              powerBlock
                ? 'toggleButton active'
                : 'toggleButton'
            }
            onClick={() =>
              setPowerBlock((current) => !current)
            }
          >
            {powerBlock ? 'ON' : 'OFF'}
          </button>

        </div>

        {/* RESOURCES */}

        <label>
          ALLOCATED RESOURCES

          <div className="chips">

            {['R01', 'R02', 'R03'].map(
              (resourceId) => (
                <button
                  key={resourceId}
                  type="button"
                  className={
                    resourceIds.includes(resourceId)
                      ? 'resourceChip active'
                      : 'resourceChip'
                  }
                  onClick={() =>
                    toggleResource(resourceId)
                  }
                >
                  {resourceId}
                  {' '}
                  {resourceIds.includes(resourceId)
                    ? '✓'
                    : '+'}
                </button>
              ),
            )}

          </div>
        </label>

        {/* PRE-CHECK */}

        <button
          className="runPre"
          onClick={run}
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw
                className="spin"
                size={16}
              />

              Checking...
            </>
          ) : (
            <>
              <Sparkles size={16} />

              Run Smart Pre-Check
            </>
          )}
        </button>

        <small className="helper">
          Checks timetable conflicts, corridor windows,
          restrictions, existing blocks and resource
          availability before submission.
        </small>

      </section>

      {/* ERROR */}

      {error && (
        <div className="precheckError">
          <TriangleAlert size={16} />

          <span>{error}</span>
        </div>
      )}

      {/* RESULT */}

      {pre && (
        <section className="precheckResult">

          <div className="precheckHeader">

            <div>
              <span className="eyebrow">
                SMART PRE-CHECK
              </span>

              <h2>
                {pre.status === 'BLOCKED'
                  ? 'Request cannot be submitted yet'
                  : pre.status === 'WARNING'
                    ? 'Request can be submitted with warnings'
                    : 'Request passed pre-check'}
              </h2>
            </div>

            <strong
              className={
                pre.status === 'BLOCKED'
                  ? 'statusBlocked'
                  : pre.status === 'WARNING'
                    ? 'statusWarning'
                    : 'statusClear'
              }
            >
              {pre.status}
            </strong>

          </div>

          <div className="precheckStats">

            <div>
              <b>
                {pre.checks_passed}/{pre.checks_total}
              </b>

              <span>
                Checks passed
              </span>
            </div>

            <div>
              <b>{pre.warnings}</b>

              <span>
                Warnings
              </span>
            </div>

            <div>
              <b>{pre.blocks}</b>

              <span>
                Blocking conflicts
              </span>
            </div>

          </div>

          {pre.issues.length > 0 && (
            <div className="precheckIssues">

              <h3>
                Issues detected
              </h3>

              {pre.issues.map((issue) => (
                <div
                  key={`${issue.code}-${issue.message}`}
                  className={
                    issue.severity === 'BLOCK'
                      ? 'precheckIssue block'
                      : 'precheckIssue warning'
                  }
                >
                  <TriangleAlert size={15} />

                  <div>
                    <b>
                      {issue.code}
                    </b>

                    <p>
                      {issue.message}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          )}

          {pre.suggested_windows.length > 0 && (
            <div className="suggestedWindows">

              <h3>
                Suggested Windows
              </h3>

              <p>
                The system found these alternative
                corridor windows for the requested work.
              </p>

              <div className="windowOptions">

                {pre.suggested_windows.map(
                  (window) => (
                    <button
                      key={`${window.start_time}-${window.end_time}`}
                      type="button"
                      onClick={() => {
                        setStartTime(
                          window.start_time.slice(0, 5),
                        )

                        setEndTime(
                          window.end_time.slice(0, 5),
                        )

                        setPre(null)
                      }}
                    >
                      <b>
                        {window.start_time.slice(0, 5)}
                        {' – '}
                        {window.end_time.slice(0, 5)}
                      </b>

                      <span>
                        Score {window.score}
                      </span>

                      <small>
                        {window.reason}
                      </small>
                    </button>
                  ),
                )}

              </div>

            </div>
          )}

          <div className="submitGuardrail">

            <ShieldCheck size={18} />

            <span>
              Pre-check is advisory. Final track possession
              still requires formal railway authorization.
            </span>

          </div>

          {pre.can_submit && (
            <div className="submitAction">
              <div>
                <strong>Step 4: Submit Request</strong>
                <span>
                  Pre-check passed. This submits the request into the planning lifecycle.
                </span>
              </div>

              <button
                type="button"
                className="runPre"
                onClick={submitRequest}
                disabled={submitting || request.requestStatus === 'VALIDATED'}
              >
                {submitting
                  ? 'Submitting...'
                  : request.requestStatus === 'VALIDATED'
                    ? 'Already Validated'
                    : 'Submit Request'}
              </button>
            </div>
          )}

        </section>
      )}

    </>
  )
}


// ============================================================
// PLACEHOLDER SCREENS
// ============================================================
function Planner() {
  const [data, setData] =
    useState<PlanExplanationsResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadPlan() {
    try {
      setLoading(true)
      setError(null)

      const result = await getPlanExplanations()
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load planning data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlan()
  }, [])

  if (loading) {
    return (
      <div className="page">

        <div className="pageHeader">
          <div>
            <div className="eyebrow">
              BLOCK PLANNER
            </div>

            <h1>Planning Horizon</h1>

            <p>
              Building the maintenance block timeline...
            </p>
          </div>
        </div>

        <div className="placeholder">

          <CalendarDays size={42} />

          <h2>Loading plan</h2>

          <p>
            Checking optimizer assignments,
            corridor windows and operational
            constraints.
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
            <div className="eyebrow">
              BLOCK PLANNER
            </div>

            <h1>Planning Horizon</h1>

            <p>
              Unable to load the current planning result.
            </p>
          </div>

        </div>

        <div className="errorCard">

          <strong>
            Could not load planning data
          </strong>

          <p>
            {error ?? 'No planning data was returned.'}
          </p>

          <button
            className="primaryButton"
            onClick={loadPlan}
          >
            Retry
          </button>

        </div>

      </div>
    )
  }

  const assignments = [...data.assignments].sort(
    (a, b) =>
      a.start_time.localeCompare(b.start_time) ||
      a.section_id.localeCompare(b.section_id),
  )

  const sections = [
    ...new Set(
      assignments.map(
        (item) => item.section_id,
      ),
    ),
  ]

  const timelineStart = 18 * 60
  const timelineEnd = 24 * 60
  const timelineDuration =
    timelineEnd - timelineStart

  const toMinutes = (value: string) => {
    const [hours, minutes] = value
      .slice(0, 5)
      .split(':')
      .map(Number)

    const normalizedHours =
      hours === 0 ? 24 : hours

    return normalizedHours * 60 + minutes
  }

  const getLeft = (value: string) => {
    const minutes = toMinutes(value)

    return (
      ((minutes - timelineStart) /
        timelineDuration) *
      100
    )
  }

  const getWidth = (
    start: string,
    end: string,
  ) => {
    const startMinutes = Math.max(
      timelineStart,
      toMinutes(start),
    )

    const endMinutes = Math.min(
      timelineEnd,
      toMinutes(end),
    )

    return (
      ((endMinutes - startMinutes) /
        timelineDuration) *
      100
    )
  }

  const formatTime = (value: string) =>
    value.slice(0, 5)

  const hourMarkers = [
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:00',
    '00:00',
  ]

  return (
    <div className="page">

      {/* HEADER */}
      <div className="pageHeader">

        <div>

          <div className="eyebrow">
            BLOCK PLANNER
          </div>

          <h1>Planning Horizon</h1>

          <p>
            {data.planning_date}
            {' · '}
            {data.block_type} block
          </p>

          {data.plan_id && (
            <small className="planId">
              Plan ID: {data.plan_id}
            </small>
          )}

        </div>

        <button
          className="secondaryButton"
          onClick={loadPlan}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh Plan
        </button>

      </div>


      {/* SUMMARY */}
      <div className="plannerSummary">

        <div>
          <span>Allocated</span>
          <strong>
            {data.assigned_count}
          </strong>
        </div>

        <div>
          <span>Unscheduled</span>
          <strong>
            {data.unscheduled_count}
          </strong>
        </div>

        <div>
          <span>Candidate pairs</span>
          <strong>
            {data.candidate_pairs}
          </strong>
        </div>

        <div>
          <span>Priority</span>
          <strong>
            {data.total_priority.toFixed(1)}
          </strong>
        </div>

        <div>
          <span>Solver</span>
          <strong className="successText">
            {data.status}
          </strong>
        </div>

      </div>


      {/* TIMELINE */}
      <section className="plannerCard">

        <div className="plannerCardHeader">

          <div>

            <div className="eyebrow">
              OPTIMIZED TIMELINE
            </div>

            <h2>
              Maintenance Block Schedule
            </h2>

            <p>
              Recommended assignments across
              available corridor windows.
            </p>

          </div>

          <span className="countBadge">
            {assignments.length} blocks
          </span>

        </div>


        <div className="timeline">

          <div className="timelineHeader">

            <div className="timelineLabel">
              SECTION
            </div>

            <div className="timelineHours">

              {hourMarkers.map((hour) => (
                <span key={hour}>
                  {hour}
                </span>
              ))}

            </div>

          </div>


          {sections.length === 0 ? (

            <div className="emptyTimeline">

              <CalendarDays size={28} />

              <strong>
                No assignments
              </strong>

              <span>
                The optimizer did not allocate
                any task in this planning horizon.
              </span>

            </div>

          ) : (

            sections.map((section) => {

              const sectionAssignments =
                assignments.filter(
                  (item) =>
                    item.section_id === section,
                )

              return (
                <div
                  className="timelineRow"
                  key={section}
                >

                  <div className="timelineLabel">
                    <strong>
                      {section}
                    </strong>

                    <span>
                      {sectionAssignments.length}
                      {' '}
                      block
                      {sectionAssignments.length !== 1
                        ? 's'
                        : ''}
                    </span>
                  </div>


                  <div className="timelineTrack">

                    {sectionAssignments.map(
                      (item) => (

                        <div
                          key={item.task_id}
                          className="timelineBlock"
                          style={{
                            left: `${getLeft(
                              item.start_time,
                            )}%`,
                            width: `${getWidth(
                              item.start_time,
                              item.end_time,
                            )}%`,
                          }}
                          title={`${item.task_id} · ${formatTime(item.start_time)}–${formatTime(item.end_time)}`}
                        >

                          <strong>
                            {item.task_id}
                          </strong>

                          <span>
                            {formatTime(
                              item.start_time,
                            )}
                            –
                            {formatTime(
                              item.end_time,
                            )}
                          </span>

                        </div>

                      ),
                    )}

                  </div>

                </div>
              )
            })

          )}

        </div>

      </section>


      {/* ASSIGNMENT TABLE */}
      <section className="contentSection">

        <div className="sectionHeading">

          <div>

            <div className="eyebrow">
              ASSIGNMENT DETAILS
            </div>

            <h2>
              Optimized Blocks
            </h2>

          </div>

          <span className="countBadge">
            {assignments.length} tasks
          </span>

        </div>


        <div className="planAssignmentList">

          {assignments.map((item) => (

            <div
              className="planAssignmentCard"
              key={item.task_id}
            >

              <div className="planAssignmentTime">

                <strong>
                  {formatTime(
                    item.start_time,
                  )}
                </strong>

                <span>to</span>

                <strong>
                  {formatTime(
                    item.end_time,
                  )}
                </strong>

              </div>


              <div className="planAssignmentMain">

                <div className="recommendationTop">

                  <div>

                    <strong>
                      {item.task_id}
                    </strong>

                    <span className="sectionTag">
                      {item.section_id}
                    </span>

                    <span className="resourceTag">
                      {item.resource_id}
                    </span>

                  </div>

                  <span className="priorityBadge">
                    Priority{' '}
                    {item.priority_score.toFixed(1)}
                  </span>

                </div>


                <div className="assignmentDetails">

                  <span>
                    Window {item.window_id}
                  </span>

                  <span>
                    {item.duration_min} min
                  </span>

                  {(item.restriction_penalty ?? 0) > 0 && (

                    <span className="restrictionWarning">
                      Restriction penalty{' '}
                      {item.restriction_penalty}
                    </span>

                  )}

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>

    </div>
  )
}


function Recommended() {
  const [data, setData] =
    useState<PlanExplanationsResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [designating, setDesignating] = useState(false)
  const [designated, setDesignated] = useState(false)

  async function loadRecommendations() {
    try {
      setLoading(true)
      setError(null)

      const result = await getPlanExplanations()
      setData(result)
      setDesignated(false)
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

  function handleDesignatePlan() {
    if (!data || data.assignments.length === 0) {
      return
    }

    setDesignating(true)

    /*
      Phase 1:
      Designation is currently a UI simulation.
      The real approval/designation endpoint will be
      connected in the lifecycle phase.
    */
    setTimeout(() => {
      setDesignating(false)
      setDesignated(true)
    }, 500)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="pageHeader">
          <div>
            <div className="eyebrow">AI PLANNING</div>
            <h1>Recommended Plan</h1>
            <p>
              Generating an explainable maintenance plan...
            </p>
          </div>
        </div>

        <div className="placeholder">
          <Sparkles size={42} />

          <h2>Running optimizer</h2>

          <p>
            Checking corridor windows, restrictions,
            train conflicts, dependencies and resource
            availability.
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

            <p>
              Explainable optimizer recommendations
            </p>
          </div>
        </div>

        <div className="errorCard">
          <strong>
            Could not load recommended plan
          </strong>

          <p>
            {error ?? 'No planning data was returned.'}
          </p>

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

  const assignments = [...data.assignments].sort(
    (a, b) =>
      a.start_time.localeCompare(b.start_time) ||
      a.section_id.localeCompare(b.section_id),
  )

  const explanations =
    [...data.explanations]
      .sort(
        (a, b) =>
          b.priority_score - a.priority_score,
      )
      .slice(0, 12)

  const totalPenalty = assignments.reduce(
    (sum, item) =>
      sum + Number(item.restriction_penalty ?? 0),
    0,
  )

  const effectiveScore =
    data.total_priority - totalPenalty

  const reasonLabel: Record<string, string> = {
    NO_SUITABLE_WINDOW: 'No suitable window',
    BLOCK_CONFLICT: 'Block conflict',
    HIGH_RESTRICTION: 'High restriction',
    OPTIMIZER_CAPACITY: 'Optimizer capacity',
    TRAIN_CONFLICT: 'Train conflict',
  }

  const formatTime = (value: string) =>
    value.slice(0, 5)

  return (
    <div className="page">

      {/* HEADER */}
      <div className="pageHeader">
        <div>
          <div className="eyebrow">
            AI PLANNING
          </div>

          <h1>Recommended Plan</h1>

          <p>
            Explainable maintenance plan for{' '}
            {data.planning_date} · {data.block_type}
          </p>

          {data.plan_id && (
            <small className="planId">
              Plan ID: {data.plan_id}
            </small>
          )}
        </div>

        <div className="pageHeaderActions">

          <button
            className="secondaryButton"
            onClick={loadRecommendations}
            disabled={loading}
          >
            <RefreshCw size={15} />

            Refresh Plan
          </button>

          <button
            className="primaryButton"
            onClick={handleDesignatePlan}
            disabled={
              designating ||
              designated ||
              assignments.length === 0
            }
          >
            <ShieldCheck size={15} />

            {designating
              ? 'Designating...'
              : designated
                ? 'Plan Designated'
                : 'Designate Plan'}
          </button>

        </div>
      </div>


      {/* STATUS */}
      <section className="recommendationHero">

        <div className="recommendationHeroMain">

          <div className="statusLine">
            <span className="statusDot good" />

            <strong>
              {data.status}
            </strong>

            <span>
              Optimizer result
            </span>
          </div>

          <h2>
            {assignments.length} maintenance tasks
            scheduled
          </h2>

          <p>
            The optimizer selected feasible maintenance
            windows while respecting operational
            constraints.
          </p>

        </div>

        <div className="heroMetric">
          <span>Effective score</span>

          <strong>
            {effectiveScore.toFixed(1)}
          </strong>

          <small>
            Priority minus restriction penalty
          </small>
        </div>

      </section>


      {/* KPI GRID */}
      <div className="kpis recommendationKpis">

        <Kpi
          title="Scheduled"
          value={data.assigned_count}
          note="Tasks allocated"
          tone="good"
          badge="Selected"
        />

        <Kpi
          title="Unscheduled"
          value={data.unscheduled_count}
          note="Tasks needing review"
          tone="warn"
          badge="Review"
        />

        <Kpi
          title="Candidate Pairs"
          value={data.candidate_pairs}
          note="Task-window combinations"
          tone="neutral"
          badge="Feasible"
        />

        <Kpi
          title="Priority Covered"
          value={data.total_priority.toFixed(1)}
          note="Selected task priority"
          tone="good"
          badge="Score"
        />

        <Kpi
          title="Restrictions"
          value={totalPenalty.toFixed(1)}
          note="Applied penalties"
          tone={
            totalPenalty > 0
              ? 'warn'
              : 'good'
          }
          badge={
            totalPenalty > 0
              ? 'Considered'
              : 'Clear'
          }
        />

      </div>


      {/* OPTIMIZED ASSIGNMENTS */}
      <section className="contentSection">

        <div className="sectionHeading">

          <div>
            <div className="eyebrow">
              OPTIMIZED ASSIGNMENTS
            </div>

            <h2>
              Recommended maintenance blocks
            </h2>

            <p>
              These are the blocks selected by the
              constraint optimizer.
            </p>
          </div>

          <span className="countBadge">
            {assignments.length} blocks
          </span>

        </div>


        <div className="planAssignmentList">

          {assignments.length === 0 ? (

            <div className="emptyState">
              <CalendarDays size={28} />

              <strong>
                No tasks could be scheduled
              </strong>

              <span>
                Review the decision-support section
                below for blocking reasons.
              </span>
            </div>

          ) : (

            assignments.map((item) => (

              <div
                className="planAssignmentCard"
                key={item.task_id}
              >

                <div className="planAssignmentTime">

                  <strong>
                    {formatTime(item.start_time)}
                  </strong>

                  <span>to</span>

                  <strong>
                    {formatTime(item.end_time)}
                  </strong>

                </div>


                <div className="planAssignmentMain">

                  <div className="recommendationTop">

                    <div>

                      <strong>
                        {item.task_id}
                      </strong>

                      <span className="sectionTag">
                        {item.section_id}
                      </span>

                      <span className="resourceTag">
                        {item.resource_id}
                      </span>

                    </div>

                    <span className="priorityBadge">
                      Priority{' '}
                      {item.priority_score.toFixed(1)}
                    </span>

                  </div>


                  <div className="assignmentDetails">

                    <span>
                      Window {item.window_id}
                    </span>

                    <span>
                      {item.duration_min} min
                    </span>

                    {(item.restriction_penalty ?? 0) > 0 && (

                      <span className="restrictionWarning">
                        Restriction penalty{' '}
                        {item.restriction_penalty}
                      </span>

                    )}

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </section>


      {/* DECISION SUPPORT */}
      <section className="contentSection">

        <div className="sectionHeading">

          <div>
            <div className="eyebrow">
              DECISION SUPPORT
            </div>

            <h2>
              Why tasks were not scheduled
            </h2>

            <p>
              The planner explains blocked or
              unscheduled maintenance work.
            </p>
          </div>

          <span className="countBadge">
            {data.explanations.length} tasks
          </span>

        </div>


        <div className="recommendationList">

          {explanations.map((item) => (

            <div
              className="recommendationCard"
              key={item.task_id}
            >

              <div className="recommendationTop">

                <div>

                  <strong>
                    {item.task_id}
                  </strong>

                  <span className="sectionTag">
                    {item.section_id}
                  </span>

                </div>

                <span className="priorityBadge">
                  Priority{' '}
                  {item.priority_score.toFixed(1)}
                </span>

              </div>


              <div className="reasonRow">

                <span className="reasonBadge">
                  {reasonLabel[item.reason_code]
                    ?? item.reason_code}
                </span>

              </div>


              <p>
                {item.reason}
              </p>


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
                      {formatTime(
                        item.best_alternative.start_time,
                      )}

                      {' '}to{' '}

                      {formatTime(
                        item.best_alternative.end_time,
                      )}
                    </strong>

                    <span>
                      {item.best_alternative.duration_min}
                      {' '}min
                    </span>

                    {(item.best_alternative
                      .restriction_penalty ?? 0) > 0 && (

                      <span className="restrictionWarning">
                        Restriction penalty{' '}
                        {item.best_alternative
                          .restriction_penalty}
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
            Showing the 12 highest-priority
            unscheduled tasks.
          </div>

        )}

      </section>


      {/* SAFETY GUARDRAIL */}
      <div className="submitGuardrail">

        <ShieldCheck size={18} />

        <span>
          This plan is a recommendation.
          Final corridor possession still requires
          formal railway authorization.
        </span>

      </div>

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