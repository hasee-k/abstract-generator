import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  type: "user" | "system";
  content: string;
  sources?: string[];
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  isLoading?: boolean;
  /** NEW: disable input/submit until a doc is present */
  disabled?: boolean;
  /** NEW: custom placeholder for the input */
  placeholder?: string;
}

export const ChatPanel = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading = false,
  disabled = false,
  placeholder,
}: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isLoading) return;
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <Card className="h-full flex flex-col border-primary/20">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Ask about this paper
          </CardTitle>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearChat}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          The assistant is grounded to your uploaded paper; it won't include
          outside sources.
        </p>

        {disabled && (
          <p className="text-xs text-muted-foreground mt-2">
            Upload a PDF or paste text to enable Q&amp;A.
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1 mb-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No questions yet. Try asking about:
                </p>
                <div className="space-y-2">
                  <div className="bg-accent/50 rounded-md p-2 text-sm text-left">
                    "What are the main findings and their significance?"
                  </div>
                  <div className="bg-accent/50 rounded-md p-2 text-sm text-left">
                    "How does the methodology compare to previous work?"
                  </div>
                  <div className="bg-accent/50 rounded-md p-2 text-sm text-left">
                    "What are the limitations of this study?"
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.sources.map((source, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-background/50"
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <div
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              placeholder ??
              "Example: What are the main findings and their significance?"
            }
            disabled={isLoading || disabled}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading || disabled}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
