import React from 'react';
import { Card } from 'react-bootstrap';
import { Draggable } from '@hello-pangea/dnd';

interface CandidateCardProps {
  fullName: string;
  averageScore: number;
  draggableId: string;
  index: number;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  fullName,
  averageScore,
  draggableId,
  index,
}) => (
  <Draggable draggableId={draggableId} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="mb-2"
      >
        <Card className="shadow-sm">
          <Card.Body className="py-2 px-3">
            <Card.Title className="fs-6 mb-1">{fullName}</Card.Title>
            <Card.Text className="text-muted small mb-0">
              Puntuación media: <strong>{averageScore === 0 ? '—' : averageScore}</strong>
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
    )}
  </Draggable>
);

export default CandidateCard;
