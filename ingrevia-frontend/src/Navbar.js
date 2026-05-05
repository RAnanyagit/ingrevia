import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "./context/CartContext";

function Navbar({ user, logout }) {
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const { cart } = useContext(CartContext);

  const handleSearch = () => {
    if (searchInput.trim()) {
      navigate(`/results?allergy=${searchInput.trim()}`);
    }
  };

  const displayName = user ? user.split("@")[0] : "User";

  return (
    <nav className="bg-[#131921] text-white px-6 py-2 flex items-center justify-between sticky top-0 z-50 shadow-md">
      
      {/* Logo */}
      <div 
        className="flex items-center gap-1 text-2xl font-bold cursor-pointer mr-8" 
        onClick={() => navigate("/")}
      >
        <span className="text-yellow-400">🧪</span>
        <span className="tracking-tight">Ingrevia</span>
      </div>

      {/* Search Bar (Amazon Style) */}
      <div className="flex flex-1 mx-4 max-w-2xl group">
        <input
          type="text"
          placeholder="Search for ingredients or products (e.g. Paraben, SLS)..."
          className="w-full px-4 py-2 text-black focus:outline-none rounded-l-md border-2 border-transparent focus:border-[#febd69]"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          className="bg-[#febd69] hover:bg-[#f3a847] px-5 rounded-r-md text-gray-800 font-bold transition-colors"
        >
          🔍
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-6 ml-4">
        
        {/* User Account */}
        <div className="group relative cursor-pointer py-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-300">Hello, {displayName}</span>
            <span className="text-sm font-bold flex items-center gap-1 underline decoration-transparent group-hover:decoration-gray-300 transition-all">
              Account & Lists
            </span>
          </div>
          
          {/* Dropdown (Hover) */}
          <div className="absolute right-0 top-full hidden group-hover:block bg-white text-black p-4 rounded shadow-xl border border-gray-200 w-48 z-50 mt-1">
            <Link to="/profile" className="block py-2 px-3 hover:bg-gray-100 rounded text-sm">Your Profile</Link>
            <Link to="/history" className="block py-2 px-3 hover:bg-gray-100 rounded text-sm">Your Orders</Link>
            <div className="border-t border-gray-200 my-2"></div>
            <button 
              onClick={logout}
              className="w-full text-left py-2 px-3 hover:bg-red-50 text-red-600 rounded text-sm font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Orders */}
        <Link to="/history" className="flex flex-col cursor-pointer">
          <span className="text-[10px] text-gray-300">Returns</span>
          <span className="text-sm font-bold decoration-transparent hover:decoration-gray-300 underline">& Orders</span>
        </Link>

        {/* Cart */}
        <Link to="/cart" className="flex items-end gap-1 relative group cursor-pointer">
          <div className="relative">
             <span className="text-yellow-400 text-2xl">🛒</span>
             <span className="absolute -top-1 -right-2 bg-yellow-500 text-[#131921] rounded-full px-1.5 text-xs font-bold ring-2 ring-[#131921]">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
             </span>
          </div>
          <span className="text-sm font-bold hidden md:inline group-hover:text-yellow-400 transition-colors">Cart</span>
        </Link>

      </div>
    </nav>
  );
}

export default Navbar;
