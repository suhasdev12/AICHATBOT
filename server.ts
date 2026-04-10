import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();
console.log("KEY:", process.env.OPENROUTER_API_KEY ? "✅ Loaded" : "❌ Missing");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FREE_MODELS = [
  "google/gemma-3-12b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "deepseek/deepseek-r1-distill-llama-70b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen2.5-72b-instruct:free",
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", async (req, res) => {
    const { prompt } = req.body;
    let lastError = "All models failed";

    for (const model of FREE_MODELS) {
      try {
        console.log(`Trying model: ${model}`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "HKBK Faculty AI",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await response.json();

        if (response.status === 429 || response.status === 503) {
          console.log(`Model ${model} rate limited, trying next...`);
          lastError = data?.error?.message || "Rate limited";
          continue;
        }

        if (!response.ok) {
          lastError = data?.error?.message || "OpenRouter error";
          continue;
        }

        console.log(`✅ Success with model: ${model}`);
        return res.json({ text: data.choices[0].message.content });
      } catch (error: any) {
        lastError = error.message;
        continue;
      }
    }

    res.status(429).json({ error: `All models rate limited. Try again in a minute. (${lastError})` });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();