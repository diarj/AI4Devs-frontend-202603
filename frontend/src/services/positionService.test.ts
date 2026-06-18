import { getInterviewFlow, getCandidatesByPosition, updateCandidateStage } from './positionService';

const mockFlowResponse = {
  interviewFlow: {
    positionName: 'Senior Backend Engineer',
    interviewFlow: {
      id: 1,
      description: 'Standard flow',
      interviewSteps: [
        { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'Phone Screen', orderIndex: 1 },
        { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical Interview', orderIndex: 2 },
      ],
    },
  },
};

const mockCandidates = [
  { id: 1, applicationId: 10, fullName: 'Alice Doe', currentInterviewStep: 'Phone Screen', averageScore: 8.5 },
  { id: 2, applicationId: 11, fullName: 'Bob Smith', currentInterviewStep: 'Technical Interview', averageScore: 0 },
];

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

// T008 — getInterviewFlow
describe('getInterviewFlow', () => {
  it('calls GET /position/:id/interviewflow and returns parsed response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFlowResponse,
    });

    const result = await getInterviewFlow(1);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/position/1/interviewflow'));
    expect(result.interviewFlow.positionName).toBe('Senior Backend Engineer');
    expect(result.interviewFlow.interviewFlow.interviewSteps).toHaveLength(2);
    expect(result.interviewFlow.interviewFlow.interviewSteps[0].name).toBe('Phone Screen');
  });

  it('throws when the response status is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(getInterviewFlow(99)).rejects.toThrow();
  });
});

// T008 — getCandidatesByPosition
describe('getCandidatesByPosition', () => {
  it('calls GET /position/:id/candidates and returns candidates array', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCandidates,
    });

    const result = await getCandidatesByPosition(1);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/position/1/candidates'));
    expect(result).toHaveLength(2);
    expect(result[0].fullName).toBe('Alice Doe');
    expect(result[1].averageScore).toBe(0);
  });

  it('throws when the response status is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(getCandidatesByPosition(1)).rejects.toThrow();
  });
});

// T018 — updateCandidateStage
describe('updateCandidateStage', () => {
  it('sends PUT /candidates/:id with correct JSON body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    await updateCandidateStage(1, 7, 2);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/candidates/1'),
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: 7, currentInterviewStep: 2 }),
      }),
    );
  });

  it('throws when the response status is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400 });

    await expect(updateCandidateStage(1, 7, 2)).rejects.toThrow();
  });
});
