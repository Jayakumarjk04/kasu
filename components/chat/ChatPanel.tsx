'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MessageSquare, X, Send, Trash2, Sparkles, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/lib/context/AuthContext';

interface Message { _id: string; role: 'user'|'assistant'; content: string; createdAt: string; }

const PROMPTS = (s: string) => [
  `Spent ${s}150 on lunch today`,
  'Show my spending this month',
  `Add ${s}500 groceries expense`,
  'What is my biggest expense category?',
];

export function ChatPanel() {
  const [isOpen, setIsOpen]           = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const symbol    = useCurrency();

  useEffect(() => { if (isOpen && initialLoading) fetchMessages(); }, [isOpen]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchMessages = async () => {
    try { const res = await fetch('/api/chat'); if (res.ok) setMessages(await res.json()); }
    catch(e){ console.error(e); } finally { setInitialLoading(false); }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const temp: Message = { _id: Date.now().toString(), role:'user', content:text, createdAt:new Date().toISOString() };
    setMessages(p => [...p, temp]); setInput(''); setLoading(true);
    try {
      const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message:text }) });
      if (res.ok) { 
        const d = await res.json(); 
        setMessages(p => [...p.slice(0,-1), d.userMessage, d.assistantMessage]); 
        if (['add_expense', 'update', 'delete'].includes(d.intent)) {
          window.dispatchEvent(new Event('expenseDataChanged'));
        }
      }
    } catch { setMessages(p => [...p, { _id:Date.now().toString(), role:'assistant', content:'Sorry, an error occurred. Please try again.', createdAt:new Date().toISOString() }]); }
    finally { setLoading(false); }
  };

  const clearChat = async () => { try { await fetch('/api/chat',{method:'DELETE'}); setMessages([]); } catch(e){ console.error(e); } };

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-lg shadow-cyan-500/25 dark:shadow-cyan-500/10 border border-white/20 dark:border-white/[0.06]"
          style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
          <div className="absolute inset-0 rounded-2xl animate-pulse-ring bg-cyan-400/30 dark:bg-cyan-400/20" />
          <MessageSquare className="w-6 h-6 text-white relative z-10 fill-current" />
        </button>
      )}

      {isOpen && <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/50 backdrop-blur-sm z-40 sm:hidden" onClick={() => setIsOpen(false)} />}

      {/* Panel */}
      <div className={cn(
        'fixed right-0 top-0 h-full w-full sm:w-[380px] z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl',
        'bg-slate-50 dark:bg-gradient-to-b dark:from-[#07101f] dark:to-[#050d1a] border-l border-slate-200 dark:border-cyan-500/10',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 bg-white/50 dark:bg-cyan-500/[0.02] border-b border-slate-200 dark:border-cyan-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shadow-cyan-500/20"
                style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-50 dark:border-[#07101f]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">saver</h3>
              <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Online · Ready to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white rounded-lg"><Trash2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white rounded-lg"><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !initialLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-cyan-50 border border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20 shadow-sm relative z-10">
                  <Bot className="w-8 h-8 text-cyan-500" />
                </div>
                <div className="absolute inset-0 rounded-2xl blur-xl bg-cyan-400/20 dark:bg-cyan-500/10" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Hi! I&apos;m saver</h4>
              <p className="text-slate-500 dark:text-white/50 text-sm mb-6 leading-relaxed">I track expenses, analyze spending, and help manage budgets.</p>
              <div className="w-full space-y-2">
                {PROMPTS(symbol).map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 dark:border-white/[0.07] dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/[0.07] dark:text-white/60 dark:hover:text-cyan-300">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map((msg) => (
            <div key={msg._id} className={cn('flex flex-col animate-fade-in-up', msg.role==='user'?'items-end':'items-start')}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-white/40 font-medium tracking-wide uppercase">saver</span>
                </div>
              )}
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm', msg.role==='user'?'text-white rounded-tr-sm bg-gradient-to-br from-cyan-500 to-blue-600':'text-slate-700 bg-white border border-slate-200 dark:text-white/90 dark:bg-white/[0.05] dark:border-white/[0.09] rounded-tl-sm')}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-white/30 mt-1.5 px-1 font-medium">{format(new Date(msg.createdAt),'h:mm a')}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2 animate-fade-in-up">
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-1 shadow-sm" style={{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 bg-white border border-slate-200 dark:bg-white/[0.05] dark:border-white/[0.09] shadow-sm">
                <span className="typing-dot bg-cyan-400" /><span className="typing-dot bg-cyan-400" /><span className="typing-dot bg-cyan-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="p-4 flex-shrink-0 bg-white/50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/[0.06] backdrop-blur-md">
          <div className="flex gap-2 items-end">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);} }}
              placeholder="Message saver..." rows={1}
              className="flex-1 min-h-[44px] max-h-32 resize-none text-sm rounded-xl px-4 py-3 border-0 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500/50 dark:bg-white/[0.06] dark:border-white/[0.1] dark:text-white dark:placeholder:text-white/30"
              disabled={loading} />
            <Button type="submit" size="icon" disabled={loading||!input.trim()}
              className="w-11 h-11 rounded-xl flex-shrink-0 border-0 transition-transform active:scale-95 text-white disabled:opacity-40 disabled:bg-slate-200 dark:disabled:bg-white/10 dark:disabled:text-white/40"
              style={input.trim()?{ background:'linear-gradient(135deg,#06b6d4,#3b82f6)', boxShadow:'0 4px 16px rgba(6,182,212,0.3)' }:{}}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-white/30 text-center mt-2.5 font-medium">Enter to send · Shift+Enter for new line</p>
        </form>
      </div>
    </>
  );
}
