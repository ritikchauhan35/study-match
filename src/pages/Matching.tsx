import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const Matching = () => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isMatching, setIsMatching] = useState(true);
  const [timeWaiting, setTimeWaiting] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const subjects = localStorage.getItem('selectedSubjects');
    if (!subjects) {
      navigate('/select-subjects');
      return;
    }
    setSelectedSubjects(JSON.parse(subjects));
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeWaiting(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedSubjects.length === 0) return;

    const userId = crypto.randomUUID();
    localStorage.setItem('userId', userId);
    
    const matchingKey = selectedSubjects.sort().join(',');
    
    const channel = supabase
      .channel(`matching:${matchingKey}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const allPresences = Object.values(state).flat() as any[];
        
        // If there's another user, create a match
        if (allPresences.length >= 2) {
          const otherUser = allPresences.find((presence: any) => presence.user_id !== userId);
          if (otherUser && otherUser.user_id) {
            const roomId = [userId, otherUser.user_id].sort().join('-');
            localStorage.setItem('roomId', roomId);
            localStorage.setItem('matchedSubjects', JSON.stringify(selectedSubjects));
            navigate(`/study-room/${roomId}`);
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            subjects: selectedSubjects,
            joined_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSubjects, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="container max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-3xl p-12 shadow-2xl"
        >
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center gap-2 mb-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-primary rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Looking for your study partner...
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              We're matching you with someone studying the same topics
            </p>
            
            <div className="text-2xl font-mono text-primary mb-8">
              {formatTime(timeWaiting)}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">Your Selected Subjects</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedSubjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant="secondary"
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Taking too long? Try selecting different subjects or come back later when more people are online.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/select-subjects')}
                className="rounded-full"
              >
                Change Subjects
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default Matching;