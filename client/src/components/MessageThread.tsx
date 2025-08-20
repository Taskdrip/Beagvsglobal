import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  User,
  X
} from "lucide-react";

interface MessageThreadProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function MessageThread({ recipientId, recipientName, onClose }: MessageThreadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [threadId, setThreadId] = useState<string>("");

  // Generate deterministic thread ID
  useEffect(() => {
    if (user?.id && recipientId) {
      const sortedIds = [user.id, recipientId].sort();
      setThreadId(`${sortedIds[0]}-${sortedIds[1]}`);
    }
  }, [user?.id, recipientId]);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  const { data: messages, refetch } = useQuery({
    queryKey: ["/api/messages", threadId],
    enabled: !!threadId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      await apiRequest("POST", "/api/messages", {
        threadId,
        recipientId,
        content: data.content.trim(),
      });
    },
    onSuccess: () => {
      form.reset();
      refetch(); // Immediately fetch new messages
      queryClient.invalidateQueries({ queryKey: ["/api/user/threads"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (data: MessageFormData) => {
    if (!data.content.trim()) return;
    sendMessageMutation.mutate(data);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(handleSubmit)();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg h-[600px] flex flex-col" data-testid="message-thread-dialog">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <span>Chat with {recipientName}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
              data-testid="button-close-messages"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} data-testid="messages-scroll-area">
          {messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message: any) => {
                const isFromUser = message.senderId === user?.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div className={`max-w-[80%] ${isFromUser ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isFromUser
                            ? 'bg-crypto-blue text-white'
                            : 'bg-slate-100 text-slate-dark'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className={`flex items-center space-x-1 mt-1 ${isFromUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-slate-400">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isFromUser && (
                          <div className="text-xs text-slate-400">
                            {message.readAt ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="font-medium text-slate-dark mb-2">Start a conversation</h3>
              <p className="text-sm text-slate-medium">
                Send a message to {recipientName} to begin chatting
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-slate-200 pt-4">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex space-x-2">
            <Input
              {...form.register("content")}
              placeholder="Type your message..."
              className="flex-1"
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              data-testid="input-message-content"
            />
            <Button
              type="submit"
              size="sm"
              disabled={sendMessageMutation.isPending || !form.watch("content")?.trim()}
              className="bg-crypto-blue hover:bg-crypto-teal"
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? (
                <Clock className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          {form.formState.errors.content && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.content.message}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{form.watch("content")?.length || 0}/1000</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
