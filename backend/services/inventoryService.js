const Product = require("../models/mongodb/Product");

class InventoryService {
  async checkInventory(productId, requestedQuantity) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (product.inventory < requestedQuantity) {
      throw new Error(
        `Insufficient inventory. Available: ${product.inventory}, Requested: ${requestedQuantity}`
      );
    }

    return {
      available: product.inventory,
      sufficient: product.inventory >= requestedQuantity,
      product: product,
    };
  }

  async updateInventory(productId, quantityChange) {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { inventory: quantityChange } },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  async reserveInventory(productId, quantity, reservationId) {
    // In a real system, you might want to implement inventory reservation
    // This prevents overselling during the checkout process
    const product = await Product.findById(productId);

    if (product.inventory < quantity) {
      throw new Error("Insufficient inventory for reservation");
    }

    // For now, we'll just check inventory
    // In production, you might want to implement a proper reservation system
    return true;
  }

  async releaseReservation(productId, quantity, reservationId) {
    // Release reserved inventory
    // This would be called if checkout fails or is cancelled
    return true;
  }

  async getLowStockProducts(threshold = 10) {
    return await Product.find({
      inventory: { $lte: threshold },
      isActive: true,
    }).select("name inventory");
  }

  async updateProductInventory(productId, newInventory) {
    const product = await Product.findByIdAndUpdate(
      productId,
      { inventory: newInventory },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }
}

module.exports = new InventoryService();
