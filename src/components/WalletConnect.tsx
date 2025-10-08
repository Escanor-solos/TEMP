// src/components/WalletConnect.tsx

import { useState } from "react";
import { ethers, Signer } from "ethers";
import { Button } from "@/components/ui/button";
import { Wallet, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WalletConnectProps {
  hasGeneratedCode: boolean;
  onDeploy: () => Promise<void>;
}

export const WalletConnect = ({ hasGeneratedCode, onDeploy }: WalletConnectProps) => {
  const [signer, setSigner] = useState<Signer | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [action, setAction] = useState<"connect" | "deploy" | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected", {
        description: "Please install the MetaMask extension to continue.",
      });
      return;
    }

    setIsLoading(true);
    setAction("connect");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const connectedSigner = await provider.getSigner();
      const connectedAddress = await connectedSigner.getAddress();

      setSigner(connectedSigner);
      setAddress(connectedAddress);

      toast.success("Wallet connected successfully!", {
        description: `Connected as ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`
      });
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error("Connection rejected", { description: "You need to connect your wallet to proceed." });
      } else {
        toast.error("Connection failed", { description: error.message });
      }
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const deployToBlockchain = async () => {
    setIsLoading(true);
    setAction("deploy");
    toast.info("Deployment initiated...", {
      description: "Your code is being sent to the server for deployment.",
    });

    try {
      await onDeploy();
    } catch (error: any) {
        toast.error("Deployment failed", { description: error.message });
    } finally {
        setIsLoading(false);
        setAction(null);
    }
  };

  const isConnected = !!signer;

  return (
    <div className="flex items-center gap-3">
      {!isConnected ? (
        <Button
          onClick={connectWallet}
          variant="outline"
          className="border-primary/50 hover:bg-primary/10"
          disabled={isLoading}
        >
          {isLoading && action === "connect" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4 mr-2" />
          )}
          {isLoading && action === "connect" ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <>
          <div className="px-3 py-2 rounded-md bg-card/50 border border-border text-xs font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <Button
            onClick={deployToBlockchain}
            disabled={!hasGeneratedCode || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isLoading && action === "deploy" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isLoading && action === "deploy" ? "Deploying..." : "Deploy"}
          </Button>
        </>
      )}
    </div>
  );
};
