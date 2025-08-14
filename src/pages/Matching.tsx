import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserId } from "@/integrations/user/userUtils";
import { lobbyService } from "@/services/api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Matching = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjects } = location.state || { subjects: [] };
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (subjects.length === 0) {
      // No subjects, redirect back to selection
      navigate("/select-subjects");
      return;
    }

    const findOrCreateLobby = async () => {
      try {
        setError(null);
        setIsRetrying(false);
        
        // Ensure we have a user ID
        const userId = getUserId();
        
        // Find matching lobbies
        let lobbies = [];
        try {
          lobbies = await lobbyService.findMatchingLobbies(subjects);
        } catch (e) {
          console.log('Error fetching lobbies:', e);
          // Continue with empty lobbies array
        }

        // Find the lobby with the most subject matches
        let bestLobby = null;
        let maxMatches = 0;
        
        if (lobbies && lobbies.length > 0) {
          for (const lobby of lobbies) {
            const matchCount = lobby.subjects.filter((s: string) => subjects.includes(s)).length;
            if (matchCount > maxMatches) {
              maxMatches = matchCount;
              bestLobby = lobby;
            }
          }
        }
        
        if (bestLobby) {
          // Join existing lobby
          try {
            await lobbyService.updateLobby(bestLobby.id, { 
              user_count: bestLobby.user_count + 1,
              last_activity: new Date()
            });
            
            // Navigate to study room
            navigate(`/study-room/${bestLobby.id}`);
          } catch (updateErr) {
            throw new Error(`Error updating lobby: ${updateErr instanceof Error ? updateErr.message : 'Unknown error'}`);
          }
        } else {
          // Create a new lobby
          try {
            const newLobby = await lobbyService.createLobby(subjects);
            navigate(`/study-room/${newLobby.id}`);
          } catch (createErr) {
            console.error('Error creating lobby:', createErr);
            // Create a local lobby ID and navigate to it
            // This is a fallback in case the database operations fail
            const localLobbyId = 'local-' + Math.random().toString(36).substring(2, 15);
            navigate(`/study-room/${localLobbyId}`);
          }
        }
      } catch (err) {
        console.error("Matching error:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };

    findOrCreateLobby();
  }, [subjects, navigate, isRetrying]);

  const handleRetry = () => {
    setIsRetrying(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-4">
      {error ? (
        <div className="bg-card rounded-2xl p-8 shadow-lg max-w-md">
          <h1 className="text-2xl font-semibold text-red-500 mb-4">Connection Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/select-subjects')}>
              Back to Subject Selection
            </Button>
            <Button onClick={handleRetry}>
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h1 className="mt-4 text-2xl font-semibold">Finding your study buddies...</h1>
          <p className="text-muted-foreground">Please wait while we connect you.</p>
        </>
      )}
    </div>
  );
};

export default Matching;