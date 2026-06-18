import React from 'react';
import { render, screen } from '@testing-library/react';
import { KanbanBoard } from './KanbanBoard';
import type { BoardColumn } from '../services/positionService';

jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <>{children}</>,
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

const sampleColumns: BoardColumn[] = [
  { stepId: 1, stepName: 'Phone Screen', orderIndex: 1, candidates: [] },
  { stepId: 2, stepName: 'Technical Interview', orderIndex: 2, candidates: [] },
  { stepId: 3, stepName: 'Manager Interview', orderIndex: 3, candidates: [] },
];

const noop = () => {};

// T011 — renders all columns in orderIndex order
describe('KanbanBoard', () => {
  it('renders exactly N columns for N entries in columns prop', () => {
    render(<KanbanBoard columns={sampleColumns} onDragEnd={noop} />);
    expect(screen.getByText('Phone Screen')).toBeInTheDocument();
    expect(screen.getByText('Technical Interview')).toBeInTheDocument();
    expect(screen.getByText('Manager Interview')).toBeInTheDocument();
  });

  it('renders columns sorted by orderIndex ascending', () => {
    const shuffled: BoardColumn[] = [
      { stepId: 3, stepName: 'Manager Interview', orderIndex: 3, candidates: [] },
      { stepId: 1, stepName: 'Phone Screen', orderIndex: 1, candidates: [] },
      { stepId: 2, stepName: 'Technical Interview', orderIndex: 2, candidates: [] },
    ];
    render(<KanbanBoard columns={shuffled} onDragEnd={noop} />);
    const headers = screen.getAllByRole('heading');
    const names = headers.map((h) => h.textContent);
    expect(names.indexOf('Phone Screen')).toBeLessThan(names.indexOf('Technical Interview'));
    expect(names.indexOf('Technical Interview')).toBeLessThan(names.indexOf('Manager Interview'));
  });

  // T019 — DragDropContext renders without error
  it('renders without error when DragDropContext is present', () => {
    expect(() => render(<KanbanBoard columns={sampleColumns} onDragEnd={noop} />)).not.toThrow();
  });

  // T026 — kanban-board CSS class for responsive layout
  it('applies the kanban-board CSS class to the wrapper', () => {
    const { container } = render(<KanbanBoard columns={sampleColumns} onDragEnd={noop} />);
    expect(container.querySelector('.kanban-board')).not.toBeNull();
  });

  it('applies the kanban-column CSS class to each column wrapper', () => {
    const { container } = render(<KanbanBoard columns={sampleColumns} onDragEnd={noop} />);
    const columnEls = container.querySelectorAll('.kanban-column');
    expect(columnEls.length).toBe(sampleColumns.length);
  });
});
