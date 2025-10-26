import { create } from 'zustand';
import { Session, Participant, BillItem, ItemAssignment } from '@/types';

interface SessionStore {
  // Current session
  currentSession: Session | null;

  // Current user's participant info
  currentParticipant: Participant | null;

  // Actions
  setSession: (session: Session) => void;
  setParticipant: (participant: Participant) => void;
  updateSession: (updates: Partial<Session>) => void;
  addItem: (item: BillItem) => void;
  updateItem: (itemId: string, updates: Partial<BillItem>) => void;
  removeItem: (itemId: string) => void;
  addParticipant: (participant: Participant) => void;
  updateParticipant: (participantId: string, updates: Partial<Participant>) => void;
  addAssignment: (assignment: ItemAssignment) => void;
  removeAssignment: (assignmentId: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentSession: null,
  currentParticipant: null,

  setSession: (session) => set({ currentSession: session }),

  setParticipant: (participant) => set({ currentParticipant: participant }),

  updateSession: (updates) =>
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, ...updates }
        : null,
    })),

  addItem: (item) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            items: [...state.currentSession.items, item],
          }
        : null,
    })),

  updateItem: (itemId, updates) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            items: state.currentSession.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          }
        : null,
    })),

  removeItem: (itemId) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            items: state.currentSession.items.filter((item) => item.id !== itemId),
          }
        : null,
    })),

  addParticipant: (participant) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            participants: [...state.currentSession.participants, participant],
          }
        : null,
    })),

  updateParticipant: (participantId, updates) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            participants: state.currentSession.participants.map((p) =>
              p.id === participantId ? { ...p, ...updates } : p
            ),
          }
        : null,
    })),

  addAssignment: (assignment) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            assignments: [...state.currentSession.assignments, assignment],
          }
        : null,
    })),

  removeAssignment: (assignmentId) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            assignments: state.currentSession.assignments.filter(
              (a) => a.id !== assignmentId
            ),
          }
        : null,
    })),

  clearSession: () => set({ currentSession: null, currentParticipant: null }),
}));
