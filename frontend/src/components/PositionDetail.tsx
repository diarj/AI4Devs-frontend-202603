import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { DropResult } from '@hello-pangea/dnd';
import KanbanBoard from './KanbanBoard';
import { getInterviewFlow, getCandidatesByPosition, updateCandidateStage } from '../services/positionService';
import type { BoardColumn, CandidateRow } from '../services/positionService';
import './PositionDetail.css';

export const PositionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const positionId = parseInt(id ?? '', 10);

  const [positionName, setPositionName] = React.useState<string>('');
  const [boardColumns, setBoardColumns] = React.useState<BoardColumn[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dragError, setDragError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isNaN(positionId)) {
      setError('ID de posición inválido.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [flowResponse, candidates] = await Promise.all([
          getInterviewFlow(positionId),
          getCandidatesByPosition(positionId),
        ]);

        const { positionName: name, interviewFlow } = flowResponse.interviewFlow;
        const steps = [...interviewFlow.interviewSteps].sort((a, b) => a.orderIndex - b.orderIndex);

        const columns: BoardColumn[] = steps.map((step) => ({
          stepId: step.id,
          stepName: step.name,
          orderIndex: step.orderIndex,
          candidates: candidates.filter((c) => c.currentInterviewStep === step.name),
        }));

        setPositionName(name);
        setBoardColumns(columns);
      } catch {
        setError('No se pudo cargar la información de la posición. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [positionId]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const previousColumns = boardColumns;

    const sourceColumn = boardColumns.find((c) => c.stepName === source.droppableId);
    const destColumn = boardColumns.find((c) => c.stepName === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const candidateIndex = sourceColumn.candidates.findIndex(
      (c) => String(c.applicationId) === draggableId,
    );
    if (candidateIndex === -1) return;

    const candidate: CandidateRow = {
      ...sourceColumn.candidates[candidateIndex],
      currentInterviewStep: destination.droppableId,
    };

    const newColumns: BoardColumn[] = boardColumns.map((col) => {
      if (col.stepName === source.droppableId) {
        return {
          ...col,
          candidates: col.candidates.filter((c) => String(c.applicationId) !== draggableId),
        };
      }
      if (col.stepName === destination.droppableId) {
        const newCandidates = [...col.candidates];
        newCandidates.splice(destination.index, 0, candidate);
        return { ...col, candidates: newCandidates };
      }
      return col;
    });

    setBoardColumns(newColumns);
    setDragError(null);

    try {
      await updateCandidateStage(candidate.id, candidate.applicationId, destColumn.stepId);
    } catch {
      setBoardColumns(previousColumns);
      setDragError('No se pudo actualizar la fase del candidato. Se ha revertido el cambio.');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Link to="/positions" className="d-inline-flex align-items-center mb-3 text-decoration-none">
          ← Posiciones
        </Link>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex align-items-center mb-4">
        <Link to="/positions" className="d-inline-flex align-items-center me-3 text-decoration-none fs-5">
          ←
        </Link>
        <h2 className="mb-0">{positionName}</h2>
      </div>

      {dragError && (
        <Alert variant="danger" dismissible onClose={() => setDragError(null)} className="mb-3">
          {dragError}
        </Alert>
      )}

      <KanbanBoard columns={boardColumns} onDragEnd={handleDragEnd} />
    </Container>
  );
};

export default PositionDetail;
