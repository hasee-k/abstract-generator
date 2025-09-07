import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

interface ParametersProps {
  wordBudget: string;
  onWordBudgetChange: (value: string) => void;
  style: string;
  onStyleChange: (value: string) => void;
  groundWithEvidence: boolean;
  onGroundWithEvidenceChange: (value: boolean) => void;
  mode: "transformer" | "llm";
}

export const Parameters = ({
  wordBudget,
  onWordBudgetChange,
  style,
  onStyleChange,
  groundWithEvidence,
  onGroundWithEvidenceChange,
  mode
}: ParametersProps) => {
  return (
    <Card className="border-accent bg-accent/20">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="word-budget" className="text-sm font-medium whitespace-nowrap">
              Word budget:
            </Label>
            <Select value={wordBudget} onValueChange={onWordBudgetChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="150">~150 words</SelectItem>
                <SelectItem value="220">~220 words</SelectItem>
                <SelectItem value="300">~300 words</SelectItem>
                <SelectItem value="400">~400 words</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="style" className="text-sm font-medium whitespace-nowrap">
              Style:
            </Label>
            <Select value={style} onValueChange={onStyleChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generic">Generic (default)</SelectItem>
                <SelectItem value="ieee">IEEE-concise</SelectItem>
                <SelectItem value="arxiv">arXiv-neutral</SelectItem>
                <SelectItem value="nature">Nature-compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "llm" && (
            <div className="flex items-center gap-2">
              <Switch
                id="ground-evidence"
                checked={groundWithEvidence}
                onCheckedChange={onGroundWithEvidenceChange}
              />
              <Label htmlFor="ground-evidence" className="text-sm font-medium">
                Ground with cited evidence
              </Label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};