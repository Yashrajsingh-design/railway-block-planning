export type PreCheckIssue = {
  code: string
  severity: string
  message: string
}

export type SuggestedWindow = {
  start_time: string
  end_time: string
  score: number
  reason: string
}

export type PreCheckRequest = {
  department_id: string
  section_id: string
  location_id?: string
  asset_id?: string
  maintenance_task_id?: string
  preferred_date: string
  preferred_start_time: string
  block_request_id?: string
  preferred_end_time: string
  minimum_duration_minutes: number
  block_type: string
  power_block_required: boolean
  resource_ids: string[]
}

export type PreCheckResponse = {
  status: string
  can_submit: boolean
  checks_total: number
  checks_passed: number
  warnings: number
  blocks: number
  issues: PreCheckIssue[]
  suggested_windows: SuggestedWindow[]
}

const API = 'http://127.0.0.1:8000'

export async function runPreCheck(
  request: PreCheckRequest,
): Promise<PreCheckResponse> {
  const response = await fetch(
    `${API}/api/v1/precheck`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  if (!response.ok) {
    throw new Error(
      `Pre-check failed: ${response.status}`,
    )
  }

  return response.json()
}