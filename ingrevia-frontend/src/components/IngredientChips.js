import React, { useContext } from 'react';
import { AllergyContext } from '../context/AllergyContext';

const IngredientChips = ({ ingredients }) => {
  const { allergies } = useContext(AllergyContext);
  
  if (!ingredients) return null;

  // Handle both string and array formats
  const list = typeof ingredients === 'string' 
    ? ingredients.split(',').map(i => i.trim()) 
    : ingredients;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {list.map((ing, i) => {
        const isAllergen = allergies.some(a =>
          ing.toLowerCase().includes(a.toLowerCase())
        );

        return (
          <span
            key={i}
            className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors duration-300 ${
              isAllergen
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isAllergen && <span className="mr-1">⚠️</span>}
            {ing}
          </span>
        );
      })}
    </div>
  );
};

export default IngredientChips;
