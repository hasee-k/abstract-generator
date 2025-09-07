import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Download, RefreshCw, Eye, EyeOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  section: string;
  snippet: string;
  id: string;
}

interface AbstractResultProps {
  abstract: string;
  style: string;
  wordCount: number;
  mode: "transformer" | "llm";
  sources?: Source[];
  onRegenerate: () => void;
}

export const AbstractResult = ({ 
  abstract, 
  style, 
  wordCount, 
  mode, 
  sources = [],
  onRegenerate 
}: AbstractResultProps) => {
  const [showSources, setShowSources] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(abstract);
  };

  const downloadText = (format: "txt" | "tex") => {
    const content = format === "tex" 
      ? `\\begin{abstract}\n${abstract}\n\\end{abstract}`
      : abstract;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abstract.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Generated Abstract</CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {style} • ~{wordCount} words
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="hover:bg-primary/10 hover:text-primary"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <div className="absolute top-full right-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="bg-popover border rounded-md shadow-lg p-1 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadText("txt")}
                      className="w-full justify-start text-sm"
                    >
                      .txt
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadText("tex")}
                      className="w-full justify-start text-sm"
                    >
                      .tex
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="hover:bg-primary/10 hover:text-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              
              {mode === "llm" && sources.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSources(!showSources)}
                  className="hover:bg-primary/10 hover:text-primary"
                >
                  {showSources ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showSources ? "Hide" : "Show"} sources
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {abstract}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {mode === "transformer" 
                ? "Output generated using the Transformer pipeline for stable scientific phrasing."
                : "Interactive abstract with Q&A capability enabled."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sources Panel */}
      {mode === "llm" && sources.length > 0 && (
        <Collapsible open={showSources} onOpenChange={setShowSources}>
          <CollapsibleContent>
            <Card className="border-accent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Supporting Sources
                  <Badge variant="outline">{sources.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className={cn(
                        "p-3 rounded-md border transition-all duration-200 cursor-pointer",
                        selectedSourceId === source.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50 hover:bg-accent/20"
                      )}
                      onClick={() => setSelectedSourceId(
                        selectedSourceId === source.id ? null : source.id
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {source.section}
                        </Badge>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          selectedSourceId === source.id && "rotate-180"
                        )} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {source.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};