import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PositionDetail } from './PositionDetail';
import * as positionService from '../services/positionService';
import type { BoardColumn } from '../services/positionService';

jest.mock('../services/positionService', () => ({
  getInterviewFlow: jest.fn(),
  getCandidatesByPosition: jest.fn(),
  updateCandidateStage: jest.fn(),
}));

// Capture onDragEnd so US2 tests can invoke it
let capturedOnDragEnd: (result: any) => void = () => {};

jest.mock('./KanbanBoard', () => ({
  __esModule: true,
  KanbanBoard: ({ columns, onDragEnd }: { columns: BoardColumn[]; onDragEnd: (r: any) => void }) => {
    capturedOnDragEnd = onDragEnd;
    return (
      <div data-testid="kanban-board">
        {columns.map((col) => (
          <div key={col.stepName} data-testid={`col-${col.stepName}`}>
            <span>{col.stepName}</span>
            {col.candidates.map((c) => (
              <div key={c.applicationId} data-testid={`card-${c.applicationId}`}>
                {c.fullName}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
  default: ({ columns, onDragEnd }: { columns: BoardColumn[]; onDragEnd: (r: any) => void }) => {
    capturedOnDragEnd = onDragEnd;
    return (
      <div data-testid="kanban-board">
        {columns.map((col) => (
          <div key={col.stepName} data-testid={`col-${col.stepName}`}>
            <span>{col.stepName}</span>
            {col.candidates.map((c) => (
              <div key={c.applicationId} data-testid={`card-${c.applicationId}`}>
                {c.fullName}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

const mockFlow = {
  interviewFlow: {
    positionName: 'Senior Backend Engineer',
    interviewFlow: {
      id: 1,
      description: 'Standard',
      interviewSteps: [
        { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'Phone Screen', orderIndex: 1 },
        { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical Interview', orderIndex: 2 },
      ],
    },
  },
};

const mockCandidates = [
  { id: 1, applicationId: 10, fullName: 'Alice Doe', currentInterviewStep: 'Phone Screen', averageScore: 8 },
  { id: 2, applicationId: 11, fullName: 'Bob Smith', currentInterviewStep: 'Technical Interview', averageScore: 0 },
];

const renderWithRouter = (positionId = '1') =>
  render(
    <MemoryRouter initialEntries={[`/positions/${positionId}`]}>
      <Routes>
        <Route path="/positions/:id" element={<PositionDetail />} />
        <Route path="/positions" element={<div>Positions List</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  capturedOnDragEnd = () => {};
});

// T012 — US1 tests
describe('PositionDetail — US1', () => {
  it('renders a loading spinner while data is being fetched', () => {
    (positionService.getInterviewFlow as jest.Mock).mockReturnValue(new Promise(() => {}));
    (positionService.getCandidatesByPosition as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderWithRouter();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders an error banner when the fetch fails', async () => {
    (positionService.getInterviewFlow as jest.Mock).mockRejectedValue(new Error('Network error'));
    (positionService.getCandidatesByPosition as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('renders the position title as a heading after successful load', async () => {
    (positionService.getInterviewFlow as jest.Mock).mockResolvedValue(mockFlow);
    (positionService.getCandidatesByPosition as jest.Mock).mockResolvedValue(mockCandidates);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
    });
  });

  it('renders a back link to /positions', async () => {
    (positionService.getInterviewFlow as jest.Mock).mockResolvedValue(mockFlow);
    (positionService.getCandidatesByPosition as jest.Mock).mockResolvedValue(mockCandidates);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/←/)).toBeInTheDocument();
    });
  });

  it('renders the KanbanBoard with the correct number of columns', async () => {
    (positionService.getInterviewFlow as jest.Mock).mockResolvedValue(mockFlow);
    (positionService.getCandidatesByPosition as jest.Mock).mockResolvedValue(mockCandidates);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
      expect(screen.getByTestId('col-Phone Screen')).toBeInTheDocument();
      expect(screen.getByTestId('col-Technical Interview')).toBeInTheDocument();
    });
  });

  it('assigns candidates to the correct column', async () => {
    (positionService.getInterviewFlow as jest.Mock).mockResolvedValue(mockFlow);
    (positionService.getCandidatesByPosition as jest.Mock).mockResolvedValue(mockCandidates);

    renderWithRouter();

    await waitFor(() => {
      const phoneCol = screen.getByTestId('col-Phone Screen');
      const techCol = screen.getByTestId('col-Technical Interview');
      expect(phoneCol).toHaveTextContent('Alice Doe');
      expect(techCol).toHaveTextContent('Bob Smith');
    });
  });
});

// T020 — US2 drag-and-drop tests
describe('PositionDetail — US2 drag-and-drop', () => {
  beforeEach(async () => {
    (positionService.getInterviewFlow as jest.Mock).mockResolvedValue(mockFlow);
    (positionService.getCandidatesByPosition as jest.Mock).mockResolvedValue(mockCandidates);
    (positionService.updateCandidateStage as jest.Mock).mockResolvedValue(undefined);
  });

  it('does not call updateCandidateStage when source and destination are the same column', async () => {
    renderWithRouter();
    await waitFor(() => screen.getByTestId('kanban-board'));

    act(() => {
      capturedOnDragEnd({
        draggableId: '10',
        source: { droppableId: 'Phone Screen', index: 0 },
        destination: { droppableId: 'Phone Screen', index: 0 },
      });
    });

    expect(positionService.updateCandidateStage).not.toHaveBeenCalled();
  });

  it('moves candidate to destination column optimistically on drag-and-drop', async () => {
    renderWithRouter();
    await waitFor(() => screen.getByTestId('col-Phone Screen'));

    act(() => {
      capturedOnDragEnd({
        draggableId: '10',
        source: { droppableId: 'Phone Screen', index: 0 },
        destination: { droppableId: 'Technical Interview', index: 0 },
      });
    });

    await waitFor(() => {
      const techCol = screen.getByTestId('col-Technical Interview');
      expect(techCol).toHaveTextContent('Alice Doe');
    });
  });

  it('reverts candidate to original column when updateCandidateStage fails', async () => {
    (positionService.updateCandidateStage as jest.Mock).mockRejectedValue(new Error('API error'));

    renderWithRouter();
    await waitFor(() => screen.getByTestId('col-Phone Screen'));

    await act(async () => {
      capturedOnDragEnd({
        draggableId: '10',
        source: { droppableId: 'Phone Screen', index: 0 },
        destination: { droppableId: 'Technical Interview', index: 0 },
      });
    });

    await waitFor(() => {
      const phoneCol = screen.getByTestId('col-Phone Screen');
      expect(phoneCol).toHaveTextContent('Alice Doe');
    });
  });
});
