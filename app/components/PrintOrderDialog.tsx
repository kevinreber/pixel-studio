/**
 * Print Order Dialog Component
 *
 * Allows users to order prints of images
 */

import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Loader2, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrintProduct {
  id: string;
  name: string;
  description: string | null;
  sizes: Array<{
    name: string;
    dimensions: string;
    basePrice: number;
  }>;
}

interface PrintOrderDialogProps {
  imageId: string;
  imageTitle?: string;
  className?: string;
}

export function PrintOrderDialog({
  imageId,
  imageTitle,
  className,
}: PrintOrderDialogProps) {
  const productsFetcher = useFetcher();
  const priceFetcher = useFetcher();
  const orderFetcher = useFetcher();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "shipping" | "confirm" | "success">("select");
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    country: "US",
    postalCode: "",
    phone: "",
  });

  // Load products when dialog opens
  const loadProducts = useCallback(() => {
    if (productsFetcher.state === "idle" && !productsFetcher.data) {
      productsFetcher.load("/api/print/products");
    }
  }, [productsFetcher]);

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open, loadProducts]);

  // Calculate price when selection changes
  const submitPrice = useCallback(() => {
    if (selectedProduct && selectedSize) {
      priceFetcher.submit(
        {
          productId: selectedProduct.id,
          size: selectedSize,
          quantity: quantity.toString(),
        },
        { method: "POST", action: "/api/print/calculate" }
      );
    }
  }, [selectedProduct, selectedSize, quantity, priceFetcher]);

  useEffect(() => {
    submitPrice();
  }, [submitPrice]);

  const products = productsFetcher.data?.products as PrintProduct[] | undefined;
  const pricing = priceFetcher.data?.pricing;
  const isSubmitting = orderFetcher.state === "submitting";

  const handleProductSelect = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    setSelectedProduct(product || null);
    setSelectedSize("");
  };

  const handleSubmitOrder = () => {
    orderFetcher.submit(
      JSON.stringify({
        imageId,
        productId: selectedProduct!.id,
        size: selectedSize,
        quantity,
        shippingAddress,
      }),
      {
        method: "POST",
        action: "/api/print/orders",
        encType: "application/json",
      }
    );
  };

  // Handle order success
  useEffect(() => {
    if (orderFetcher.data?.success) {
      setStep("success");
    }
  }, [orderFetcher.data]);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const renderSelectStep = () => (
    <div className="space-y-4">
      {/* Product Selection */}
      <div>
        <Label>Product Type</Label>
        <Select
          value={selectedProduct?.id || ""}
          onValueChange={handleProductSelect}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Choose a product..." />
          </SelectTrigger>
          <SelectContent>
            {products?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProduct?.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {selectedProduct.description}
          </p>
        )}
      </div>

      {/* Size Selection */}
      {selectedProduct && (
        <div>
          <Label>Size</Label>
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choose a size..." />
            </SelectTrigger>
            <SelectContent>
              {selectedProduct.sizes.map((size) => (
                <SelectItem key={size.name} value={size.name}>
                  {size.name} ({size.dimensions}) - {formatPrice(size.basePrice)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Quantity */}
      {selectedSize && (
        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="mt-2 w-24"
          />
        </div>
      )}

      {/* Price Summary */}
      {pricing && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Estimated Shipping</span>
            <span>{formatPrice(pricing.estimatedShipping)}</span>
          </div>
          {pricing.creatorRoyalty > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Creator Royalty (10%)</span>
              <span>{formatPrice(pricing.creatorRoyalty)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium border-t pt-2">
            <span>Total</span>
            <span>{formatPrice(pricing.total)}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderShippingStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={shippingAddress.name}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, name: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="address1">Address Line 1</Label>
          <Input
            id="address1"
            value={shippingAddress.address1}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, address1: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="address2">Address Line 2 (optional)</Label>
          <Input
            id="address2"
            value={shippingAddress.address2}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, address2: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={shippingAddress.city}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, city: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            value={shippingAddress.state}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, state: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            value={shippingAddress.postalCode}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Select
            value={shippingAddress.country}
            onValueChange={(value) =>
              setShippingAddress({ ...shippingAddress, country: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Order Summary</h4>
        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Product:</span>{" "}
            {selectedProduct?.name}
          </p>
          <p>
            <span className="text-muted-foreground">Size:</span> {selectedSize}
          </p>
          <p>
            <span className="text-muted-foreground">Quantity:</span> {quantity}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium">Shipping To</h4>
        <div className="text-sm">
          <p>{shippingAddress.name}</p>
          <p>{shippingAddress.address1}</p>
          {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
          <p>
            {shippingAddress.city}, {shippingAddress.state}{" "}
            {shippingAddress.postalCode}
          </p>
          <p>{shippingAddress.country}</p>
        </div>
      </div>

      {pricing && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex justify-between font-medium text-lg">
            <span>Total</span>
            <span>{formatPrice(pricing.total)}</span>
          </div>
        </div>
      )}

      {orderFetcher.data?.error && (
        <p className="text-sm text-destructive">{orderFetcher.data.error}</p>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Order Placed!</h3>
      <p className="text-muted-foreground mb-4">
        Your print order has been submitted. You&apos;ll receive a confirmation email
        shortly.
      </p>
      <p className="text-sm text-muted-foreground">
        Order ID: {orderFetcher.data?.orderId}
      </p>
    </div>
  );

  const canProceedToShipping = selectedProduct && selectedSize && pricing;
  const canProceedToConfirm =
    shippingAddress.name &&
    shippingAddress.address1 &&
    shippingAddress.city &&
    shippingAddress.state &&
    shippingAddress.postalCode;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn(className)}>
          <Printer className="h-4 w-4 mr-2" />
          Order Print
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {step === "success" ? "Order Confirmed" : "Order a Print"}
          </DialogTitle>
          {step !== "success" && (
            <DialogDescription>
              {imageTitle
                ? `Create a physical print of "${imageTitle}"`
                : "Turn your AI creation into a physical masterpiece"}
            </DialogDescription>
          )}
        </DialogHeader>

        {productsFetcher.state === "loading" ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {step === "select" && renderSelectStep()}
            {step === "shipping" && renderShippingStep()}
            {step === "confirm" && renderConfirmStep()}
            {step === "success" && renderSuccessStep()}

            {step !== "success" && (
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {step !== "select" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setStep(step === "confirm" ? "shipping" : "select")
                    }
                  >
                    Back
                  </Button>
                )}
                {step === "select" && (
                  <Button
                    onClick={() => setStep("shipping")}
                    disabled={!canProceedToShipping}
                  >
                    Continue to Shipping
                  </Button>
                )}
                {step === "shipping" && (
                  <Button
                    onClick={() => setStep("confirm")}
                    disabled={!canProceedToConfirm}
                  >
                    Review Order
                  </Button>
                )}
                {step === "confirm" && (
                  <Button onClick={handleSubmitOrder} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Place Order - ${pricing ? formatPrice(pricing.total) : ""}`
                    )}
                  </Button>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
