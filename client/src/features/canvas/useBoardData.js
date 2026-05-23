import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { socketService } from '../../services/socket';
import offlineSyncService from '../../services/offlineSync';

export const useBoardData = (boardId) => {
  const queryClient = useQueryClient();

  // Fetch Board Data
  const { data: boardResponse, isLoading, error } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      if (!navigator.onLine) {
        const cached = offlineSyncService.getCachedBoard(boardId);
        if (cached) {
          return { success: true, data: cached, message: "Loaded from offline cache" };
        }
      }
      try {
        const { data } = await api.get(`/boards/${boardId}`);
        if (data?.success && data?.data) {
          // Always overwrite local cache with fresh server data
          offlineSyncService.cacheBoard(boardId, data.data);
        }
        return data;
      } catch (err) {
        const cached = offlineSyncService.getCachedBoard(boardId);
        if (cached) {
          return { success: true, data: cached, message: "Loaded from offline cache (fallback)" };
        }
        throw err;
      }
    },
    enabled: !!boardId,
    staleTime: 0,       // Never serve stale data from cache -- always re-fetch on mount
    gcTime: 0,          // Don't keep old data in memory between board switches
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const board = boardResponse?.data;

  // Fetch Pending Invitations Data — only for board owners (avoids 403/500 for non-owners)
  const currentUserId = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}')._id || ''; } catch { return ''; } })();
  const isOwner = board && currentUserId && (
    (board.owner?._id || board.owner)?.toString() === currentUserId.toString()
  );

  const { data: invitationsResponse, refetch: refetchInvitations } = useQuery({
    queryKey: ['board-invitations', boardId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/boards/${boardId}/invitations`);
        return data;
      } catch (err) {
        // Non-owners will get 403 — silently return empty array
        return { success: true, data: [] };
      }
    },
    enabled: !!boardId && !!isOwner,
  });

  const invitations = invitationsResponse?.data || [];

  // Fetch Workflow Automations Data
  const { data: automationsResponse, refetch: refetchAutomations } = useQuery({
    queryKey: ['board-automations', boardId],
    queryFn: async () => {
      const { data } = await api.get(`/boards/${boardId}/automations`);
      return data;
    },
    enabled: !!boardId && !!boardId,
  });

  const automations = automationsResponse?.data || [];

  // Setup Socket Listeners
  useEffect(() => {
    if (!boardId) return;

    socketService.connect();
    socketService.joinBoard(boardId);

    // Listen for real-time updates from other workstations
    const handleCardUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    };
    const handleBoardRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['board-invitations', boardId] });
    };

    socketService.onUpdateCard(handleCardUpdate);
    socketService.onBoardRefresh(handleBoardRefresh);

    return () => {
      socketService.leaveBoard?.(boardId);
    };
  }, [boardId]);

  // Mutation for moving cards (Optimistic UI)
  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, targetListId, newPosition }) => {
      if (!navigator.onLine) {
        offlineSyncService.queueMutation(
          boardId,
          'MOVE_CARD',
          '/cards/move',
          'PUT',
          { cardId, newListId: targetListId, newPosition }
        );
        return { success: true, message: "Mutation stashed offline" };
      }
      const { data } = await api.put(`/cards/move`, { cardId, newListId: targetListId, newPosition });
      return data;
    },
    onMutate: async ({ cardId, targetListId, newPosition }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });

      // Snapshot previous value
      const previousResponse = queryClient.getQueryData(['board', boardId]);

      // Optimistically update to the new value
      if (previousResponse?.data) {
        const newResponse = JSON.parse(JSON.stringify(previousResponse));
        const lists = newResponse.data.lists || [];
        const targetList = lists.find(l => l._id === targetListId);

        // Automation: Auto-Priority Escalation
        let updates = {};
        if (automations.autoHighPriority && targetList?.title?.toUpperCase().includes('URGENT')) {
          updates.priority = 'high';
        }

        newResponse.data.lists = lists.map(list => {
          // Remove card from current list
          const updatedCards = list.cards.filter(c => (c._id || c.id) !== cardId);
          
          // Add to target list if this is the one
          if (list._id === targetListId) {
            const cardToMove = lists.flatMap(l => l.cards).find(c => (c._id || c.id) === cardId);
            if (cardToMove) {
              const updatedCard = { ...cardToMove, ...updates, listId: targetListId };
              if (newPosition !== undefined) updatedCard.position = newPosition;
              updatedCards.push(updatedCard);
              // Optimistically sort by position
              updatedCards.sort((a, b) => (a.position || 0) - (b.position || 0));
            }
          }
          return { ...list, cards: updatedCards };
        });
        
        queryClient.setQueryData(['board', boardId], newResponse);
      }

      // Emit socket event to notify others
      socketService.emitCardMove({ boardId, cardId, targetListId });

      return { previousResponse };
    },
    onError: (err, variables, context) => {
      // Rollback on failure
      if (context?.previousResponse) {
        queryClient.setQueryData(['board', boardId], context.previousResponse);
      }
      console.error('📡 WORKSTATION_ERROR: Sync failed, rolling back state', err);
    },
    onSettled: () => {
      // Always refetch after error or success to keep in sync
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for creating cards
  const createCardMutation = useMutation({
    mutationFn: async ({ title, listId }) => {
      if (!navigator.onLine) {
        offlineSyncService.queueMutation(
          boardId,
          'CREATE_CARD',
          '/cards',
          'POST',
          { title, listId }
        );
        return { success: true, message: "Mutation stashed offline" };
      }
      const { data } = await api.post(`/cards`, { title, listId });
      return data;
    },
    onMutate: async ({ title, listId }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previousResponse = queryClient.getQueryData(['board', boardId]);

      if (previousResponse?.data) {
        const newResponse = JSON.parse(JSON.stringify(previousResponse));
        const list = newResponse.data.lists.find(l => l._id === listId);
        if (list) {
          list.cards.push({
            _id: `temp-${Date.now()}`,
            title,
            listId,
            priority: 'NORMAL'
          });
        }
        queryClient.setQueryData(['board', boardId], newResponse);
      }
      return { previousResponse };
    },
    onSuccess: (data) => {
      if (data?.data?._id) {
        queryClient.setQueryData(['board', boardId], (prev) => {
          if (!prev?.data) return prev;
          const next = JSON.parse(JSON.stringify(prev));
          for (const list of next.data.lists) {
            const tempCardIdx = list.cards.findIndex(c => c._id && c._id.toString().startsWith('temp-'));
            if (tempCardIdx !== -1) {
              list.cards[tempCardIdx] = data.data;
              break;
            }
          }
          return next;
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousResponse) {
        queryClient.setQueryData(['board', boardId], context.previousResponse);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for creating lists
  const createListMutation = useMutation({
    mutationFn: async ({ title }) => {
      const { data } = await api.post(`/lists`, { title, boardId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for deleting lists
  const deleteListMutation = useMutation({
    mutationFn: async (listId) => {
      const { data } = await api.delete(`/lists/${listId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for updating lists
  const updateListMutation = useMutation({
    mutationFn: async ({ listId, title }) => {
      const { data } = await api.put(`/lists/${listId}`, { title });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for updating card details (assignees, labels, etc.)
  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, updates }) => {
      if (!navigator.onLine) {
        offlineSyncService.queueMutation(
          boardId,
          'UPDATE_CARD',
          `/cards/${cardId}`,
          'PUT',
          updates
        );
        return { success: true, message: "Mutation stashed offline" };
      }
      const { data } = await api.put(`/cards/${cardId}`, updates);
      return data;
    },
    onMutate: async ({ cardId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previousResponse = queryClient.getQueryData(['board', boardId]);

      if (previousResponse?.data) {
        const newResponse = JSON.parse(JSON.stringify(previousResponse));
        newResponse.data.lists = newResponse.data.lists.map(list => ({
          ...list,
          cards: list.cards.map(card => 
            (card._id === cardId) ? { ...card, ...updates } : card
          )
        }));
        queryClient.setQueryData(['board', boardId], newResponse);
      }
      return { previousResponse };
    },
    onError: (err, variables, context) => {
      if (context?.previousResponse) {
        queryClient.setQueryData(['board', boardId], context.previousResponse);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for uploading attachments
  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ cardId, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cardId', cardId);
      const { data } = await api.post(`/cards/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onMutate: async ({ cardId }) => {
      // We can't easily optimistically update a file, but we can show a 'loading' state if needed.
      // For now, we'll just invalidate on success.
    },
    onSuccess: (response, variables) => {
      // Surgical update of the specific card's attachments
      const updatedCard = response.data;
      queryClient.setQueryData(['board', boardId], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            lists: old.data.lists.map(list => ({
              ...list,
              cards: list.cards.map(card => 
                (card._id === variables.cardId) ? { ...card, attachments: updatedCard.attachments } : card
              )
            }))
          }
        };
      });
    },
  });

  // Mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: async ({ cardId, text }) => {
      const { data } = await api.post(`/cards/${cardId}/comments`, { text });
      return data;
    },
    onMutate: async ({ cardId, text }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', cardId] });
      const previousComments = queryClient.getQueryData(['comments', cardId]);

      if (previousComments?.data) {
        const newComments = JSON.parse(JSON.stringify(previousComments));
        newComments.data.unshift({
          _id: `temp-${Date.now()}`,
          text,
          createdAt: new Date().toISOString(),
          userId: { 
            name: (() => {
              try {
                return JSON.parse(localStorage.getItem('user'))?.name || 'User';
              } catch {
                return 'User';
              }
            })(),
            avatar: (() => {
              try {
                return JSON.parse(localStorage.getItem('user'))?.avatar || null;
              } catch {
                return null;
              }
            })()
          }
        });
        queryClient.setQueryData(['comments', cardId], newComments);
      }
      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', variables.cardId], context.previousComments);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.cardId] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for deleting cards
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId) => {
      const { data } = await api.delete(`/cards/${cardId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for updating board settings (title, members)
  const updateBoardMutation = useMutation({
    mutationFn: async (updates) => {
      const { data } = await api.put(`/boards/${boardId}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for inviting members
  const inviteMemberMutation = useMutation({
    mutationFn: async (email) => {
      const { data } = await api.put(`/boards/invite`, { boardId, email });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  // Mutation for targeted individual invitations
  const createInvitationMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      const { data } = await api.post(`/boards/${boardId}/invitations`, { email, role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-invitations', boardId] });
    }
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: async (inviteId) => {
      const { data } = await api.delete(`/boards/${boardId}/invitations/${inviteId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-invitations', boardId] });
    }
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (inviteId) => {
      const { data } = await api.post(`/boards/${boardId}/invitations/${inviteId}/resend`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-invitations', boardId] });
    }
  });

  // Mutation for deleting the entire board
  const deleteBoardMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/boards/${boardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      // The redirection should be handled by the component using this hook
    },
  });

  // Dynamic workflow automations mutations
  const createAutomationMutation = useMutation({
    mutationFn: async (ruleData) => {
      const { data } = await api.post(`/boards/${boardId}/automations`, ruleData);
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-automations', boardId] });
    }
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ automationId, active }) => {
      const { data } = await api.put(`/boards/${boardId}/automations/${automationId}`, { active });
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-automations', boardId] });
    }
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (automationId) => {
      const { data } = await api.delete(`/boards/${boardId}/automations/${automationId}`);
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-automations', boardId] });
    }
  });

  return {
    board,
    isLoading,
    error,
    moveCard: (cardId, targetListId, newPosition) => moveCardMutation.mutate({ cardId, targetListId, newPosition }),
    createCard: (title, listId) => createCardMutation.mutate({ title, listId }),
    createList: (title) => createListMutation.mutate({ title }),
    updateList: (listId, title) => updateListMutation.mutate({ listId, title }),
    deleteList: (listId) => deleteListMutation.mutate(listId),
    updateCard: (cardId, updates) => updateCardMutation.mutate({ cardId, updates }),
    deleteCard: (cardId) => deleteCardMutation.mutate(cardId),
    uploadAttachment: (cardId, file) => uploadAttachmentMutation.mutate({ cardId, file }),
    addComment: (cardId, text) => addCommentMutation.mutate({ cardId, text }),
    updateBoard: (updates) => updateBoardMutation.mutate(updates),
    deleteBoard: () => deleteBoardMutation.mutateAsync(),
    inviteMember: (email) => inviteMemberMutation.mutate(email),
    
    // Targeted individual invitations
    invitations,
    refetchInvitations,
    createInvitation: (email, role) => createInvitationMutation.mutateAsync({ email, role }),
    revokeInvitation: (inviteId) => revokeInvitationMutation.mutateAsync(inviteId),
    resendInvitation: (inviteId) => resendInvitationMutation.mutateAsync(inviteId),

    // Real dynamic workflow automations
    automations,
    refetchAutomations,
    createAutomation: (ruleData) => createAutomationMutation.mutateAsync(ruleData),
    toggleAutomation: (automationId, active) => toggleAutomationMutation.mutateAsync({ automationId, active }),
    deleteAutomation: (automationId) => deleteAutomationMutation.mutateAsync(automationId),

    members: (() => {
      const rawList = [
        board?.owner,
        ...(board?.members || []),
        ...(board?.workspaceId?.members?.map(m => m.user) || [])
      ].filter(Boolean);
      // De-duplicate by ID
      const seen = new Set();
      return rawList.filter(user => {
        const idStr = user._id ? user._id.toString() : user.toString();
        if (seen.has(idStr)) return false;
        seen.add(idStr);
        return true;
      });
    })(),
    owner: board?.owner
  };
};
