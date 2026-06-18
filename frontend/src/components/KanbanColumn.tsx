import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import CandidateCard from './CandidateCard';
import type { CandidateRow } from '../services/positionService';

interface KanbanColumnProps {
  stepName: string;
  droppableId: string;
  candidates: CandidateRow[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ stepName, droppableId, candidates }) => (
  <div className="kanban-column d-flex flex-column">
    <div className="bg-light border rounded p-2 mb-2 text-center">
      <h6 className="fw-semibold mb-0">{stepName}</h6>
    </div>
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex-grow-1 p-2 rounded ${snapshot.isDraggingOver ? 'bg-primary bg-opacity-10' : 'bg-light bg-opacity-50'}`}
          style={{ minHeight: 120 }}
        >
          {candidates.length === 0 ? (
            <p className="text-muted text-center small fst-italic mt-2">
              No hay candidatos en esta fase
            </p>
          ) : (
            candidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.applicationId}
                fullName={candidate.fullName}
                averageScore={candidate.averageScore}
                draggableId={String(candidate.applicationId)}
                index={index}
              />
            ))
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

export default KanbanColumn;
