import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CodeDisplayProps {
  solidityCode: string;
  reactCode: string;
}

export const CodeDisplay = ({ solidityCode, reactCode }: CodeDisplayProps) => {
  const [copiedSolidity, setCopiedSolidity] = useState(false);
  const [copiedReact, setCopiedReact] = useState(false);

  const copyToClipboard = async (code: string, type: "solidity" | "react") => {
    try {
      await navigator.clipboard.writeText(code);
      if (type === "solidity") {
        setCopiedSolidity(true);
        setTimeout(() => setCopiedSolidity(false), 2000);
      } else {
        setCopiedReact(true);
        setTimeout(() => setCopiedReact(false), 2000);
      }
      toast.success(`${type === "solidity" ? "Solidity" : "React"} code copied!`);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  return (
    <Card className="bg-card border-border">
      <Tabs defaultValue="solidity" className="w-full">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <TabsList className="bg-muted">
            <TabsTrigger value="solidity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Solidity Contract
            </TabsTrigger>
            <TabsTrigger value="react" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              React Frontend
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="solidity" className="m-0">
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-4 top-4 z-10 hover:bg-muted"
              onClick={() => copyToClipboard(solidityCode, "solidity")}
            >
              {copiedSolidity ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <pre className="overflow-x-auto p-6 text-sm">
              <code className="text-foreground font-mono">{solidityCode}</code>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="react" className="m-0">
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-4 top-4 z-10 hover:bg-muted"
              onClick={() => copyToClipboard(reactCode, "react")}
            >
              {copiedReact ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <pre className="overflow-x-auto p-6 text-sm">
              <code className="text-foreground font-mono">{reactCode}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
