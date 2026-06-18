import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import type { BoardColumn } from '../services/positionService';

interface KanbanBoardProps {
  columns: BoardColumn[];
  onDragEnd: (result: DropResult) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, onDragEnd }) => {
  const sortedColumns = [...columns].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {sortedColumns.map((column) => (
          <KanbanColumn
            key={column.stepId}
            stepName={column.stepName}
            droppableId={column.stepName}
            candidates={column.candidates}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
