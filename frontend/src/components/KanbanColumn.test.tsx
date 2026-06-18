import React from 'react';
import { render, screen } from '@testing-library/react';
import { KanbanColumn } from './KanbanColumn';
import type { CandidateRow } from '../services/positionService';

jest.mock('@hello-pangea/dnd', () => ({
  Droppable: ({ children }: any) =>
    children(
      { innerRef: () => {}, droppableProps: {}, placeholder: null },
      { isDraggingOver: false },
    ),
  Draggable: ({ children }: any) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false },
    ),
}));

const sampleCandidates: CandidateRow[] = [
  { id: 1, applicationId: 10, fullName: 'Alice Martínez', currentInterviewStep: 'Phone Screen', averageScore: 8 },
  { id: 2, applicationId: 11, fullName: 'Bob García', currentInterviewStep: 'Phone Screen', averageScore: 0 },
];

// T010
describe('KanbanColumn', () => {
  it('renders the step name as a column header', () => {
    render(<KanbanColumn stepName="Phone Screen" droppableId="Phone Screen" candidates={[]} />);
    expect(screen.getByText('Phone Screen')).toBeInTheDocument();
  });

  it('renders a CandidateCard for each candidate', () => {
    render(
      <KanbanColumn stepName="Phone Screen" droppableId="Phone Screen" candidates={sampleCandidates} />,
    );
    expect(screen.getByText('Alice Martínez')).toBeInTheDocument();
    expect(screen.getByText('Bob García')).toBeInTheDocument();
  });

  it('renders empty-state message when candidates array is empty', () => {
    render(<KanbanColumn stepName="Phone Screen" droppableId="Phone Screen" candidates={[]} />);
    expect(screen.getByText('No hay candidatos en esta fase')).toBeInTheDocument();
  });
});
