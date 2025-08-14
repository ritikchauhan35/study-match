import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/integrations/user/userUtils";
import { lobbyService } from "@/services/api";
import { trackPresence } from "@/integrations/realtime/socketService";
import { ChatPanel } from "@/components/ChatPanel";
import { PresenceList, PresenceUser } from "@/components/PresenceList";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { Loader2, Users, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

type StudyUser = {
  id: string;
  display_name: string;
};

const StudyRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<StudyUser | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser[]>>({});
  const [lobbySubjects, setLobbySubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<any>(null);

  // Handle leaving the lobby
  const leaveLobby = useCallback(async () => {
    if (!roomId) return;
    
    // Skip database operations for local lobbies
    if (roomId.startsWith('local-')) return;
    
    try {
      // 1. Get current lobby
      const lobby = await lobbyService.getLobbyById(roomId);
      
      if (!lobby) {
        console.error(`Lobby not found: ${roomId}`);
        return; // Exit early if we can't fetch the lobby
      }
      
      // 2. Update user count
      const newCount = Math.max(0, (lobby?.user_count || 1) - 1);
      
      if (newCount === 0) {
        // If no users left, delete the lobby
        try {
          await lobbyService.deleteLobby(roomId);
        } catch (deleteErr) {
          console.error('Error deleting lobby:', deleteErr);
        }
      } else {
        // Otherwise update the count
        try {
          await lobbyService.updateLobby(roomId, { user_count: newCount });
        } catch (updateErr) {
          console.error('Error updating lobby:', updateErr);
        }
      }
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  }, [roomId]);

  // Set up event listener for page unload to leave lobby
  useEffect(() => {
    const handleBeforeUnload = () => {
      leaveLobby();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [leaveLobby]);

  useEffect(() => {
    if (!roomId) {
      setError('Invalid room ID');
      setLoading(false);
      return;
    }

    // 1. Get user ID and fetch lobby info
    const setupUserAndLobby = async () => {
      try {
        // Get user from our custom system
        const user = getCurrentUser();
        setCurrentUser(user);
        
        // Fetch lobby information
        let subjects = [];
        try {
          // Check if this is a local lobby (fallback from Matching page)
          if (roomId?.startsWith('local-')) {
            // Get subjects from localStorage if available
            const storedSubjects = localStorage.getItem('selected_subjects');
            subjects = storedSubjects ? JSON.parse(storedSubjects) : [];
          } else {
            // Try to fetch from database
            const lobby = await lobbyService.getLobbyById(roomId);
              
            if (!lobby) {
              console.error('Study room not found');
              // Use fallback
              const storedSubjects = localStorage.getItem('selected_subjects');
              subjects = storedSubjects ? JSON.parse(storedSubjects) : [];
            } else {
              subjects = lobby.subjects || [];
            }
          }
        } catch (e) {
          console.error('Error fetching lobby:', e);
          // Use empty subjects array as fallback
          const storedSubjects = localStorage.getItem('selected_subjects');
          subjects = storedSubjects ? JSON.parse(storedSubjects) : [];
        }
        
        setLobbySubjects(subjects);
        
        // Update last activity if this is not a local lobby
        if (!roomId?.startsWith('local-')) {
          try {
            await lobbyService.updateLobby(roomId, { last_activity: new Date() });
          } catch (e) {
            console.error('Error updating last activity:', e);
            // Continue anyway
          }
        }
        
        // Set up presence tracking with Socket.IO
        const presence = trackPresence(roomId);
        
        presence.onSync((users) => {
          const formattedUsers = users.reduce((acc, user) => {
            if (!acc[user.id]) {
              acc[user.id] = [];
            }
            acc[user.id].push(user);
            return acc;
          }, {} as Record<string, PresenceUser[]>);
          
          setOnlineUsers(formattedUsers);
        });
        
        presence.onJoin((data) => {
          // Someone joined
          if (data.user?.id !== user?.id) {
            toast('A new study buddy has joined!', {
              description: 'Someone is now studying with you.',
              duration: 3000
            });
          }
        });
        
        setChannel(presence);
        setLoading(false);
      } catch (err) {
        console.error('Error setting up study room:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };
    
    setupUserAndLobby();
    
    return () => {
      // Clean up
      if (channel) {
        channel.leave();
      }
      leaveLobby();
    };
  }, [roomId, leaveLobby, channel]);
  
  const findNewPartner = async () => {
    // Leave current lobby before finding a new partner
    await leaveLobby();
    navigate('/select-subjects');
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">Loading study room...</h1>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-4">
        <div className="bg-card rounded-2xl p-8 shadow-lg max-w-md">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-4">Study Room Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/select-subjects')}>
            Back to Subject Selection
          </Button>
        </div>
      </div>
    );
  }
  
  if (!lobbySubjects.length) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-secondary">
                <Users size={24} />
                <span className="font-semibold">Study Partner Found!</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lobbySubjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground rounded-full"
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={findNewPartner}
              className="rounded-full"
            >
              Find New Partner
            </Button>
          </div>
        </motion.div>

        {/* Main Study Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users size={20} />
                Study Chat
              </h2>
              <ChatPanel roomId={`study-room:${roomId}`} currentUser={currentUser} />
            </div>
          </motion.div>

          {/* Timer & Tools Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Pomodoro Timer */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock size={18} />
                Focus Timer
              </h3>
              <PomodoroTimer />
            </div>

            {/* Online Users */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users size={18} />
                Study Buddies
              </h3>
              <PresenceList users={onlineUsers} isLoading={loading} />
            </div>
            
            {/* Study Tips */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Study Tips
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>• Use the timer to stay focused</p>
                <p>• Take breaks every 25 minutes</p>
                <p>• Share your progress with your partner</p>
                <p>• Ask questions and help each other</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default StudyRoom;
