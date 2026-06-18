import React from 'react';
import { render, screen } from '@testing-library/react';
import { CandidateCard } from './CandidateCard';

jest.mock('@hello-pangea/dnd', () => ({
  Draggable: ({ children }: any) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false },
    ),
}));

// T009
describe('CandidateCard', () => {
  it('renders the candidate full name', () => {
    render(<CandidateCard fullName="Alice Martínez" averageScore={8.5} draggableId="app-1" index={0} />);
    expect(screen.getByText('Alice Martínez')).toBeInTheDocument();
  });

  it('renders the numeric average score when greater than 0', () => {
    render(<CandidateCard fullName="Alice Martínez" averageScore={7.3} draggableId="app-1" index={0} />);
    expect(screen.getByText('7.3')).toBeInTheDocument();
  });

  it('renders "—" when averageScore is 0', () => {
    render(<CandidateCard fullName="Bob García" averageScore={0} draggableId="app-2" index={0} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
