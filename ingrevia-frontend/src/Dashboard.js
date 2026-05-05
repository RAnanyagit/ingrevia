import { useState, useEffect, useContext, useMemo } from "react";
import { API_URL } from "./config";
import { CartContext } from "./context/CartContext";
import ProductGrid from "./components/ProductGrid";
import Loader from "./components/Loader";
import AllergyImpactSummary from "./components/AllergyImpactSummary";

function Dashboard({ user }) {
  const [allProducts, setAllProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [sortOrder, setSortOrder] = useState("recommended");
  const [safeOnly, setSafeOnly] = useState(false);
  const [ingredientsInput, setIngredientsInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchDiscoveryData = async () => {
      try {
        const response = await fetch(`${API_URL}/products-with-risk?user_email=${user}`);
        const data = await response.json();
        if (response.ok) {
          setAllProducts(data);
        }
      } catch (err) {
        console.error("Discovery fetch failed", err);
      } finally {
        setFetchingProducts(false);
      }
    };
    fetchDiscoveryData();
  }, [user]);

  const analyzeIngredients = async () => {
    if (!ingredientsInput.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(`${API_URL}/analyze-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientsInput, user_email: user }),
      });
      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const processedProducts = useMemo(() => {
    let list = [...allProducts];
    if (safeOnly) {
      list = list.filter(p => p.risk === "Low" || p.risk === "Moderate");
    }

    if (sortOrder === "price") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "risk") {
      const order = { "Low": 0, "Moderate": 1, "High": 2, "Critical": 3 };
      list.sort((a, b) => order[a.risk] - order[b.risk]);
    } else {
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    return list;
  }, [allProducts, sortOrder, safeOnly]);

  const recommended = processedProducts.slice(0, 5);
  const safeProducts = processedProducts.filter(p => p.risk === "Low").slice(0, 5);
  const trending = processedProducts.reverse().slice(0, 5); // Just a demo "Trending"

  return (
    <div className="bg-gray-100 min-h-screen text-gray-900 pb-20">
      
      {/* 🚀 Amazon-Style Hero Section (Quick Analysis Tool) */}
      <div className="bg-[#232f3e] text-white py-12 px-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-2">Ingrevia <span className="text-yellow-400">Discovery</span></h1>
        <p className="text-gray-300 text-lg mb-8 max-w-2xl text-center">
          Analyze ingredients on the fly or discover products curated to your specific allergy profile.
        </p>
        
        <div className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-2xl text-gray-800 flex flex-col md:flex-row gap-4">
          <textarea
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            rows="3"
            placeholder="Paste ingredient list here (e.g. Water, Glycerin, Parabens)..."
            value={ingredientsInput}
            onChange={(e) => setIngredientsInput(e.target.value)}
          />
          <button 
            onClick={analyzeIngredients}
            disabled={analyzing}
            className="bg-yellow-400 hover:bg-yellow-500 font-bold py-3 px-8 rounded-lg transition-colors min-w-[160px]"
          >
            {analyzing ? "Analyzing..." : "Quick Analyze"}
          </button>
        </div>

        {analysisResult && (
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-blue-900 max-w-4xl w-full animate-fade-in shadow-lg">
            <h3 className="font-bold">⚡ Risk Category: {analysisResult.product_analysis.overall_risk_category}</h3>
            <p className="text-sm opacity-90">{analysisResult.product_analysis.analysis_reasoning}</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        
        {/* 🎛️ Filter Bar (Amazon-inspired) */}
        <div className="flex flex-wrap gap-6 items-center mb-10 bg-white p-4 rounded-xl shadow flex-row justify-between border border-gray-200">
          <div className="flex gap-4 items-center">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Sort By:</span>
            <select
              onChange={(e) => setSortOrder(e.target.value)}
              value={sortOrder}
              className="border border-gray-300 bg-gray-50 px-4 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-sm font-medium"
            >
              <option value="recommended">Best Recommended</option>
              <option value="risk">Low to High Risk</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={safeOnly}
                onChange={() => setSafeOnly(!safeOnly)}
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${safeOnly ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${safeOnly ? 'translate-x-4' : ''}`}></div>
            </div>
            <span className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition-colors">Safe Products Only</span>
          </label>
        </div>

        {fetchingProducts ? (
          <Loader />
        ) : (
          <div className="space-y-12">
            
            {/* 🧠 Smart Summary Widget */}
            <div className="mb-12">
              <AllergyImpactSummary products={allProducts} />
            </div>

            <section className="animate-fade-up">
              <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold border-b-4 border-yellow-400 pb-1">Recommended for You</h1>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>
              <ProductGrid products={recommended} onAddToCart={addToCart} />
            </section>

            <section className="animate-fade-up delay-100">
              <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold border-b-4 border-green-400 pb-1">Safe & Natural Picks</h1>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>
              <ProductGrid products={safeProducts} onAddToCart={addToCart} />
            </section>

            <section className="animate-fade-up delay-200">
              <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold border-b-4 border-blue-400 pb-1">Trending Discovery</h1>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>
              <ProductGrid products={trending} onAddToCart={addToCart} />
            </section>

          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
