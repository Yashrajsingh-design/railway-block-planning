export type DashboardHealth = {
  tasks_covered: number
  total_tasks: number
  coverage_percent: number
  critical_coverage_percent: number
  overdue_reduction_percent: number
}

export type DashboardOverview = {
  section_id: string
  planning_date: string
  block_type: string

  critical_maintenance: number
  overdue_tasks: number
  clear_windows: number
  block_requests: number
  allocated_plan: number
  restrictions: number

  optimizer_status: string
  candidate_pairs: number
  total_priority: number

  planning_health: DashboardHealth
}

const API = 'http://127.0.0.1:8000'

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await fetch(
    `${API}/api/v1/dashboard/overview?section_id=S02&planning_date=2026-09-02&block_type=TRAFFIC`,
  )

  if (!response.ok) {
    throw new Error(
      `Dashboard API failed: ${response.status}`,
    )
  }

  return response.json()
}