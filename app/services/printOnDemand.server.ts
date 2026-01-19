/**
 * Print-on-Demand Service
 *
 * Integrates with print providers (Printful/Printify) to allow users
 * to order physical prints of their generated images
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

// ============================================
// TYPES
// ============================================

export interface ProductSize {
  name: string;
  dimensions: string;
  basePrice: number; // in cents
}

export interface PrintProductDetails {
  id: string;
  name: string;
  description: string | null;
  sizes: ProductSize[];
  provider: string;
  isActive: boolean;
}

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export interface CreateOrderParams {
  imageId: string;
  productId: string;
  size: string;
  quantity: number;
  shippingAddress: ShippingAddress;
  shippingMethod?: string;
}

export interface OrderDetails {
  id: string;
  status: string;
  price: number;
  shippingCost: number | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  image: {
    id: string;
    title: string | null;
  };
  product: {
    id: string;
    name: string;
  };
  size: string;
  quantity: number;
}

// ============================================
// CONSTANTS
// ============================================

// Default products (can be managed via admin panel later)
const DEFAULT_PRODUCTS: Omit<PrintProductDetails, "id">[] = [
  {
    name: "Canvas Print",
    description: "Museum-quality canvas print with solid wood frame",
    sizes: [
      { name: "Small", dimensions: '8" x 10"', basePrice: 2999 },
      { name: "Medium", dimensions: '16" x 20"', basePrice: 5999 },
      { name: "Large", dimensions: '24" x 36"', basePrice: 9999 },
    ],
    provider: "printful",
    isActive: true,
  },
  {
    name: "Poster",
    description: "Premium matte poster on thick paper",
    sizes: [
      { name: "Small", dimensions: '12" x 18"', basePrice: 1499 },
      { name: "Medium", dimensions: '18" x 24"', basePrice: 2499 },
      { name: "Large", dimensions: '24" x 36"', basePrice: 3499 },
    ],
    provider: "printful",
    isActive: true,
  },
  {
    name: "Metal Print",
    description: "HD aluminum print with stunning color depth",
    sizes: [
      { name: "Small", dimensions: '8" x 10"', basePrice: 4999 },
      { name: "Medium", dimensions: '16" x 20"', basePrice: 8999 },
      { name: "Large", dimensions: '24" x 30"', basePrice: 14999 },
    ],
    provider: "printful",
    isActive: true,
  },
  {
    name: "Framed Print",
    description: "Giclée print in premium wooden frame",
    sizes: [
      { name: "Small", dimensions: '8" x 10"', basePrice: 3999 },
      { name: "Medium", dimensions: '12" x 16"', basePrice: 5999 },
      { name: "Large", dimensions: '18" x 24"', basePrice: 8999 },
    ],
    provider: "printful",
    isActive: true,
  },
];

// Creator royalty percentage (10%)
const CREATOR_ROYALTY_PERCENT = 10;

// ============================================
// PRODUCT MANAGEMENT
// ============================================

/**
 * Initialize default products in database
 */
export async function initializeProducts(): Promise<void> {
  for (const product of DEFAULT_PRODUCTS) {
    await prisma.printProduct.upsert({
      where: {
        id: `default-${product.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {
        name: product.name,
        description: product.description,
        sizes: product.sizes as unknown as Prisma.InputJsonValue,
        provider: product.provider,
        isActive: product.isActive,
      },
      create: {
        id: `default-${product.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: product.name,
        description: product.description,
        sizes: product.sizes as unknown as Prisma.InputJsonValue,
        provider: product.provider,
        isActive: product.isActive,
      },
    });
  }

  Logger.info({
    message: "[PrintOnDemand] Default products initialized",
    metadata: { productCount: DEFAULT_PRODUCTS.length },
  });
}

/**
 * Get all available products
 */
export async function getAvailableProducts(): Promise<PrintProductDetails[]> {
  const products = await prisma.printProduct.findMany({
    where: { isActive: true },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    sizes: p.sizes as unknown as ProductSize[],
    provider: p.provider,
    isActive: p.isActive,
  }));
}

/**
 * Get a specific product
 */
export async function getProduct(productId: string): Promise<PrintProductDetails | null> {
  const product = await prisma.printProduct.findUnique({
    where: { id: productId },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    sizes: product.sizes as unknown as ProductSize[],
    provider: product.provider,
    isActive: product.isActive,
  };
}

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * Calculate order price
 */
export async function calculateOrderPrice(
  productId: string,
  size: string,
  quantity: number
): Promise<{
  basePrice: number;
  subtotal: number;
  estimatedShipping: number;
  creatorRoyalty: number;
  total: number;
}> {
  const product = await getProduct(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const sizeConfig = product.sizes.find((s) => s.name === size);
  if (!sizeConfig) {
    throw new Error("Invalid size selected");
  }

  const basePrice = sizeConfig.basePrice;
  const subtotal = basePrice * quantity;
  const estimatedShipping = calculateShippingEstimate(product.name, quantity);
  const creatorRoyalty = Math.floor(subtotal * (CREATOR_ROYALTY_PERCENT / 100));
  const total = subtotal + estimatedShipping;

  return {
    basePrice,
    subtotal,
    estimatedShipping,
    creatorRoyalty,
    total,
  };
}

/**
 * Estimate shipping cost based on product type and quantity
 */
function calculateShippingEstimate(productName: string, quantity: number): number {
  // Base shipping costs (in cents)
  const baseShipping: Record<string, number> = {
    "Canvas Print": 799,
    Poster: 499,
    "Metal Print": 999,
    "Framed Print": 899,
  };

  const base = baseShipping[productName] || 599;
  // Additional $2 per extra item
  return base + (quantity - 1) * 200;
}

/**
 * Create a print order
 */
export async function createPrintOrder(
  userId: string,
  params: CreateOrderParams
): Promise<{ orderId: string }> {
  // Validate image exists
  const image = await prisma.image.findUnique({
    where: { id: params.imageId },
    select: { id: true, userId: true, title: true, private: true },
  });

  if (!image) {
    throw new Error("Image not found");
  }

  // Can only print public images or own images
  if (image.private && image.userId !== userId) {
    throw new Error("Cannot print private images from other users");
  }

  // Calculate price
  const pricing = await calculateOrderPrice(params.productId, params.size, params.quantity);

  // Determine creator for royalties (if not printing own image)
  const creatorId = image.userId !== userId ? image.userId : null;
  const creatorEarnings = creatorId ? pricing.creatorRoyalty : null;

  // Create the order
  const order = await prisma.printOrder.create({
    data: {
      userId,
      imageId: params.imageId,
      productId: params.productId,
      size: params.size,
      quantity: params.quantity,
      price: pricing.total,
      shippingAddress: params.shippingAddress as unknown as Prisma.InputJsonValue,
      shippingMethod: params.shippingMethod || "standard",
      shippingCost: pricing.estimatedShipping,
      status: "pending",
      creatorId,
      creatorEarnings,
    },
  });

  // If there are creator earnings, record them
  if (creatorId && creatorEarnings) {
    await prisma.creatorEarnings.create({
      data: {
        userId: creatorId,
        source: "print_royalties",
        referenceId: order.id,
        referenceType: "print_order",
        amount: creatorEarnings,
      },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        type: "PRINT_ORDER_PLACED",
        recipientId: creatorId,
        actorId: userId,
        imageId: params.imageId,
      },
    });
  }

  Logger.info({
    message: "[PrintOnDemand] Order created",
    metadata: {
      orderId: order.id,
      userId,
      imageId: params.imageId,
      total: pricing.total,
    },
  });

  return { orderId: order.id };
}

/**
 * Get order details
 */
export async function getOrder(orderId: string, userId: string): Promise<OrderDetails | null> {
  const order = await prisma.printOrder.findFirst({
    where: {
      id: orderId,
      OR: [{ userId }, { creatorId: userId }],
    },
    include: {
      image: { select: { id: true, title: true } },
      product: { select: { id: true, name: true } },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    status: order.status,
    price: order.price,
    shippingCost: order.shippingCost,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    createdAt: order.createdAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    image: order.image,
    product: order.product,
    size: order.size,
    quantity: order.quantity,
  };
}

/**
 * Get user's orders
 */
export async function getUserOrders(
  userId: string,
  options: { limit?: number; offset?: number; status?: string } = {}
): Promise<OrderDetails[]> {
  const { limit = 20, offset = 0, status } = options;

  const orders = await prisma.printOrder.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    include: {
      image: { select: { id: true, title: true } },
      product: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    price: o.price,
    shippingCost: o.shippingCost,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    createdAt: o.createdAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    image: o.image,
    product: o.product,
    size: o.size,
    quantity: o.quantity,
  }));
}

/**
 * Cancel an order (only if not yet processing)
 */
export async function cancelOrder(orderId: string, userId: string): Promise<void> {
  const order = await prisma.printOrder.findFirst({
    where: { id: orderId, userId, status: "pending" },
  });

  if (!order) {
    throw new Error("Order not found or cannot be cancelled");
  }

  await prisma.printOrder.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  });

  // Remove creator earnings if applicable
  if (order.creatorId) {
    await prisma.creatorEarnings.updateMany({
      where: {
        referenceId: orderId,
        referenceType: "print_order",
        isPaidOut: false,
      },
      data: { amount: 0 },
    });
  }

  Logger.info({
    message: "[PrintOnDemand] Order cancelled",
    metadata: { orderId, userId },
  });
}

// ============================================
// PROVIDER INTEGRATION (MOCK)
// ============================================

/**
 * Submit order to print provider
 * In production, this would integrate with Printful/Printify API
 */
export async function submitOrderToProvider(orderId: string): Promise<{ providerId: string }> {
  const order = await prisma.printOrder.findUnique({
    where: { id: orderId },
    include: {
      image: true,
      product: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // TODO: Integrate with actual print provider API
  // For now, generate a mock provider order ID
  const providerId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await prisma.printOrder.update({
    where: { id: orderId },
    data: {
      status: "processing",
      providerOrderId: providerId,
    },
  });

  Logger.info({
    message: "[PrintOnDemand] Order submitted to provider",
    metadata: { orderId, providerId },
  });

  return { providerId };
}

/**
 * Handle provider webhook for order status updates
 */
export async function handleProviderWebhook(
  providerOrderId: string,
  status: string,
  trackingInfo?: { number: string; url: string }
): Promise<void> {
  const order = await prisma.printOrder.findFirst({
    where: { providerOrderId },
  });

  if (!order) {
    Logger.warn({
      message: "[PrintOnDemand] Order not found for provider webhook",
      metadata: { providerOrderId },
    });
    return;
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "shipped" && trackingInfo) {
    updateData.trackingNumber = trackingInfo.number;
    updateData.trackingUrl = trackingInfo.url;
    updateData.shippedAt = new Date();
  }

  if (status === "delivered") {
    updateData.deliveredAt = new Date();

    // Mark creator earnings as ready for payout
    if (order.creatorId) {
      // In a real system, you'd have a payout queue
      Logger.info({
        message: "[PrintOnDemand] Creator earnings ready for payout",
        metadata: { orderId: order.id, creatorId: order.creatorId },
      });
    }
  }

  await prisma.printOrder.update({
    where: { id: order.id },
    data: updateData,
  });

  Logger.info({
    message: "[PrintOnDemand] Order status updated",
    metadata: { orderId: order.id, status },
  });
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get print order statistics for a creator
 */
export async function getCreatorPrintStats(userId: string) {
  const [totalRoyalties, orderCount, topImages] = await Promise.all([
    prisma.creatorEarnings.aggregate({
      where: { userId, source: "print_royalties" },
      _sum: { amount: true },
    }),
    prisma.printOrder.count({
      where: { creatorId: userId },
    }),
    prisma.printOrder.groupBy({
      by: ["imageId"],
      where: { creatorId: userId },
      _count: { id: true },
      _sum: { creatorEarnings: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Get image details for top images
  const imageIds = topImages.map((t) => t.imageId);
  const images = await prisma.image.findMany({
    where: { id: { in: imageIds } },
    select: { id: true, title: true },
  });
  const imageMap = new Map(images.map((i) => [i.id, i]));

  return {
    totalRoyalties: totalRoyalties._sum.amount ?? 0,
    orderCount,
    topImages: topImages.map((t) => ({
      image: imageMap.get(t.imageId),
      orderCount: t._count.id,
      earnings: t._sum.creatorEarnings ?? 0,
    })),
  };
}

/**
 * Get popular products
 */
export async function getPopularProducts(limit: number = 5) {
  const products = await prisma.printOrder.groupBy({
    by: ["productId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const productIds = products.map((p) => p.productId);
  const productDetails = await prisma.printProduct.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(productDetails.map((p) => [p.id, p]));

  return products.map((p) => ({
    product: productMap.get(p.productId),
    orderCount: p._count.id,
  }));
}
