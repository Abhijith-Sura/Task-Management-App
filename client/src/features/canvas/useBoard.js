import { useState, useCallback } from 'react';

const INITIAL_CARDS = [
  { id: 'task-1', columnId: 'col-1', title: 'Reconfigure core switch routing', comments: 3, attachments: 1, dueDate: 'May 20' },
  { id: 'task-2', columnId: 'col-2', title: 'Deploy Kubernetes cluster v1.2.4', comments: 12, attachments: 4, dueDate: 'May 18' },
  { id: 'task-3', columnId: 'col-2', title: 'Audit firewall security logs', comments: 0, attachments: 2, dueDate: 'May 19' },
  { id: 'task-4', columnId: 'col-3', title: 'Provision staging environment', comments: 5, attachments: 0, dueDate: 'May 16' },
  { id: 'task-5', columnId: 'col-4', title: 'Update documentation for API v2', comments: 8, attachments: 1, dueDate: 'May 14' },
];

export const useBoard = () => {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [activeCardId, setActiveCardId] = useState(null);

  const moveCard = useCallback((cardId, targetColumnId) => {
    setCards((prev) => 
      prev.map((card) => 
        card.id === cardId ? { ...card, columnId: targetColumnId } : card
      )
    );
  }, []);

  const handleDragStart = (id) => setActiveCardId(id);
  const handleDragEnd = () => setActiveCardId(null);

  return {
    cards,
    activeCardId,
    moveCard,
    handleDragStart,
    handleDragEnd,
  };
};
