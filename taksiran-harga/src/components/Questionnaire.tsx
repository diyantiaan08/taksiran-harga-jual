import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionnaireItem, QuestionnaireAnswer } from "@/types/appraisal";

interface QuestionnaireProps {
  questions: QuestionnaireItem[];
  onSubmit: (answers: QuestionnaireAnswer[]) => void;
}

const Questionnaire = ({ questions, onSubmit }: QuestionnaireProps) => {
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setAnswer = (id: string, value: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const handleSubmit = () => {
    const result: QuestionnaireAnswer[] = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id],
    }));
    setIsSubmitting(true);
    setTimeout(() => onSubmit(result), 250);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-[0_8px_18px_-12px_rgba(217,119,6,0.7)]">
            <ClipboardList className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-bold text-foreground">Kondisi Barang</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Jawab pertanyaan berikut untuk mendapatkan taksiran yang akurat
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="p-4 rounded-2xl border border-white/70 bg-white/85 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] ring-1 ring-black/5 space-y-3"
          >
            <p className="text-sm font-medium text-foreground">
              <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
              {q.question}
            </p>

            {q.type === "boolean" ? (
              <div className="flex gap-2">
                {[
                  { val: true, label: "Ya", icon: CheckCircle2 },
                  { val: false, label: "Tidak", icon: XCircle },
                ].map(({ val, label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => setAnswer(q.id, val)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-medium transition-all",
                      answers[q.id] === val
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {q.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(q.id, opt)}
                    className={cn(
                      "h-10 rounded-lg border text-sm font-medium transition-all",
                      answers[q.id] === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="gold"
        size="lg"
        className="w-full h-12 rounded-xl"
        disabled={!allAnswered || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Memuat
          </span>
        ) : (
          <>
            Lihat Taksiran
            <ArrowRight className="w-4 h-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  );
};

export default Questionnaire;
