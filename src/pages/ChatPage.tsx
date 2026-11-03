import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useVendorsQuery } from '../api/vendors.api';
import {
  useInquiriesQuery,
  useInquiryMessagesQuery,
  useCreateInquiryMutation,
  useSendInquiryMessageMutation,
  Inquiry,
} from '../api/inquiry.api';
import { SEO } from '../components/common/SEO';
import { Send, Store, MessageSquare, CheckCheck, Clock } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { go } = useAppStore();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { data: realInquiries, isLoading: inquiriesLoading } = useInquiriesQuery();
  const { data: stores } = useVendorsQuery();
  const createInquiryMutation = useCreateInquiryMutation();
  const sendMessageMutation = useSendInquiryMessageMutation();

  const storeList = Object.values(stores || {});
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active inquiry
  const activeInquiry: Inquiry | undefined = (realInquiries || []).find(
    (i) => i.id === selectedInquiryId
  ) || (realInquiries && realInquiries.length > 0 ? realInquiries[0] : undefined);

  const activeId = activeInquiry?.id;

  // Real messages for active inquiry
  const { data: realMessages, isLoading: messagesLoading } = useInquiryMessagesQuery(
    activeId || 0,
    !!activeId
  );

  useEffect(() => {
    if (activeInquiry && selectedInquiryId === null) {
      setSelectedInquiryId(activeInquiry.id);
    }
  }, [activeInquiry, selectedInquiryId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [realMessages]);

  const handleStartInquiry = (vendorId: number) => {
    createInquiryMutation.mutate(vendorId, {
      onSuccess: (data: any) => {
        if (data?.data?.id) {
          setSelectedInquiryId(data.data.id);
        }
      },
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    const msg = draft.trim();
    setDraft('');
    sendMessageMutation.mutate({ inquiryId: activeId, message: msg });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6 text-center max-w-md mx-auto">
        <SEO
          title="Showroom Chat — Sign In Required | Yorder"
          description="Log in to chat directly with verified showroom representatives."
          canonical="https://yorder.com/chat"
        />
        <div className="w-16 h-16 rounded-full bg-[var(--s1)] border border-[var(--gold)] flex items-center justify-center text-[var(--gold)] mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--t1)]">Sign in to Chat with Showrooms</h2>
        <p className="text-xs text-[var(--t3)] mt-2 leading-relaxed">
          Chat directly with verified floor reps across Bandra. Ask for size checks, live photos from the floor, or reserve items before ordering.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="mt-6 px-6 py-3 rounded-full bg-[var(--acc)] text-[var(--on-acc)] font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          Log in with Mobile Number
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] w-full h-[calc(100vh-140px)] border-b border-[var(--s2)]">
      <SEO
        title="Live Showroom Floor Chat — Yorder"
        description="Chat directly with store representatives on the showroom floor. Ask to hold items or verify stock."
        canonical="https://yorder.com/chat"
      />

      {/* Left Column: Real Showroom Inquiries & Vendors */}
      <aside className="border-r border-[var(--s2)] bg-[var(--s0)] flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--s2)] flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg text-[var(--t1)]">Showroom Chats</h1>
            <p className="text-[11px] text-[var(--t3)] font-mono">
              Live with showroom floor teams
            </p>
          </div>
        </div>

        {/* Inquiries Thread List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--s2)]">
          {inquiriesLoading ? (
            <div className="p-6 text-center text-xs text-[var(--t3)]">Loading inquiries...</div>
          ) : realInquiries && realInquiries.length > 0 ? (
            realInquiries.map((inq) => {
              const isSelected = inq.id === activeId;
              const vName = inq.vendor?.name || 'Showroom';
              const vInitial = vName.slice(0, 2).toUpperCase();
              return (
                <button
                  key={inq.id}
                  onClick={() => setSelectedInquiryId(inq.id)}
                  className="w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-[var(--s1)]"
                  style={{
                    background: isSelected ? 'var(--s1)' : 'transparent',
                  }}
                >
                  <div className="relative w-10 h-10 rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center font-medium text-xs text-[var(--tw)] flex-shrink-0">
                    {vInitial}
                    <span className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-[var(--ok)] border-2 border-[var(--s0)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-medium text-xs text-[var(--t1)] truncate">
                        {vName}
                      </span>
                      <span className="text-[9.5px] text-[var(--t4)] font-mono">
                        {inq.status || 'OPEN'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--t3)] truncate mt-1">
                      Inquiry #{inq.id} · Connected to floor
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            /* If no prior inquiries, show available showrooms to start a live inquiry */
            <div className="p-4 flex flex-col gap-3">
              <div className="text-xs font-semibold text-[var(--t2)] uppercase tracking-wider">
                Start Chat with a Showroom
              </div>
              <p className="text-[11px] text-[var(--t3)] leading-relaxed">
                Connect directly with floor staff at verified nearby stores:
              </p>
              <div className="flex flex-col gap-2 mt-2">
                {storeList.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleStartInquiry(Number(s.id))}
                    disabled={createInquiryMutation.isPending}
                    className="p-3 rounded-[14px] bg-[var(--s1)] border border-[var(--bd)] hover:border-[var(--gold)] flex items-center justify-between text-left transition-colors"
                  >
                    <div>
                      <div className="font-medium text-xs text-[var(--t1)]">{s.name}</div>
                      <div className="text-[10px] text-[var(--t3)]">{s.addr} · {s.eta}</div>
                    </div>
                    <span className="text-xs text-[var(--gold)] font-medium">+ Chat</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Right Column: Real Messages Area */}
      <main className="flex flex-col h-full bg-[var(--bg)]">
        {activeInquiry ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-[var(--s2)] bg-[var(--s0)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--sw)] border border-[var(--bdw)] flex items-center justify-center font-medium text-xs text-[var(--tw)]">
                  {activeInquiry.vendor?.name?.slice(0, 2).toUpperCase() || 'SH'}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[var(--t1)]">
                    {activeInquiry.vendor?.name || 'Showroom Staff'}
                  </div>
                  <div className="text-[10.5px] text-[var(--ok)] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
                    Live on the floor · Direct representative connection
                  </div>
                </div>
              </div>

              <button
                onClick={() => go('store', { sid: activeInquiry.vendorId })}
                className="text-xs font-medium text-[var(--gold)] hover:underline flex items-center gap-1"
              >
                <Store className="w-3.5 h-3.5" /> View Store
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3">
              {messagesLoading ? (
                <div className="p-8 text-center text-xs text-[var(--t3)]">Loading conversation...</div>
              ) : realMessages && realMessages.length > 0 ? (
                realMessages.map((m) => {
                  const isMe = m.senderType === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3.5 rounded-[18px] text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-[var(--acc)] text-[var(--on-acc)] rounded-br-[4px]'
                            : 'bg-[var(--s1)] text-[var(--t1)] border border-[var(--bd)] rounded-bl-[4px]'
                        }`}
                      >
                        {m.message}
                      </div>
                      <span className="text-[9.5px] text-[var(--t4)] font-mono mt-1 px-1 flex items-center gap-1">
                        {isMe && <CheckCheck className="w-3 h-3 text-[var(--ok)]" />}
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="my-auto text-center flex flex-col items-center gap-3 text-[var(--t3)]">
                  <MessageSquare className="w-8 h-8 text-[var(--t4)]" />
                  <div className="font-medium text-xs text-[var(--t2)]">
                    Connected to {activeInquiry.vendor?.name} floor representative
                  </div>
                  <p className="text-[11px] max-w-xs leading-relaxed">
                    Ask if an item is on display, request real shelf photos, or ask the floor rep to hold a size.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-[var(--s2)] bg-[var(--s0)] flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${activeInquiry.vendor?.name || 'store rep'}...`}
                className="flex-1 h-11 px-4 rounded-full bg-[var(--s1)] border border-[var(--bd)] text-xs text-[var(--t1)] outline-none focus:border-[var(--gold)] placeholder-[var(--t4)]"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sendMessageMutation.isPending}
                className="w-11 h-11 rounded-full bg-[var(--acc)] text-[var(--on-acc)] flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="m-auto text-center p-8 flex flex-col items-center gap-4">
            <MessageSquare className="w-10 h-10 text-[var(--t4)]" />
            <h2 className="font-semibold text-base text-[var(--t1)]">No Active Chat Selected</h2>
            <p className="text-xs text-[var(--t3)] max-w-sm">
              Select a showroom from the left column to chat directly with staff on the store floor.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
