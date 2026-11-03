import { create } from 'zustand';
import { ChatMessage, ChatThread } from '../types';

export const QUICK_REPLIES = [
  'Checking the shelf now — one minute.',
  'Yes, that is on the display wall. I can hold it for an hour.',
  'Sending you a photo of the piece before it is packed.',
  'Rider can reach your door within two hours.',
];

interface ChatState {
  threads: Record<string, ChatThread>;
  activeChatId: string;
  draft: string;
  isTyping: boolean;

  setActiveChatId: (id: string) => void;
  setDraft: (draft: string) => void;
  sendMessage: (text: string) => void;
  addMessage: (threadId: string, message: ChatMessage) => void;
  ensureThread: (thread: ChatThread) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: {},
  activeChatId: '',
  draft: '',
  isTyping: false,

  setActiveChatId: (id: string) => set({ activeChatId: id }),
  setDraft: (draft: string) => set({ draft }),

  ensureThread: (thread: ChatThread) => {
    set((state) => {
      if (state.threads[thread.id]) return state;
      return {
        threads: {
          ...state.threads,
          [thread.id]: thread,
        },
        activeChatId: state.activeChatId || thread.id,
      };
    });
  },

  addMessage: (threadId: string, message: ChatMessage) => {
    set((state) => {
      const thread = state.threads[threadId];
      if (!thread) return state;
      const updatedMsgs = [...thread.msgs, message];
      return {
        threads: {
          ...state.threads,
          [threadId]: {
            ...thread,
            msgs: updatedMsgs,
            preview: message.text,
            time: 'Just now',
          },
        },
      };
    });
  },

  sendMessage: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const threadId = get().activeChatId;
    if (!threadId) return;

    get().addMessage(threadId, { me: true, text: trimmed });
    set({ draft: '', isTyping: true });

    // Floor rep acknowledgment
    setTimeout(() => {
      const thread = get().threads[threadId];
      const count = thread ? thread.msgs.length : 0;
      const reply = QUICK_REPLIES[count % QUICK_REPLIES.length];

      get().addMessage(threadId, { me: false, text: reply });
      set({ isTyping: false });
    }, 1200);
  },
}));
