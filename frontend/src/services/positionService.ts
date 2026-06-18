const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3010';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InterviewStepRaw {
  id: number;
  interviewFlowId: number;
  interviewTypeId: number;
  name: string;
  orderIndex: number;
}

export interface InterviewFlowRaw {
  id: number;
  description: string;
  interviewSteps: InterviewStepRaw[];
}

export interface InterviewFlowResponse {
  interviewFlow: {
    positionName: string;
    interviewFlow: InterviewFlowRaw;
  };
}

export interface CandidateRow {
  id: number;
  applicationId: number;
  fullName: string;
  currentInterviewStep: string;
  averageScore: number;
}

export interface BoardColumn {
  stepId: number;
  stepName: string;
  orderIndex: number;
  candidates: CandidateRow[];
}

export interface UpdateStageRequest {
  applicationId: number;
  currentInterviewStep: number;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const getInterviewFlow = async (positionId: number): Promise<InterviewFlowResponse> => {
  const response = await fetch(`${API_BASE}/position/${positionId}/interviewflow`);
  if (!response.ok) {
    throw new Error(`Failed to fetch interview flow: ${response.status}`);
  }
  return response.json() as Promise<InterviewFlowResponse>;
};

export const getCandidatesByPosition = async (positionId: number): Promise<CandidateRow[]> => {
  const response = await fetch(`${API_BASE}/position/${positionId}/candidates`);
  if (!response.ok) {
    throw new Error(`Failed to fetch candidates: ${response.status}`);
  }
  return response.json() as Promise<CandidateRow[]>;
};

export const updateCandidateStage = async (
  candidateId: number,
  applicationId: number,
  interviewStepId: number,
): Promise<void> => {
  const body: UpdateStageRequest = {
    applicationId,
    currentInterviewStep: interviewStepId,
  };
  const response = await fetch(`${API_BASE}/candidates/${candidateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to update candidate stage: ${response.status}`);
  }
};
