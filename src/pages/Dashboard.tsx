import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/integrations/user/userUtils";
import { trackPresence } from "@/integrations/realtime/socketService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StudySelector, type StudyInfo, makeTopicKey } from "@/components/StudySelector";
import { PresenceList } from "@/components/PresenceList";
import { ChatPanel } from "@/components/ChatPanel";
import { PomodoroTimer } from "@/components/PomodoroTimer";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [presenceState, setPresenceState] = useState<Record<string, any[]>>({});
  const [study, setStudy] = useState<StudyInfo>({ subject: "", topic: "", subtopic: "", level: "School" });
  const topicKey = useMemo(() => makeTopicKey(study), [study]);

  useEffect(() => {
    const user = getCurrentUser();
    setUserId(user.id);
  }, []);

  useEffect(() => {
    document.title = "Dashboard – Study Match";
  }, []);

  useEffect(() => {
    if (!online || !userId || !topicKey) return;
    
    const presence = trackPresence(`study:${topicKey}`);
    
    presence.onSync((users) => {
      const formattedUsers = users.reduce((acc, user) => {
        if (!acc[user.id]) {
          acc[user.id] = [];
        }
        acc[user.id].push(user);
        return acc;
      }, {} as Record<string, any[]>);
      
      setPresenceState(formattedUsers);
    });
    
    return () => {
      presence.leave();
      setPresenceState({});
    };
  }, [online, userId, topicKey]);

  const canGoOnline = study.subject.trim() && study.topic.trim();

  return (
    <main className="container py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Set your study info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StudySelector value={study} onChange={setStudy} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch id="online" checked={online} onCheckedChange={(v) => setOnline(v)} disabled={!canGoOnline} />
                <Label htmlFor="online">I'm studying now</Label>
              </div>
              <Button onClick={() => setOnline((v) => !v)} disabled={!canGoOnline}>
                {online ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>People studying this topic</CardTitle>
          </CardHeader>
          <CardContent>
            <PresenceList users={presenceState as any} />
          </CardContent>
        </Card>
      </div>

      {online && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Group Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatPanel roomId={`group:${topicKey}`} />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Pomodoro Timer</CardTitle>
            </CardHeader>
            <CardContent>
              <PomodoroTimer />
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
