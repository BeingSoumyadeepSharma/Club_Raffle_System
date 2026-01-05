"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, Download } from "lucide-react";

interface ReceiptModalProps {
  receipt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptModal({ receipt, open, onOpenChange }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(receipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raffle-receipt-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center">🎟️ Purchase Receipt</DialogTitle>
        </DialogHeader>
        <div className="receipt-box my-4 overflow-auto flex-1">
          <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words">{receipt}</pre>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" onClick={handleCopy} className="gap-2 w-full sm:w-auto">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Receipt
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDownload} className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
