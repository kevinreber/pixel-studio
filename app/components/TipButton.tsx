/**
 * Tip Button Component
 *
 * Allows users to send tips to creators
 */

import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TipButtonProps {
  recipientId: string;
  recipientUsername: string;
  imageId?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const QUICK_AMOUNTS = [5, 10, 25, 50];

export function TipButton({
  recipientId,
  recipientUsername,
  imageId,
  className,
  variant = "outline",
  size = "default",
}: TipButtonProps) {
  const fetcher = useFetcher();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [message, setMessage] = useState("");

  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;

  const handleSubmit = () => {
    fetcher.submit(
      {
        recipientId,
        amount: amount.toString(),
        message,
        ...(imageId ? { imageId } : {}),
      },
      { method: "POST", action: "/api/tips/send" }
    );
  };

  // Close dialog on success
  if (isSuccess && open) {
    setTimeout(() => {
      setOpen(false);
      setAmount(10);
      setMessage("");
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={cn(className)}>
          <Gift className="h-4 w-4 mr-2" />
          Tip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Send a tip to @{recipientUsername}</DialogTitle>
          <DialogDescription>
            Show your appreciation for this creator&apos;s work
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-lg font-medium">Tip sent successfully!</p>
            <p className="text-muted-foreground">Thank you for supporting creators</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Quick amounts */}
              <div>
                <Label>Quick amounts</Label>
                <div className="flex gap-2 mt-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={amount === amt ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(amt)}
                    >
                      {amt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <Label htmlFor="amount">Custom amount (credits)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  max={1000}
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a thank you message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  className="mt-2"
                />
              </div>

              {/* Error message */}
              {fetcher.data?.error && (
                <p className="text-sm text-destructive">{fetcher.data.error}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || amount < 1}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>Send {amount} credits</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
