import React from 'react';
import { motion } from 'framer-motion';
import IngredientChips from './IngredientChips';
import RiskBar from './RiskBar';

const ProductCard = ({ product, onAddToCart }) => {
  const getRiskStyles = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'moderate':
      case 'medium':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'high':
      case 'critical':
        return 'border-red-200 bg-red-50 text-red-700';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 group relative overflow-hidden"
    >
      <div className="absolute top-3 right-3 z-10">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border shadow-sm backdrop-blur-md ${getRiskStyles(product.risk)}`}>
          {product.risk || "Unknown"}
        </span>
      </div>
      
      <div className="h-44 w-full overflow-hidden mb-4 flex items-center justify-center bg-gray-50/50 rounded-xl group-hover:bg-gray-50 transition-colors">
        <img
          src={product.image || product.image_url || "https://via.placeholder.com/200"}
          alt={product.name}
          className="h-full w-full object-contain p-4 transform group-hover:scale-110 transition-transform duration-700 ease-out"
        />
      </div>

      <div className="flex flex-col flex-1">
        <h2 className="text-sm font-bold line-clamp-2 min-h-[40px] text-gray-800 group-hover:text-[#232f3e] transition-colors leading-tight">
          {product.name}
        </h2>

        {/* Price & Rating */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-xl font-black text-gray-900">
            ₹{product.price}
          </p>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
            <span className="text-yellow-600 text-[10px] font-bold">⭐ {product.rating || "0.0"}</span>
          </div>
        </div>

        {/* Smart Visualization */}
        <RiskBar risk={product.risk} />
        <IngredientChips ingredients={product.ingredients} />

        {/* Why Risk / Analysis reasoning */}
        {(product.reason || product.recommendation_reason) && (
          <div className={`mt-4 p-3 rounded-xl text-[11px] leading-relaxed border ${
            product.risk?.toLowerCase() === 'low' 
              ? 'bg-emerald-50/30 border-emerald-100 text-emerald-800' 
              : 'bg-red-50/30 border-red-100 text-red-800'
          }`}>
            <span className="font-bold flex items-center gap-1 mb-0.5">
               {product.risk?.toLowerCase() === 'low' ? '✅ Safety Note:' : '⚠️ Analysis Alert:'}
            </span>
            {product.reason || product.recommendation_reason}
          </div>
        )}

        {/* Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="mt-5 w-full bg-[#facc15] hover:bg-[#eab308] active:scale-95 text-[#131921] font-bold py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> Add to Cart
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
