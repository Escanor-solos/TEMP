// PASTE THIS ENTIRE FINAL CODE BLOCK INTO backend/index.ts

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import OpenAI from "openai"; // Using the OpenAI library to talk to our local AI

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = Number(process.env.PORT || 5000);

// This function remains the same
async function getAgent() {
  const pkg = await import("@0xgasless/agentkit");
  const createAgent = (pkg as any)?.createAgent;
  if (!createAgent) throw new Error("createAgent not found in @0xgasless/agentkit");
  const { PRIVATE_KEY, RPC_URL, CHAIN_ID } = process.env;
  if (!PRIVATE_KEY || !RPC_URL || !CHAIN_ID) throw new Error("Missing deployment credentials in environment.");
  return await createAgent({ privateKey: PRIVATE_KEY, rpcUrl: RPC_URL, chainId: Number(CHAIN_ID) });
}

// This function now talks to your own local Ollama server
async function generateSolidityFromPrompt(prompt: string): Promise<{ source: string; code: string }> {
  // This is the special configuration for our local Ollama AI
  const ollama = new OpenAI({
    apiKey: 'ollama', // A dummy key is required, but it's not used
    baseURL: 'http://localhost:11434/v1', // This points to the Ollama server running inside our workspace
  });

  const masterPrompt = `You are an expert-level Solidity smart contract developer. Your task is to take a user's request and write a complete, secure, and well-commented Solidity smart contract. CRITICAL INSTRUCTIONS: Your output MUST be ONLY the Solidity code. DO NOT include any explanation or other text. The code MUST be complete and deployable, starting with "// SPDX-License-Identifier: MIT". User's Request: "${prompt}"`;

  const chatCompletion = await ollama.chat.completions.create({
    messages: [{ role: 'user', content: masterPrompt }],
    model: 'phi3', // Using the 'phi3' model we downloaded
  });

  const text = chatCompletion.choices[0]?.message?.content || "";
  if (!text) throw new Error("Received an empty response from local AI.");
  return { source: "local-ollama-phi3", code: text.trim() };
}

// Endpoints and app.listen remain the same
app.post("/build", async (req, res) => {
  try {
    const result = await generateSolidityFromPrompt(req.body.prompt || "");
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/deploy", async (req, res) => {
  try {
    const agent = await getAgent();
    const tx = await (agent as any).deployContract(req.body.code, req.body.constructorArgs || []);
    res.json({ success: true, result: tx });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));