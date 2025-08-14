import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PresenceUser = { 
  user_id: string; 
  display_name?: string | null; 
  online_at: string;
  status?: 'active' | 'idle' | 'offline';
};

export const PresenceList = ({ 
  users, 
  isLoading = false 
}: { 
  users: Record<string, PresenceUser[]>; 
  isLoading?: boolean;
}) => {
  // Process users and sort by online status
  const processedUsers = Object.values(users)
    .flat()
    .map(user => {
      // Check if user was active in the last 5 minutes
      const lastActive = new Date(user.online_at);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
      
      let status: PresenceUser['status'] = 'active';
      if (diffMinutes > 5) {
        status = 'idle';
      }
      if (diffMinutes > 15) {
        status = 'offline';
      }
      
      return {
        ...user,
        status,
        displayName: user.display_name || `User ${user.user_id.slice(0, 6)}`
      };
    })
    .sort((a, b) => {
      // Sort by status: active first, then idle, then offline
      const statusOrder = { active: 0, idle: 1, offline: 2 };
      return statusOrder[a.status || 'offline'] - statusOrder[b.status || 'offline'];
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading study buddies...</span>
      </div>
    );
  }
  
  if (processedUsers.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No one is studying this topic yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Share the link to invite friends!</p>
      </div>
    );
  }
  
  return (
    <ul className="grid gap-2">
      {processedUsers.map((user, idx) => {
        const statusColors = {
          active: "bg-green-500",
          idle: "bg-yellow-500",
          offline: "bg-gray-400"
        };
        
        const statusText = {
          active: "Studying now",
          idle: "Idle",
          offline: "Offline"
        };
        
        return (
          <li 
            key={`${user.user_id}-${idx}`} 
            className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <span 
                className={cn("size-2 rounded-full", statusColors[user.status || 'offline'])} 
                aria-hidden 
              />
              <span className="text-sm font-medium">{user.displayName}</span>
            </div>
            <span className="text-xs text-muted-foreground">{statusText[user.status || 'offline']}</span>
          </li>
        );
      })}
    </ul>
  );
};
