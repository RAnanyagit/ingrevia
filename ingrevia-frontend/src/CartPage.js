import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "./context/CartContext";
import { API_URL } from "./config";

// 🚀 IMPORT LOCAL ASSETS
import cleanser from "./assets/products/cleanser.png";
import lotion from "./assets/products/lotion.png";
import serum from "./assets/products/serum.png";
import shampoo from "./assets/products/shampoo.png";
import sunscreen from "./assets/products/sunscreen.png";

const imageMap = {
  "cleanser.png": cleanser,
  "lotion.png": lotion,
  "serum.png": serum,
  "shampoo.png": shampoo,
  "sunscreen.png": sunscreen,
};

function CartPage({ userEmail }) {
  const { cart, removeFromCart, updateQuantity, clearCart, loading } = useContext(CartContext);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!userEmail || cart.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/checkout?user_email=${userEmail}`, {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok) {
        clearCart(); 
        navigate(`/order-summary/${data.order_id}`);
      } else {
        alert(data.detail || "Checkout failed");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#131921]"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center flex flex-col items-center">
            <div className="text-6xl mb-4">🧺</div>
            <h2 className="text-2xl font-bold text-gray-700">Your Ingrevia cart is empty</h2>
            <p className="text-gray-500 mb-6">Explore our curated safe skincare products and start shopping!</p>
            <Link 
              to="/" 
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Go Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* 🛒 ITEM LIST */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                   <h2 className="text-lg font-bold">Shopping Basket</h2>
                   <button onClick={clearCart} className="text-blue-600 text-sm hover:underline">Deselect all items</button>
                </div>

                <div className="space-y-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors rounded-lg group">
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-50 p-2 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                        <img 
                          src={imageMap[item.image] || item.image_url || cleanser} 
                          alt={item.name} 
                          className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">{item.name}</h3>
                          <p className="text-xl font-bold">₹{item.price * item.quantity}</p>
                        </div>
                        <p className="text-sm text-green-600 mt-1">In stock</p>
                        <p className="text-xs text-gray-500 mt-1 italic">Eligible for FREE Shipping</p>
                        
                        <div className="mt-4 flex items-center gap-6">
                          {/* Quantity Controls */}
                          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                            <button 
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-lg font-bold transition-colors"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              −
                            </button>
                            <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                            <button 
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-lg font-bold transition-colors"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="h-4 w-[1px] bg-gray-200"></div>

                          <button 
                            className="text-sm text-blue-600 hover:underline hover:text-red-600 transition-colors"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                   <h2 className="text-lg">Subtotal ({totalItems} items): <span className="font-bold text-xl">₹{subtotal}</span></h2>
                </div>
              </div>
            </div>

            {/* 💳 CHECKOUT PANEL */}
            <aside className="bg-white p-6 rounded-xl shadow-md border border-gray-200 sticky top-24">
              <div className="flex items-center gap-2 text-green-700 text-xs font-bold mb-4">
                 <div className="w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center">✓</div>
                 Your order qualifies for FREE Shipping.
              </div>

              <h2 className="text-xl font-bold mb-4">Subtotal ({totalItems} items): <span className="text-2xl">₹{subtotal}</span></h2>
              
              <div className="flex items-center gap-2 mb-6">
                <input type="checkbox" className="w-4 h-4 text-yellow-400" id="gift" />
                <label htmlFor="gift" className="text-sm text-gray-700">This order contains a gift</label>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-black font-bold py-3 rounded-lg shadow-sm border border-yellow-500 transition-all text-sm"
              >
                Proceed to Checkout
              </button>

              <div className="mt-6 border-t border-gray-100 pt-6">
                 <h3 className="text-sm font-bold mb-3">Safe Skincare Commitment</h3>
                 <p className="text-xs text-gray-500 leading-relaxed">
                    Every product in your cart is cross-verified against your personal allergy profile. We prioritize your skin health with every recommendation.
                 </p>
              </div>
            </aside>

          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
