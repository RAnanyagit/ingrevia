import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const AllergyImpactSummary = ({ products }) => {
  const stats = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    products.forEach(p => {
      const risk = p.risk?.toLowerCase();
      if (risk === 'low') counts.low++;
      else if (risk === 'medium' || risk === 'moderate') counts.medium++;
      else if (risk === 'high' || risk === 'critical') counts.high++;
    });
    return counts;
  }, [products]);

  const total = products.length;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#131921] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-700"
    >
      <div className="flex flex-col">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-yellow-400 text-2xl">🧠</span> Allergy Impact Summary
        </h2>
        <p className="text-gray-400 text-sm mt-1">Analyzing {total} products against your profile</p>
      </div>

      <div className="flex gap-4 md:gap-8 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-2xl font-black text-emerald-400">{stats.low}</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Safe Picks</span>
        </div>
        <div className="h-10 w-[1px] bg-gray-700 self-center hidden md:block"></div>
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-2xl font-black text-amber-400">{stats.medium}</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Caution</span>
        </div>
        <div className="h-10 w-[1px] bg-gray-700 self-center hidden md:block"></div>
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-2xl font-black text-red-500">{stats.high}</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">High Risk</span>
        </div>
      </div>

      <div className="bg-yellow-400/10 border border-yellow-400/20 px-4 py-2 rounded-lg text-yellow-400 text-xs font-medium max-w-[200px] text-center">
        AI is monitoring ingredients for your safety 🛡️
      </div>
    </motion.div>
  );
};

export default AllergyImpactSummary;
