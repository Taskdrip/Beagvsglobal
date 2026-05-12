import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, AlertCircle, PhoneCall, Minimize2, Loader2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const WHATSAPP_NUMBER = "2348037232210";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello! I need support with Beagvs Global.")}`;

type Role = "user" | "assistant" | "admin";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  senderName?: string;
  createdAt?: string;
}

interface SessionInfo {
  id: string;
  status: string;
}

export default function ChatWidget() {
  const { user } = useAuth() as any;
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestNameSet, setGuestNameSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, guestNameSet]);

  // Poll for new messages (especially admin replies) every 5s when escalated
  useEffect(() => {
    if (!sessionId || !escalated) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai-support/sessions/${sessionId}/messages`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content, senderName: m.senderName, createdAt: m.createdAt })));
        setSession(data.session);
        if (data.session.status === 'closed') {
          setEscalated(false);
        }
      } catch {}
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionId, escalated]);

  async function startSession() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-support/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: guestName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined) }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      setSessionId(data.id);
      setSession(data);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm the Beagvs Global AI assistant. I can help you with listings, escrow, payments, shipping, and more. How can I help you today?",
        senderName: 'Beagvs AI',
      }]);
    } catch {
      setError("Couldn't connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming || !sessionId) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      senderName: guestName || (user ? `${user.firstName || 'You'}` : 'You'),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const aiMsgId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', senderName: 'Beagvs AI' }]);

    try {
      const res = await fetch(`/api/ai-support/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg.content, guestName: guestName || undefined }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.content) {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + evt.content } : m));
            }
            if (evt.escalated) {
              setEscalated(true);
              setSession(s => s ? { ...s, status: 'escalated' } : s);
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: "Sorry, I'm having trouble connecting. Please try again or use WhatsApp support." } : m));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const handleOpen = () => {
    setOpen(true);
    if (!sessionId && (user || guestNameSet)) {
      startSession();
    }
  };

  const handleGuestNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setGuestNameSet(true);
    startSession();
  };

  const isAuthenticated = !!user;
  const needsName = !isAuthenticated && !guestNameSet;
  const ready = sessionId !== null;

  return (
    <>
      {/* Floating buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* WhatsApp button */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="button-whatsapp-support"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
          title="Chat on WhatsApp"
        >
          <SiWhatsapp className="w-5 h-5" />
          <span className="text-sm font-medium max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            WhatsApp
          </span>
        </a>

        {/* AI Chat button */}
        <button
          onClick={() => open ? setOpen(false) : handleOpen()}
          data-testid="button-ai-chat-toggle"
          className="relative flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          title="Chat with AI Support"
        >
          {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {escalated && !open && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {open && (
        <div
          data-testid="panel-ai-chat"
          className="fixed bottom-28 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-700">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-8 h-8 text-white" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-blue-700 ${escalated ? 'bg-yellow-400' : 'bg-green-400'}`} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Beagvs Support</p>
                <p className="text-blue-200 text-xs">
                  {escalated ? "Connecting to live rep…" : "AI Assistant • Online"}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" title="Switch to WhatsApp"
                className="p-1.5 rounded-lg hover:bg-blue-600 text-blue-200 hover:text-white transition-colors">
                <SiWhatsapp className="w-4 h-4" />
              </a>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-blue-600 text-blue-200 hover:text-white transition-colors">
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Escalated banner */}
          {escalated && (
            <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-xs">Your chat has been escalated to a live representative. We'll be with you shortly.</p>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Guest name prompt */}
            {needsName && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <Bot className="w-14 h-14 text-blue-400" />
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-1">Welcome to Support</h3>
                  <p className="text-gray-400 text-sm">Before we start, what's your name?</p>
                </div>
                <form onSubmit={handleGuestNameSubmit} className="w-full flex flex-col gap-3">
                  <Input
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Your name"
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                    autoFocus
                    data-testid="input-guest-name"
                  />
                  <Button type="submit" disabled={!guestName.trim() || isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Chat"}
                  </Button>
                </form>
              </div>
            )}

            {/* Loading session */}
            {!needsName && isLoading && !ready && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="m-4 p-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Messages */}
            {ready && (
              <div className="flex-1 flex flex-col gap-3 p-4">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {isStreaming && messages[messages.length - 1]?.content === '' && (
                  <div className="flex gap-2 items-end">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          {ready && (
            <div className="border-t border-gray-700 p-3 flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={escalated ? "Continue chatting…" : "Ask me anything…"}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 flex-1"
                disabled={isStreaming}
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="bg-blue-600 hover:bg-blue-700 px-3"
                data-testid="button-send-chat"
              >
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const isAdmin = msg.role === 'admin';

  if (isUser) {
    return (
      <div className="flex gap-2 items-end flex-row-reverse">
        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="flex gap-2 items-end">
        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
          <PhoneCall className="w-4 h-4 text-white" />
        </div>
        <div className="max-w-[80%]">
          <p className="text-xs text-green-400 mb-1 ml-1">{msg.senderName || 'Support Rep'}</p>
          <div className="bg-green-900/40 border border-green-700/50 text-green-100 rounded-2xl rounded-bl-sm px-3 py-2 text-sm whitespace-pre-wrap">
            {msg.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[80%]">
        <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-sm whitespace-pre-wrap">
          {msg.content || <span className="text-gray-500 italic">…</span>}
        </div>
      </div>
    </div>
  );
}
