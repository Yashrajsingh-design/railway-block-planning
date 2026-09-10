export type PlanExplanation = {
  task_id: string
  section_id: string
  priority_score: number
  reason_code: string
  reason: string
}

export type PlanAssignment = {
  task_id: string
  section_id: string
  window_id: string
  resource_id: string
  start_time: string
  end_time: string
  duration_min: number
  priority_score: number
  restriction_penalty?: number
}

export type PlanExplanationsResponse = {
  planning_date: string
  block_type: string
  status: string
  candidate_pairs: number
  assigned_count: number
  total_priority: number
  assignments: PlanAssignment[]
  unscheduled_count: number
  explanations: PlanExplanation[]
}
const API = 'http://127.0.0.1:8000'

export async function getPlanExplanations(): Promise<PlanExplanationsResponse> {
  const response = await fetch(
    `${API}/api/v1/plan/explanations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planning_date: '2026-09-02',
        block_type: 'TRAFFIC',
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Plan explanation API failed: ${response.status}`)
  }

  return response.json()
}