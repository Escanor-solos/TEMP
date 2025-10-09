var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import solc from "solc";
// --- CommonJS import for 0xGasless ---
var AgentKit = require("@0xgasless/agentkit");
var Agent = AgentKit.Agent;
dotenv.config({ override: true });
var app = express();
app.use(cors());
app.use(express.json());
var PORT = Number(process.env.PORT || 5000);
// --- Avalanche Fuji / EVM config ---
var PRIVATE_KEY = process.env.PRIVATE_KEY;
var RPC_URL = process.env.RPC_URL;
var CHAIN_ID = Number(process.env.CHAIN_ID || 43113);
// --- Ethers.js provider + wallet ---
var provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
var wallet = new ethers.Wallet(PRIVATE_KEY, provider);
console.log("✅ Wallet ready:", wallet.address);
// --- 0xGasless agent ---
var gaslessAgent = null;
function initGaslessAgent() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                gaslessAgent = new Agent({
                    apiKey: process.env.GASLESS_API_KEY,
                    paymasterUrl: process.env.PAYMASTER_URL,
                    privateKey: PRIVATE_KEY,
                    rpcUrl: RPC_URL,
                    chainId: CHAIN_ID,
                    eoa: true, // essential for gasless user transactions
                });
                console.log("✅ Gasless agent ready");
            }
            catch (err) {
                console.error("❌ Gasless agent failed:", err);
                gaslessAgent = null;
            }
            return [2 /*return*/];
        });
    });
}
initGaslessAgent();
// --- /build endpoint ---
app.post("/build", function (req, res) {
    var placeholderCode = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Success {}";
    res.json({ success: true, source: "placeholder", code: placeholderCode });
});
// --- /deploy endpoint ---
app.post("/deploy", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, code, constructorArgs, input, output, contracts, contractName, abi, bytecode, factory, contract, err_1;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                _a = req.body, code = _a.code, constructorArgs = _a.constructorArgs;
                if (!code)
                    throw new Error("No Solidity code provided");
                input = {
                    language: "Solidity",
                    sources: { "Contract.sol": { content: code } },
                    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
                };
                output = JSON.parse(solc.compile(JSON.stringify(input)));
                contracts = output.contracts["Contract.sol"];
                contractName = Object.keys(contracts)[0];
                abi = contracts[contractName].abi;
                bytecode = contracts[contractName].evm.bytecode.object;
                if (!bytecode)
                    throw new Error("Compilation failed");
                factory = new ethers.ContractFactory(abi, "0x" + bytecode, wallet);
                return [4 /*yield*/, factory.deploy.apply(factory, (constructorArgs || []))];
            case 1:
                contract = _c.sent();
                return [4 /*yield*/, contract.waitForDeployment()];
            case 2:
                _c.sent();
                res.json({
                    success: true,
                    address: contract.target,
                    txHash: (_b = contract.deploymentTransaction()) === null || _b === void 0 ? void 0 : _b.hash,
                });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _c.sent();
                console.error("--- DEPLOYMENT ERROR ---");
                console.error(err_1);
                res.status(500).json({ success: false, error: err_1.message });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// --- /gasless-call endpoint ---
app.post("/gasless-call", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, contractAddress, abi, method, args, tx, err_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                if (!gaslessAgent) {
                    return [2 /*return*/, res.status(503).json({
                            success: false,
                            error: "Gasless agent not ready. Check API key + Paymaster URL",
                        })];
                }
                _a = req.body, contractAddress = _a.contractAddress, abi = _a.abi, method = _a.method, args = _a.args;
                if (!contractAddress || !abi || !method)
                    throw new Error("Missing parameters");
                return [4 /*yield*/, gaslessAgent.sendTransaction(contractAddress, abi, method, args || [])];
            case 1:
                tx = _b.sent();
                res.json({
                    success: true,
                    txHash: tx.hash,
                    message: "Gasless transaction sent via 0xGasless paymaster",
                });
                return [3 /*break*/, 3];
            case 2:
                err_2 = _b.sent();
                console.error("--- GASLESS TRANSACTION ERROR ---");
                console.error(err_2);
                res.status(500).json({ success: false, error: err_2.message });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- /generate-frontend endpoint ---
app.post("/generate-frontend", function (req, res) {
    try {
        var prompt_1 = req.body.prompt;
        if (!prompt_1)
            throw new Error("No prompt provided");
        var reactCode = "\nimport React from \"react\";\n\nconst GeneratedComponent = () => {\n  return (\n    <div>\n      <h1>Generated Component</h1>\n      <p>Prompt: ".concat(prompt_1, "</p>\n    </div>\n  );\n};\n\nexport default GeneratedComponent;\n");
        res.json({ success: true, code: reactCode });
    }
    catch (err) {
        console.error("--- FRONTEND GENERATION ERROR ---");
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});
app.listen(PORT, function () { return console.log("\uD83D\uDE80 Backend running on port ".concat(PORT)); });
