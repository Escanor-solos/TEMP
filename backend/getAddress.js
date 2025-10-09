const ethers = require('ethers');

// PASTE YOUR PRIVATE KEY FROM YOUR .env FILE INSIDE THE QUOTES
const privateKey = "0x15a726b8dad14443dba219e87342943c0b74e18e687eda919250ca00f853f3f0";

// --- Do not edit below this line ---
try {
    if (!privateKey || privateKey.startsWith("Your_")) {
        throw new Error("Please replace the placeholder with your actual private key.");
    }
    // Ensure the private key starts with 0x for the Wallet constructor
    const keyWithPrefix = privateKey.startsWith("0x") ? privateKey : "0x" + privateKey;
    const wallet = new ethers.Wallet(keyWithPrefix);
    console.log("\n✅ Your Public Wallet Address is:");
    console.log(wallet.address);
    console.log("\n");
} catch (e) {
    console.error("\n❌ Error:", e.message);
}