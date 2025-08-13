import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const POPULAR_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Literature", 
  "History", "Computer Science", "Psychology", "Economics", "Philosophy",
  "Art", "Music", "Language Learning", "Medicine", "Engineering"
];

const SubjectSelection = () => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const navigate = useNavigate();

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const addCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, customSubject.trim()]);
      setCustomSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
  };

  const startMatching = () => {
    if (selectedSubjects.length > 0) {
      localStorage.setItem('selectedSubjects', JSON.stringify(selectedSubjects));
      navigate('/matching');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            What do you want to study?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your subjects and we'll match you with someone studying the same topics right now.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-8 shadow-lg mb-8"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">Popular Subjects</h2>
          <div className="flex flex-wrap gap-3 mb-8">
            {POPULAR_SUBJECTS.map((subject) => (
              <Badge
                key={subject}
                variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 text-sm rounded-full transition-all hover:scale-105 ${
                  selectedSubjects.includes(subject) 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-background text-foreground border-2 hover:border-primary hover:text-primary"
                }`}
                onClick={() => toggleSubject(subject)}
              >
                {subject}
              </Badge>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">Add Custom Subject</h3>
              <div className="flex gap-2">
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Type your subject..."
                  className="rounded-full border-2 focus:border-primary"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
                />
                <Button 
                  onClick={addCustomSubject}
                  variant="outline"
                  className="rounded-full px-6"
                >
                  Add
                </Button>
              </div>
            </div>

            {selectedSubjects.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">Selected Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSubjects.map((subject) => (
                    <Badge
                      key={subject}
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {subject}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-red-500"
                        onClick={() => removeSubject(subject)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <Button
            onClick={startMatching}
            disabled={selectedSubjects.length === 0}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Find Study Partner
          </Button>
          {selectedSubjects.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Select at least one subject to continue
            </p>
          )}
        </motion.div>
      </div>
    </main>
  );
};

export default SubjectSelection;