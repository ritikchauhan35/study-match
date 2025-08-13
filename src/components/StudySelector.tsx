import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export type StudyInfo = {
  subject: string;
  topic: string;
  subtopic?: string;
  level: "School" | "College" | "Exam Prep" | "Other";
};

export function makeTopicKey({ subject, topic, subtopic, level }: StudyInfo) {
  return [subject.trim().toLowerCase(), topic.trim().toLowerCase(), (subtopic || "").trim().toLowerCase(), level.trim().toLowerCase()].join("::");
}

export const StudySelector = ({ value, onChange }: { value: StudyInfo; onChange: (v: StudyInfo) => void }) => {
  const levels = useMemo(() => ["School", "College", "Exam Prep", "Other"], []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" placeholder="e.g., Math" value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input id="topic" placeholder="e.g., Calculus" value={value.topic} onChange={(e) => onChange({ ...value, topic: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtopic">Subtopic (optional)</Label>
        <Input id="subtopic" placeholder="e.g., Integrals" value={value.subtopic || ""} onChange={(e) => onChange({ ...value, subtopic: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Level</Label>
        <Select value={value.level} onValueChange={(v) => onChange({ ...value, level: v as StudyInfo["level"] })}>
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
