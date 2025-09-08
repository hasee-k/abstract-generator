import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Model } from "../pages/Index";

interface ModeSwitchProps {
  activeMode: Model;
  onModeChange: (mode: Model) => void;
}

const models: { key: Model; label: string }[] = [
  { key: "LED", label: "LED Summarizer" },
  { key: "Llama", label: "Llama Summarizer & Q&A" },
  { key: "Gemine", label: "Gemine Summarizer" },
];

export const ModeSwitch = ({ activeMode, onModeChange }: ModeSwitchProps) => {
  return (
    <div className="bg-secondary/50 p-1 rounded-lg w-fit mx-auto">
      <div className="flex gap-1">
        {models.map((model) => (
          <Button
            key={model.key}
            variant={activeMode === model.key ? "default" : "ghost"}
            size="sm"
            onClick={() => onModeChange(model.key)}
            className={cn(
              "transition-all duration-200",
              activeMode === model.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-accent"
            )}
          >
            {model.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
