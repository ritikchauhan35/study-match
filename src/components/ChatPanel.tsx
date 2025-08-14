import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "@/integrations/user/userUtils";
import { messageService } from "@/services/api";
import { createChannel } from "@/integrations/realtime/socketService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type ChatUser = {
  id: string;
  display_name: string;
};

type Message = {
  id: string;
  text: string;
  user?: string;
  timestamp: string;
  username?: string;
};

interface ChatPanelProps {
  roomId: string;
  currentUser?: ChatUser | null;
}

export const ChatPanel = ({ roomId }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // On component mount, get the current user's ID and load previous messages
    const setupChat = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const user = getCurrentUser();
        setCurrentUser(user);
        
        // Create and subscribe to the channel
        const channel = createChannel(`chat:${roomId}`);
        
        // Set up message listener
        const unsubscribe = channel.on("message", (payload) => {
          const { id, text, user_id, timestamp, username } = payload;
          setMessages((m) => [...m, { 
            id, 
            text, 
            user: user_id, 
            timestamp: typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString(), 
            username 
          }]);
        });
          
        channelRef.current = channel;
        
        // Try to load messages from database first
        try {
          const dbMessages = await messageService.getMessages(roomId);
          if (dbMessages && dbMessages.length > 0) {
            // Format messages from database
            const formattedMessages = dbMessages.map(msg => ({
              id: msg.id,
              text: msg.text,
              user: msg.user_id,
              timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString(),
              username: msg.username
            }));
            setMessages(formattedMessages);
          } else {
            // Fall back to local storage if no messages in database
            const savedMessages = localStorage.getItem(`chat_${roomId}`);
            if (savedMessages) {
              try {
                const parsedMessages = JSON.parse(savedMessages) as Message[];
                setMessages(parsedMessages);
              } catch (e) {
                console.error('Failed to parse saved messages:', e);
                // Clear corrupted messages
                localStorage.removeItem(`chat_${roomId}`);
              }
            }
          }
        } catch (e) {
          console.error('Error loading messages from database:', e);
          // Fall back to local storage
          const savedMessages = localStorage.getItem(`chat_${roomId}`);
          if (savedMessages) {
            try {
              const parsedMessages = JSON.parse(savedMessages) as Message[];
              setMessages(parsedMessages);
            } catch (e) {
              console.error('Failed to parse saved messages:', e);
              // Clear corrupted messages
              localStorage.removeItem(`chat_${roomId}`);
            }
          }
        }
      } catch (err) {
        console.error('Error setting up chat:', err);
        toast.error('Failed to set up chat');
      } finally {
        setIsLoading(false);
      }
    };
    
    setupChat();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [roomId]);

  // Save messages to local storage when they change
  useEffect(() => {
    if (messages.length > 0) {
      // Only keep the last 100 messages to avoid storage issues
      const messagesToSave = messages.slice(-100);
      localStorage.setItem(`chat_${roomId}`, JSON.stringify(messagesToSave));
    }
    
    // Scroll to bottom
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, roomId]);

  const send = async () => {
    if (!text.trim() || !channelRef.current) return;
    
    try {
      setIsSending(true);
      
      // Create message object
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const displayName = currentUser ? currentUser.display_name : 'Anonymous';
      
      const messageData = { 
        id, 
        text: text.trim(), 
        user_id: currentUser?.id || '',
        timestamp,
        username: displayName,
        room_id: roomId
      };
      
      // Send message through channel
      channelRef.current.send("message", messageData);
      
      // Also save to database
      try {
        await messageService.sendMessage(
          roomId,
          text.trim(),
          currentUser?.id,
          displayName
        );
      } catch (dbErr) {
        console.error('Failed to save message to database:', dbErr);
        // Continue anyway as the message was sent through the channel
      }
      
      setText("");
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-80 flex-col rounded-md border">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.user === currentUser?.id && m.user !== undefined;
            return (
              <div key={m.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                {!isMe && m.username && (
                  <span className="text-xs text-muted-foreground mb-1">{m.username}</span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-2 text-sm", 
                    isMe ? "bg-primary text-primary-foreground" : "bg-primary/10"
                  )}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t p-2">
        <Input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Type a message" 
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} 
          disabled={isLoading}
        />
        <Button 
          onClick={send} 
          disabled={isLoading || !text.trim() || isSending}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
        </Button>
      </div>
    </div>
  );
};
