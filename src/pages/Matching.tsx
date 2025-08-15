import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { lobbyService, Lobby } from "@/services/api";
import { socket } from "@/lib/socket";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = 'searching' | 'waiting' | 'matched' | 'error';

const Matching = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjects } = location.state || { subjects: [] };

  const [status, setStatus] = useState<Status>('searching');
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Effect for finding or creating a lobby
  useEffect(() => {
    if (subjects.length === 0) {
      navigate("/select-subjects");
      return;
    }

    const findOrCreateLobby = async () => {
      setStatus('searching');
      setError(null);

      try {
        const lobbies = await lobbyService.findMatchingLobbies(subjects);
        const bestLobby = lobbies.length > 0 ? lobbies[0] : null; // Already sorted by backend

        if (bestLobby) {
          // Join existing lobby
          await lobbyService.updateLobby(bestLobby.id, {
            user_count: bestLobby.user_count + 1,
          });
          setStatus('matched');
          navigate(`/study-room/${bestLobby.id}`);
        } else {
          // Create a new lobby and wait
          const newLobby = await lobbyService.createLobby(subjects);
          setLobbyId(newLobby.id);
          setStatus('waiting');
          // We will now wait for the socket listener to handle the next step
        }
      } catch (err) {
        console.error("Matching error:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setStatus('error');
      }
    };

    findOrCreateLobby();
  }, [subjects, navigate, isRetrying]);

  // Effect for socket.io listener
  useEffect(() => {
    if (status === 'waiting' && lobbyId) {
      // Join the socket room for this lobby
      socket.emit('join_room', lobbyId);

      const handleUserJoined = (updatedLobby: Lobby) => {
        if (updatedLobby.id === lobbyId && updatedLobby.user_count > 1) {
          setStatus('matched');
          navigate(`/study-room/${lobbyId}`);
        }
      };

      socket.on('user-joined', handleUserJoined);

      // Cleanup listener on component unmount or if status changes
      return () => {
        socket.off('user-joined', handleUserJoined);
        socket.emit('leave_room', lobbyId);
      };
    }
  }, [status, lobbyId, navigate]);

  const handleRetry = () => {
    setIsRetrying(!isRetrying); // Toggle to trigger re-run of the effect
  };

  const getStatusContent = () => {
    switch (status) {
      case 'searching':
        return {
          title: "Finding your study buddies...",
          message: "Please wait while we search for an available study room.",
        };
      case 'waiting':
        return {
          title: "Waiting for a match...",
          message: "We've created a new study room for you. Waiting for another student to join.",
        };
      case 'matched':
        return {
          title: "Match found!",
          message: "Redirecting you to your study room...",
        };
      case 'error':
        return {
          title: "Connection Error",
          message: error || 'An unknown error occurred.',
        };
      default:
        return {
          title: "Matching...",
          message: "Please wait.",
        };
    }
  };

  const { title, message } = getStatusContent();

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <div className="bg-card rounded-2xl p-8 shadow-lg max-w-md">
          <h1 className="text-2xl font-semibold text-red-500 mb-4">{title}</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/select-subjects')}>
              Back to Selection
            </Button>
            <Button onClick={handleRetry}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

export default Matching;