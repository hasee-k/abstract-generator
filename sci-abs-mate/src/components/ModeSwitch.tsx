import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModeSwitchProps {
  activeMode: "transformer" | "llm";
  onModeChange: (mode: "transformer" | "llm") => void;
}

export const ModeSwitch = ({ activeMode, onModeChange }: ModeSwitchProps) => {
  return (
    <div className="bg-secondary/50 p-1 rounded-lg w-fit mx-auto">
      <div className="flex gap-1">
        <Button
          variant={activeMode === "transformer" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("transformer")}
          className={cn(
            "transition-all duration-200",
            activeMode === "transformer" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-foreground hover:bg-accent"
          )}
        >
          Transformer Summarizer
        </Button>
        <Button
          variant={activeMode === "llm" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("llm")}
          className={cn(
            "transition-all duration-200",
            activeMode === "llm" 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-foreground hover:bg-accent"
          )}
        >
          LLM Summarizer & Q&A
        </Button>
      </div>
    </div>
  );
};