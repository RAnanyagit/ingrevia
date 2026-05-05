import React, { createContext, useState, useEffect, useCallback } from "react";
import { API_URL } from "../config";

export const CartContext = createContext();

export const CartProvider = ({ children, userEmail }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/cart?user_email=${userEmail}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCart(data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add to cart
  const addToCart = async (product) => {
    if (!userEmail) return;
    
    // Optimistic Update
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    try {
      await fetch(`${API_URL}/cart/add?user_email=${userEmail}&product_id=${product.id}`, {
        method: "POST",
      });
      // Re-fetch to ensure sync with server
      fetchCart();
    } catch (error) {
      console.error("Error adding to cart:", error);
      fetchCart(); // Revert on error
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    if (!userEmail) return;

    setCart((prev) => prev.filter((item) => item.id !== productId));

    try {
      await fetch(`${API_URL}/cart/remove?user_email=${userEmail}&product_id=${productId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
      fetchCart();
    }
  };

  // Update Quantity
  const updateQuantity = async (productId, newQty) => {
    if (!userEmail) return;

    if (newQty <= 0) {
      return removeFromCart(productId);
    }

    // Optimistic Update
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQty } : item
      )
    );

    try {
      await fetch(`${API_URL}/cart/update?user_email=${userEmail}&product_id=${productId}&quantity=${newQty}`, {
        method: "PUT",
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      fetchCart();
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!userEmail) return;
    setCart([]);
    try {
      await fetch(`${API_URL}/cart/clear?user_email=${userEmail}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      fetchCart();
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, loading }}>
      {children}
    </CartContext.Provider>
  );
};
