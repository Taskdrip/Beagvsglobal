import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Send,
  User,
  ArrowLeft,
  Shield,
  Package,
  Clock,
  CheckCheck,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

function formatTime(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function escrowStatusColor(status: string) {
  const map: Record<string, string> = {
    CREATED: "bg-slate-100 text-slate-700",
    FUNDED: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-amber-100 text-amber-700",
    DELIVERED: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-green-100 text-green-700",
    DISPUTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

export default function Chat() {
  const [, params] = useRoute("/chat/:threadId?");
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(params?.threadId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = (user as any)?.role === "ADMIN";

  const { data: threads = [], isLoading: threadsLoading } = useQuery<any[]>({
    queryKey: isAdmin ? ["/api/admin/chat/threads"] : ["/api/chat/threads"],
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  // Match by thread ID first, then fall back to listing ID (for links from listing/checkout pages)
  // Match by thread ID first, then fall back to listing ID (for links from listing/checkout pages)
  const selectedThread = (threads as any[]).find((t: any) => t.id === selectedThreadId || t.listingId === selectedThreadId);

  // If we matched by listing ID, sync selectedThreadId to the real thread ID so messages load correctly
  useEffect(() => {
    if (selectedThread && selectedThread.id !== selectedThreadId) {
      setSelectedThreadId(selectedThread.id);
    }
  }, [selectedThread?.id]);

  const activeThreadId = selectedThread?.id ?? selectedThreadId;

  const { data: messages = [], refetch: refetchMessages } = useQuery<any[]>({
    queryKey: ["/api/chat/threads", activeThreadId, "messages"],
    enabled: !!activeThreadId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (params?.threadId) setSelectedThreadId(params.threadId);
  }, [params?.threadId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeThreadId || !selectedThread) throw new Error("No active thread");
      const recipientId =
        (user as any)?.id === selectedThread.buyerId
          ? selectedThread.sellerId
          : selectedThread.buyerId;
      await apiRequest("POST", `/api/chat/threads/${activeThreadId}/messages`, {
        content,
        recipientId,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/threads", activeThreadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/threads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("PATCH", `/api/chat/messages/${messageId}/read`, {});
    },
  });

  useEffect(() => {
    if (messages && messages.length > 0 && user) {
      (messages as any[]).forEach((msg: any) => {
        if (msg.recipientId === user.id && !msg.readAt) {
          markReadMutation.mutate(msg.id);
        }
      });
    }
  }, [messages, user]);

  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-slate-500 mb-6">Please sign in to access your messages.</p>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-6 h-6 text-crypto-blue" />
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin ? "All Escrow Conversations" : "My Messages"}
          </h1>
          {isAdmin && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
              <Shield className="w-3 h-3 mr-1" />Admin View
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Thread List */}
          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold text-slate-700">
                  {threadsLoading ? "Loading..." : `${(threads as any[]).length} conversation${(threads as any[]).length !== 1 ? "s" : ""}`}
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto">
                {threadsLoading ? (
                  <div className="p-4 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    Loading conversations...
                  </div>
                ) : (threads as any[]).length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No conversations yet</p>
                    <p className="text-xs mt-1">Start by placing an order in the marketplace</p>
                    <Link href="/marketplace">
                      <Button size="sm" variant="outline" className="mt-4">Browse Marketplace</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y">
                    {(threads as any[]).map((thread: any) => {
                      const otherUser = user?.id === thread.buyerId ? thread.seller : thread.buyer;
                      const isSelected = selectedThreadId === thread.id;
                      const unread = thread.unreadCount > 0;

                      return (
                        <button
                          key={thread.id}
                          onClick={() => setSelectedThreadId(thread.id)}
                          className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""}`}
                          data-testid={`thread-item-${thread.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-crypto-blue text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {otherUser?.firstName?.[0] || <User className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-semibold truncate ${unread ? "text-slate-900" : "text-slate-700"}`}>
                                  {otherUser?.firstName} {otherUser?.lastName}
                                </span>
                                {thread.lastMessage && (
                                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                    {formatTime(thread.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mb-1">{thread.listing?.title}</p>
                              <div className="flex items-center gap-2">
                                {thread.escrow?.status && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${escrowStatusColor(thread.escrow.status)}`}>
                                    {thread.escrow.status}
                                  </span>
                                )}
                                {unread && (
                                  <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    {thread.unreadCount}
                                  </span>
                                )}
                              </div>
                              {thread.lastMessage && (
                                <p className={`text-xs mt-1 truncate ${unread ? "font-medium text-slate-700" : "text-slate-400"}`}>
                                  {thread.lastMessage.senderId === user?.id ? "You: " : ""}
                                  {thread.lastMessage.content}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Message Panel */}
          <div className="lg:col-span-2 flex flex-col">
            {!selectedThread ? (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center text-slate-400 p-8">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Select a conversation</h3>
                  <p className="text-sm">Choose a conversation from the left to start messaging</p>
                </div>
              </Card>
            ) : (
              <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Thread Header */}
                <CardHeader className="pb-3 border-b flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => setSelectedThreadId(null)}
                        className="lg:hidden p-1 rounded text-slate-400 hover:text-slate-600"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Package className="w-4 h-4 text-crypto-blue" />
                          <span className="font-semibold text-slate-800 text-sm">{selectedThread.listing?.title}</span>
                          {selectedThread.escrow?.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${escrowStatusColor(selectedThread.escrow.status)}`}>
                              Escrow: {selectedThread.escrow.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-500" />
                            Buyer: {selectedThread.buyer?.firstName} {selectedThread.buyer?.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-green-500" />
                            Seller: {selectedThread.seller?.firstName} {selectedThread.seller?.lastName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Shield className="w-3 h-3" />
                        Escrow Protected
                      </div>
                      {selectedThread.escrowId && (
                        <Link href={`/checkout/${selectedThread.escrowId}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            View Escrow
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {(messages as any[]).length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-medium">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation below</p>
                    </div>
                  ) : (
                    [...(messages as any[])].reverse().map((msg: any) => {
                      const isMe = msg.senderId === user?.id;
                      const isSystem = msg.messageType === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center">
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-1.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              {msg.content}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          data-testid={`message-${msg.id}`}
                        >
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-1">
                              {msg.sender?.role === "ADMIN" ? (
                                <Shield className="w-3 h-3" />
                              ) : (
                                msg.sender?.firstName?.[0] || "?"
                              )}
                            </div>
                          )}
                          <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                            {!isMe && (
                              <span className="text-xs text-slate-400 mb-1 ml-1">
                                {msg.sender?.role === "ADMIN" ? "🛡️ Admin (Escrow)" : `${msg.sender?.firstName} ${msg.sender?.lastName}`}
                              </span>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMe
                                  ? "bg-crypto-blue text-white rounded-tr-sm"
                                  : msg.sender?.role === "ADMIN"
                                  ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-sm"
                                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                              <span className="text-xs text-slate-400">
                                {formatTime(msg.createdAt)}
                              </span>
                              {isMe && msg.readAt && (
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white flex-shrink-0">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                      className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm"
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="h-[60px] w-[60px] flex-shrink-0"
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    All messages are secured and linked to your escrow transaction
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
