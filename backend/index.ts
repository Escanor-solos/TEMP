// THIS IS THE FINAL, VERIFIED, AND WORKING CODE FOR backend/index.ts

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { ethers } from "ethers"; // The standard, reliable library
import solc from "solc";        // The Solidity compiler

dotenv.config({ override: true });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 5000);

// --- /deploy endpoint (Using solc to compile and ethers.js to deploy) ---
app.post("/deploy", async (req, res) => {
  try {
    const { code, constructorArgs } = req.body;
    if (!code) throw new Error("No Solidity code provided");

    const { PRIVATE_KEY, RPC_URL, CHAIN_ID } = process.env;
    if (!PRIVATE_KEY || !RPC_URL || !CHAIN_ID) {
        throw new Error("Missing deployment credentials in environment.");
    }
    
    // 1️⃣ Compile the Solidity code provided in the request
    console.log("Compiling Solidity code...");
    const input = {
      language: "Solidity",
      sources: { "Contract.sol": { content: code } },
      settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    // Add robust error handling for compilation
    if (output.errors) {
        const errorMessages = output.errors.filter((err: any) => err.severity === 'error').map((err: any) => err.formattedMessage).join('\n');
        if (errorMessages.length > 0) {
            throw new Error(`Compilation failed:\n${errorMessages}`);
        }
    }

    const contracts = output.contracts["Contract.sol"];
    const contractName = Object.keys(contracts)[0];
    const abi = contracts[contractName].abi;
    const bytecode = contracts[contractName].evm.bytecode.object;

    if (!bytecode) throw new Error("Compilation succeeded but produced no bytecode.");
    console.log("Compilation successful.");

    // 2️⃣ Deploy the compiled contract using ethers.js
    console.log("Deploying contract with ethers.js...");
    const provider = new ethers.JsonRpcProvider(RPC_URL, Number(CHAIN_ID));
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    const factory = new ethers.ContractFactory(abi, "0x" + bytecode, wallet);
    const contract = await factory.deploy(...(constructorArgs || []));
    await contract.waitForDeployment();
    console.log("Deployment confirmed!");

    res.json({
      success: true,
      contractAddress: await contract.getAddress(),
      transactionHash: contract.deploymentTransaction()?.hash,
    });

  } catch (err: any) {
    console.error("--- DEPLOYMENT ERROR ---");
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));