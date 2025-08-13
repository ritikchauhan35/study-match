import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const ChatPanel = ({ channelName }: { channelName: string }) => {
  const [messages, setMessages] = useState<{ id: string; text: string; user?: string }[]>([]);
  const [text, setText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // On component mount, get the current user's ID.
    // This user might be authenticated anonymously.
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getCurrentUser();

    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "message" }, (payload) => {
        const { id, text, user } = payload.payload as any;
        setMessages((m) => [...m, { id, text, user }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    // Each message needs a unique ID for the key, and the text.
    const id = crypto.randomUUID();
    // We also send the current user's ID to identify the sender.
    await supabase.channel(channelName).send({ type: "broadcast", event: "message", payload: { id, text, user: currentUserId } });
    setText("");
  };

  return (
    <div className="flex h-80 flex-col rounded-md border">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => {
          const isMe = m.user === currentUserId && m.user !== undefined;
          return (
            <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div
                className={cn("max-w-[80%] rounded-lg p-2 text-sm", isMe ? "bg-primary text-primary-foreground" : "bg-primary/10")}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t p-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" onKeyDown={(e) => e.key === "Enter" && send()} />
        <Button onClick={send}>Send</Button>
      </div>
    </div>
  );
};
