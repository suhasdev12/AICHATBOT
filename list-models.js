import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  try {
    console.log("Fetching available models...\n");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const { models } = await res.json();

    console.log("✅ Available Models:\n");
    models.forEach((model) => {
      console.log(`📌 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      if (model.supportedGenerationMethods) {
        console.log(`   Supports: ${model.supportedGenerationMethods.join(", ")}`);
      }
      console.log("");
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listModels();