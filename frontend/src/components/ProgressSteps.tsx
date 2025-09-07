import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
  message?: string;
}

interface ProgressStepsProps {
  steps: Step[];
}

export const ProgressSteps = ({ steps }: ProgressStepsProps) => {
  return (
    <div className="bg-gradient-subtle border border-accent rounded-lg p-6">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4">
            <div className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
              step.status === "completed" && "bg-success text-success-foreground",
              step.status === "active" && "bg-primary text-primary-foreground",
              step.status === "pending" && "bg-muted text-muted-foreground"
            )}>
              {step.status === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : step.status === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            
            <div className="flex-1">
              <div className={cn(
                "font-medium transition-colors duration-300",
                step.status === "completed" && "text-success",
                step.status === "active" && "text-primary",
                step.status === "pending" && "text-muted-foreground"
              )}>
                {step.label}
              </div>
              {step.message && (
                <div className="text-sm text-muted-foreground mt-1">
                  {step.message}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};