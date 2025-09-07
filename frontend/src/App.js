import {
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

const BACKEND_URL = "http://localhost:8000";

function App() {
  const [model, setModel] = useState("llama");
  const [file, setFile] = useState(null);
  const [abstract, setAbstract] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatEnabled, setChatEnabled] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAbstract("");
    setChatHistory([]);
    setChatEnabled(false);
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
    setAbstract("");
    setChatHistory([]);
    setChatEnabled(false);
  };

  const handleSummarize = async () => {
    if (!file) return;
    setLoading(true);
    const endpoint =
      model === "llama"
        ? `${BACKEND_URL}/generate-abstract-llama/`
        : `${BACKEND_URL}/generate-abstract-led/`;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setAbstract(data.abstract || data.error || "");
    setLoading(false);
    if (model === "llama" && !data.error) setChatEnabled(true);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("question", chatInput);
    const res = await fetch(`${BACKEND_URL}/llama-chat/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setChatHistory([
      ...chatHistory,
      { question: chatInput, answer: data.answer || data.error },
    ]);
    setChatInput("");
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Scientific Paper Abstract Generator
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Select value={model} onChange={handleModelChange} fullWidth>
          <MenuItem value="llama">Llama (with Chatbot)</MenuItem>
          <MenuItem value="led">LED</MenuItem>
        </Select>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ marginTop: 16, marginBottom: 16 }}
        />
        <Button
          variant="contained"
          onClick={handleSummarize}
          disabled={!file || loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : "Summarize"}
        </Button>
      </Paper>
      {abstract && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Abstract</Typography>
          <Typography>{abstract}</Typography>
        </Paper>
      )}
      {chatEnabled && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Ask Questions (Chatbot)</Typography>
          {chatHistory.map((item, idx) => (
            <div key={idx}>
              <Typography color="primary">Q: {item.question}</Typography>
              <Typography color="secondary">A: {item.answer}</Typography>
            </div>
          ))}
          <TextField
            label="Ask about the paper"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <Button
            variant="outlined"
            onClick={handleChat}
            disabled={loading || !chatInput}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : "Ask"}
          </Button>
        </Paper>
      )}
    </Container>
  );
}

export default App;
