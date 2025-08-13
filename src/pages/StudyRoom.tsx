import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatPanel } from "@/components/ChatPanel";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { Users, Clock } from "lucide-react";

const StudyRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [matchedSubjects, setMatchedSubjects] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const storedRoomId = localStorage.getItem('roomId');
    const storedUserId = localStorage.getItem('userId');
    const storedSubjects = localStorage.getItem('matchedSubjects');
    
    if (!storedRoomId || !storedUserId || !storedSubjects || storedRoomId !== roomId) {
      navigate('/select-subjects');
      return;
    }
    
    setUserId(storedUserId);
    setMatchedSubjects(JSON.parse(storedSubjects));
  }, [roomId, navigate]);

  const findNewPartner = () => {
    // Clear current session data but keep subjects
    localStorage.removeItem('roomId');
    localStorage.removeItem('userId');
    navigate('/matching');
  };

  if (!matchedSubjects.length) {
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
                {matchedSubjects.map((subject) => (
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
              <ChatPanel channelName={`study-room:${roomId}`} />
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
