import { useEffect, useState, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "./context/CartContext";
import { API_URL } from "./config";
import ProductGrid from "./components/ProductGrid";

function ResultsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("safe-first");

  const query = new URLSearchParams(useLocation().search);
  const allergy = query.get("allergy");
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    if (!allergy) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetch(`${API_URL}/search-products?allergy=${allergy}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Search failed:", err);
        setLoading(false);
      });
  }, [allergy]);

  const processedProducts = useMemo(() => {
    let list = [...products];
    
    // Filter
    if (filter === "safe") {
      list = list.filter(p => p.risk === "Low");
    }

    // Sort
    list.sort((a, b) => {
      if (sort === "low-high") return a.price - b.price;
      if (sort === "high-low") return b.price - a.price;
      if (sort === "safe-first") {
        const riskOrder = { "Low": 0, "Moderate": 1, "Medium": 1, "High": 2, "Critical": 3 };
        const riskA = riskOrder[a.risk] !== undefined ? riskOrder[a.risk] : 99;
        const riskB = riskOrder[b.risk] !== undefined ? riskOrder[b.risk] : 99;
        if (riskA !== riskB) return riskA - riskB;
        return (b.rating || 0) - (a.rating || 0); // Tiered by rating if risk is same
      }
      return 0;
    });

    return list;
  }, [products, filter, sort]);

  const formattedAllergy = allergy ? allergy.split(",").map(a => a.trim()).join(", ") : "";

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* 🟢 Search Results Header */}
      <div className="bg-white border-b border-gray-200 py-6 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-medium text-gray-600">
              Results for <span className="text-gray-900 font-bold block md:inline text-2xl group cursor-default">
                "{formattedAllergy}"
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 italic">
              {processedProducts.length} items found crossing your allergy profile
            </p>
          </div>

          <div className="flex gap-4 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
             <button 
                onClick={() => setFilter(filter === "safe" ? "all" : "safe")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  filter === "safe" 
                  ? "bg-green-100 text-green-700 border-2 border-green-200" 
                  : "bg-white text-gray-600 border-2 border-transparent hover:border-gray-200"
                }`}
             >
                {filter === "safe" ? "✓ Showing Safe Only" : "🛡️ Filter Safe Only"}
             </button>

             <div className="h-6 w-[1px] bg-gray-300"></div>

             <select 
                className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
             >
                <option value="safe-first">Sort by: Safety First</option>
                <option value="low-high">Sort by: Price: Low to High</option>
                <option value="high-low">Sort by: Price: High to Low</option>
             </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#131921]"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-200 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No results found</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              We couldn't find any products matching <b>"{formattedAllergy}"</b>. Try searching for broader terms or specific ingredients.
            </p>
            <button 
              className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl transition-all"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <ProductGrid products={processedProducts} onAddToCart={addToCart} />
        )}
      </div>

    </div>
  );
}

export default ResultsPage;
