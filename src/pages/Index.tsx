import { useState, useEffect } from "react";
import { ethers, Signer } from "ethers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CodeDisplay } from "@/components/CodeDisplay";
import { Loader2, Sparkles, Code2, Rocket, Wallet, Upload } from "lucide-react";
import { Toaster, toast } from "sonner"; // Make sure to import Toaster to see notifications

// This function intelligently determines the backend URL whether you are local or on Gitpod
const getBackendUrl = () => {
  // VITE_GITPOD_WORKSPACE_URL is an environment variable automatically set by Gitpod
  if (import.meta.env.VITE_GITPOD_WORKSPACE_URL) {
    const gitpodUrl = new URL(import.meta.env.VITE_GITPOD_WORKSPACE_URL);
    // The backend runs on port 5000 in the same Gitpod workspace
    return `https://5000-${gitpodUrl.hostname}`;
  }
  // Fallback for local development
  return "http://localhost:5000";
};

const BACKEND_URL = getBackendUrl();


const Index = () => {
  // State to check if component is mounted (for preventing hydration errors)
  const [isMounted, setIsMounted] = useState(false);

  // State for the generator
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [solidityCode, setSolidityCode] = useState("");
  // Note: The current backend only generates Solidity. reactCode is kept for future use.
  const [reactCode, setReactCode] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  // State for Wallet and Deployment
  const [signer, setSigner] = useState<Signer | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected", { description: "Please install the MetaMask extension." });
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const connectedSigner = await provider.getSigner();
      const connectedAddress = await connectedSigner.getAddress();
      setSigner(connectedSigner);
      setAddress(connectedAddress);
      toast.success("Wallet connected!", { description: `Connected as ${connectedAddress.slice(0, 6)}...` });
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error("Connection rejected by user.");
      } else {
        toast.error("Connection failed", { description: error.message });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description for your dApp");
      return;
    }
    setLoading(true);
    setSolidityCode("");
    setReactCode("");
    setHasGenerated(false);
    try {
      const response = await fetch(`${BACKEND_URL}/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate code from server.");
      }

      setSolidityCode(data.code);
      setHasGenerated(true);
      toast.success("Code generated successfully!", { description: `Generated from ${data.source}` });

    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to generate code.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!solidityCode) {
      toast.error("No code has been generated to deploy.");
      return;
    }
    setIsDeploying(true);
    toast.info("Deployment initiated...", { description: "Sending code to the server for deployment." });
    try {
      const response = await fetch(`${BACKEND_URL}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: solidityCode }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Deployment failed. Check server logs.');
      }
      
      const contractAddress = result.result?.contractAddress;
      // Using Mumbai testnet explorer
      const explorerUrl = `https://mumbai.polygonscan.com/address/${contractAddress}`;

      toast.success("Deployment Complete!", {
        description: `Contract deployed to: ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`,
        action: {
          label: "View on Polygonscan",
          onClick: () => window.open(explorerUrl, '_blank'),
        },
      });
    } catch (error: any) {
      toast.error("Deployment failed", { description: error.message });
    } finally {
      setIsDeploying(false);
    }
  };

  const isConnected = !!signer;

  const renderWalletButtons = () => {
    if (!isMounted) {
      return <div className="h-10 w-36 bg-card/20 animate-pulse rounded-md"></div>;
    }
    return (
      <div className="flex items-center gap-3">
        {!isConnected ? (
          <Button onClick={connectWallet} variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300" disabled={isConnecting}>
            {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        ) : (
          <>
            <div className="px-3 py-2 rounded-md bg-card/50 border border-border text-xs font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <Button onClick={handleDeploy} disabled={!hasGenerated || isDeploying} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {isDeploying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {isDeploying ? "Deploying..." : "Deploy"}
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen ">
        {/* Added the Toaster component so your notifications will appear */}
        <Toaster position="top-right" />
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="text-xl font-bold text-white">
          <span className="text-primary">Vibe</span>Coding
        </div>
        {renderWalletButtons()}
      </header>
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4"
            style={{ 
              border: '1px solid currentColor',
              borderRadius: '9999px',
              borderColor: 'hsl(var(--muted-foreground)/0.5)',
            }}>
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">AI-Powered Development Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            <span className="text-white">Build dApps with </span>
            <span style={{ color: '#ff9933' }}>Simple</span>
            <br />
            <span style={{ 
              backgroundImage: 'linear-gradient(to bottom, #ff9933, #66ccff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}>Prompts</span>
          </h1>
          
          <div className="p-4 rounded-xl bg-black/20 backdrop-blur-sm mx-auto max-w-2xl">
            <p className="text-xl text-muted-foreground font-semibold">
              VibeCoding transforms natural language into production-ready decentralized applications. 
              Get gasless dApps on Avalanche with 0xGasless integration.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <Textarea
              placeholder="Describe your dApp... (e.g., 'Create an NFT marketplace with royalty payments on Avalanche')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 text-lg bg-background border-input resize-none"
              disabled={loading || isDeploying}
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Powered by AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-accent" />
                  <span>Deploy in seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <span>Full-stack code</span>
                </div>
              </div>
              
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim() || isDeploying} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {hasGenerated && (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CodeDisplay solidityCode={solidityCode} reactCode={reactCode} />
          </div>
        )}

        {!hasGenerated && (
          <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-8">
            <div className="group text-center p-6 rounded-xl bg-black/20 backdrop-blur-sm transition-all duration-300 hover:bg-black/30 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/50 cursor-pointer">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Smart Contracts</h3>
              <p className="text-muted-foreground">
                AI-generated Solidity with 0xGasless & ERC-4337 on Avalanche
              </p>
            </div>

            <div className="group text-center p-6 rounded-xl bg-black/20 backdrop-blur-sm transition-all duration-300 hover:bg-black/30 hover:scale-[1.03] hover:shadow-2xl hover:shadow-accent/50 cursor-pointer">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Gasless Frontend</h3>
              <p className="text-muted-foreground">
                0xGasless SDK integrated UI for seamless user experience
              </p>
            </div>

            <div className="group text-center p-6 rounded-xl bg-black/20 backdrop-blur-sm transition-all duration-300 hover:bg-black/30 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/50 cursor-pointer">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Deploy to Avalanche</h3>
              <p className="text-muted-foreground">
                Production-ready code for Avalanche C-Chain deployment
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;