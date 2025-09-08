import { AbstractResult } from "@/components/AbstractResult";
import { ChatPanel } from "@/components/ChatPanel";
import { FileUpload } from "@/components/FileUpload";
import { ModeSwitch } from "@/components/ModeSwitch";
import { Parameters } from "@/components/Parameters";
import { ProgressSteps } from "@/components/ProgressSteps";
import { TextInput } from "@/components/TextInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, MessageSquare } from "lucide-react";
import { useState } from "react";

export type Model = "LED" | "Llama" | "Gemine";
type Source = "file" | "text";
type ProcessingState = "idle" | "processing" | "completed" | "error";

interface Step {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
  message?: string;
}

interface ChatMessage {
  id: string;
  type: "user" | "system";
  content: string;
  sources?: string[];
}

const Index = () => {
  // Default to Llama so chat is visible
  const [model, setModel] = useState<Model>("Llama");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [activeSource, setActiveSource] = useState<Source>("file");
  const [wordBudget, setWordBudget] = useState("220");
  const [style, setStyle] = useState("generic");
  const [groundWithEvidence, setGroundWithEvidence] = useState(true);
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");

  // Seed a friendly welcome message in chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "system",
      content:
        "Welcome! Upload a PDF or paste text to enable Q&A about your paper. I’ll answer using only your document.",
    },
  ]);

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const [steps, setSteps] = useState<Step[]>([
    { id: "extract", label: "Extracting document", status: "pending" },
    { id: "analyze", label: "Analyzing sections", status: "pending" },
    { id: "summarize", label: "Summarizing", status: "pending" },
    { id: "finalize", label: "Finalizing abstract", status: "pending" },
  ]);

  const [generatedAbstract, setGeneratedAbstract] = useState<string>("");

  // Ready when we have either a file or sufficient pasted text
  const isDocReady = Boolean(selectedFile) || textContent.trim().length > 0;
  const canGenerate = Boolean(selectedFile) || textContent.trim().length > 100;

  const handleGenerateAbstract = async () => {
    if (!canGenerate) return;
    setProcessingState("processing");

    const stepSequence = [
      { step: "extract", message: "PDF parsed successfully", delay: 1000 },
      {
        step: "analyze",
        message: "Detected: Introduction, Methods, Results, Discussion",
        delay: 1500,
      },
      {
        step: "summarize",
        message: "Using section-aware summarization to preserve fidelity",
        delay: 2000,
      },
      {
        step: "finalize",
        message: "Abstract generated successfully",
        delay: 1000,
      },
    ];

    // Helper to run each step sequentially
    const runStep = (stepObj: (typeof stepSequence)[number]) =>
      new Promise<void>((resolve) => {
        setSteps((prev) =>
          prev.map((s) => ({
            ...s,
            status: s.id === stepObj.step ? "active" : s.status,
            message: s.id === stepObj.step ? stepObj.message : s.message,
          }))
        );
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s) => ({
              ...s,
              status: s.id === stepObj.step ? "completed" : s.status,
            }))
          );
          resolve();
        }, stepObj.delay);
      });

    // Run all steps in order
    for (const stepObj of stepSequence) {
      // For the "summarize" step, run abstract generation during the delay
      if (stepObj.step === "summarize") {
        setSteps((prev) =>
          prev.map((s) => ({
            ...s,
            status: s.id === stepObj.step ? "active" : s.status,
            message: s.id === stepObj.step ? stepObj.message : s.message,
          }))
        );
        // Start abstract generation and delay together
        const [result] = await Promise.all([
          generateAbstract(selectedFile, model),
          new Promise((resolve) => setTimeout(resolve, stepObj.delay)),
        ]);
        setSteps((prev) =>
          prev.map((s) => ({
            ...s,
            status: s.id === stepObj.step ? "completed" : s.status,
          }))
        );
        setGeneratedAbstract(result.abstract);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await runStep(stepObj);
      }
    }
    setProcessingState("completed");
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedFile) return; // Only allow if file is uploaded
    setIsChatLoading(true);

    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type: "user", content: message },
    ]);

    try {
      const result = await askLlamaChat(selectedFile, message);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "system",
          content: result.answer || result.error || "No answer.",
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "system",
          content: "Error contacting backend.",
        },
      ]);
    }
    setIsChatLoading(false);
  };

  const handleClearChat = () => {
    setChatMessages([]);
  };

  const handleRegenerate = () => {
    setProcessingState("idle");
    setSteps((prev) =>
      prev.map((s) => ({ ...s, status: "pending", message: undefined }))
    );
  };

  const getModeDescription = () => {
    if (model === "LED") {
      return "Fast, deterministic abstracts optimized for scientific language; best when you want stable, repeatable outputs.";
    }
    return "Conversational abstracts with the ability to ask questions about the paper; best when you want interactive exploration.";
  };

  // You can place this inside your Index.tsx or as a utility function

  async function generateAbstract(selectedFile: File, model: Model) {
    const BACKEND_URL = "http://localhost:8000";
    let endpoint = "";
    if (model === "LED") endpoint = `${BACKEND_URL}/generate-abstract-led/`;
    else if (model === "Llama")
      endpoint = `${BACKEND_URL}/generate-abstract-llama/`;
    else if (model === "Gemine")
      endpoint = `${BACKEND_URL}/generate-abstract-gemma/`;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("word_count", wordBudget);
    formData.append("style", style);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    // For LED: { abstract, chunks }
    // For Llama: { abstract }
    return data;
  }

  async function askLlamaChat(selectedFile: File, question: string) {
    const BACKEND_URL = "http://localhost:8000";
    let endpoint = ``;
    if (model === "Llama") endpoint = `${BACKEND_URL}/llama-chat/`;
    else if (model === "Gemine") endpoint = `${BACKEND_URL}/gemma-chat/`;
    else return { error: "Chat not supported for this model." };

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("question", question);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    // { answer: string } or { error: string }
    return data;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Intelligent Abstract Generator for Scientific Publications
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Upload a paper and generate a faithful, section-aware abstract—then
            ask follow-up questions.
          </p>
          <p className="text-sm text-muted-foreground">
            We process locally on the server; PDFs, DOCX, and plain text are
            supported.
          </p>
        </div>

        {/* Mode Switch */}
        <div className="mb-8">
          <ModeSwitch activeMode={model} onModeChange={setModel} />
          <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
            {getModeDescription()}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Input & Results */}
          <div className="xl:col-span-2 space-y-6">
            {/* Input Sources */}
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    onClearFile={() => setSelectedFile(null)}
                  />
                  <TextInput value={textContent} onChange={setTextContent} />
                </div>

                {/* Source Selection */}
                {selectedFile && textContent.trim().length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <RadioGroup
                      value={activeSource}
                      onValueChange={setActiveSource as any}
                    >
                      <div className="flex items-center space-x-6">
                        <Label className="text-sm font-medium">
                          Use this source:
                        </Label>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="file" id="source-file" />
                          <Label htmlFor="source-file" className="text-sm">
                            Uploaded file ({selectedFile.name})
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text" id="source-text" />
                          <Label htmlFor="source-text" className="text-sm">
                            Pasted text ({textContent.length} chars)
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parameters */}
            {canGenerate && (
              <Parameters
                wordBudget={wordBudget}
                onWordBudgetChange={setWordBudget}
                style={style}
                onStyleChange={setStyle}
                groundWithEvidence={groundWithEvidence}
                onGroundWithEvidenceChange={setGroundWithEvidence}
                mode={model}
              />
            )}

            {/* Generate Button */}
            {canGenerate && processingState === "idle" && (
              <div className="text-center">
                <Button
                  onClick={handleGenerateAbstract}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Generate Abstract
                </Button>
              </div>
            )}

            {/* Processing Steps */}
            {processingState === "processing" && (
              <ProgressSteps steps={steps} />
            )}

            {/* Results */}
            {processingState === "completed" && (
              <AbstractResult
                abstract={generatedAbstract}
                style={style}
                wordCount={218}
                model={model}
                sources={[
                  {
                    id: "1",
                    section: "Methods §2.1",
                    snippet:
                      "We developed a transformer-based architecture that processes scientific papers through section-aware analysis...",
                  },
                  {
                    id: "2",
                    section: "Results §3.4",
                    snippet:
                      "achieving 89% semantic coherence compared to human-generated abstracts...",
                  },
                  {
                    id: "3",
                    section: "Discussion §4.2",
                    snippet:
                      "These results suggest that automated abstract generation can significantly enhance research accessibility...",
                  },
                ]}
                onRegenerate={handleRegenerate}
              />
            )}
          </div>

          {/* Right Column - Chat (Desktop) */}
          {(model === "Llama" || model === "Gemine") && (
            <div className="hidden xl:block">
              <div className="sticky top-8 h-[600px]">
                <ChatPanel
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                  isLoading={isChatLoading}
                  disabled={!isDocReady}
                  placeholder={
                    isDocReady
                      ? "Ask about this paper…"
                      : "Upload a PDF or paste text, then ask anything."
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Chat Button */}
        {(model === "Llama" || model === "Gemine") && (
          <div className="xl:hidden fixed bottom-6 right-6">
            <Button
              onClick={() => setShowMobileChat(true)}
              size="lg"
              className="rounded-full shadow-elegant"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Q&A
            </Button>
          </div>
        )}

        {/* Mobile Chat Modal */}
        {showMobileChat && (model === "Llama" || model === "Gemine") && (
          <div className="xl:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full h-[70vh] bg-background border-t border-border rounded-t-lg">
              <div className="h-full relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowMobileChat(false)}
                  className="absolute top-4 right-4 z-10"
                >
                  ✕
                </Button>
                <ChatPanel
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                  isLoading={isChatLoading}
                  disabled={!isDocReady}
                  placeholder={
                    isDocReady
                      ? "Ask about this paper…"
                      : "Upload a PDF or paste text, then ask anything."
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border text-center">
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Model & Limitations
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Cite this tool
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
