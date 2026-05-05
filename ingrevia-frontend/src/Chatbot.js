import React, { useState } from "react";
import { API_URL } from "./config";
import "./App.css";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! I'm your Ingrevia assistant. Ask me about any skincare ingredient, or ask for a product recommendation!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const knowledgeBase = {
    paraben: "Parabens are preservatives. Some people are sensitive to them, and they are often avoided in 'clean' beauty.",
    sulfate: "Sulfates (like SLS) are cleansing agents that can be drying or irritating for sensitive skin.",
    fragrance: "Fragrance is a common allergen. If you have sensitive skin, look for 'fragrance-free' labels.",
    alcohol: "Simple alcohols like Denatured Alcohol can be drying. Fatty alcohols like Cetyl Alcohol are actually moisturizing!",
    silicone: "Silicones like Dimethicone give a smooth feel but can sometimes trap debris if not washed off properly.",
    niacinamide: "Niacinamide is a form of Vitamin B3. It's great for soothing skin and reducing redness!",
    hyaluronic: "Hyaluronic Acid is a humectant that holds 1000x its weight in water. Super hydrating!",
    salicylic: "Salicylic Acid (BHA) is great for oily and acne-prone skin as it penetrates deep into pores.",
    retinol: "Retinol is a powerhouse for anti-aging and skin texture, but use it only at night and always wear sunscreen!",
    vitamin: "Vitamin C is a great antioxidant that brightens skin and protects against environmental damage.",
  };

  const skinConcerns = {
    dry: "For dry skin, look for Hyaluronic Acid, Glycerin, and Ceramides. Avoid drying alcohols.",
    oily: "For oily skin, Salicylic Acid (BHA) and Niacinamide are excellent. Look for 'non-comedogenic' labels.",
    sensitive: "For sensitive skin, Aloe Vera and Centella Asiatica (Cica) are very soothing. Avoid fragrance and sulfates.",
    acne: "Acne-prone skin benefits from Salicylic Acid, Benzoyl Peroxide, and Niacinamide.",
    aging: "For aging skin, Retinol and Peptides are key for boosting collagen and reducing fine lines."
  };

  const categories = ["moisturizer", "cleanser", "serum", "cream", "sunscreen", "oil", "wash"];

  const fetchSuggestions = async (category = "", allergy = "") => {
    const email = localStorage.getItem("email");
    
    try {
      let url = `${API_URL}/products`;
      
      if (email && !allergy) {
        // Logged in: use personalized risk profile
        url = `${API_URL}/products-with-risk?email=${email}`;
      } else if (allergy) {
        // Specific allergy mentioned (e.g. "allergic to paraben"): use search-products
        url = `${API_URL}/search-products?allergy=${allergy}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (!Array.isArray(data)) return [];

      // Filter for safe products first (or search results already scored)
      let recommended = data.filter(p => p.risk === "Low" || p.risk === "Moderate" || !p.risk);
      
      if (category) {
        recommended = recommended.filter(p => 
          (p.name && p.name.toLowerCase().includes(category)) || 
          (p.description && p.description.toLowerCase().includes(category))
        );
      }

      return recommended.slice(0, 3); // Return top 3 suggestions
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
      return [];
    }
  };

  const normalizeQuery = (text) => {
    return text.toLowerCase()
      .replace(/frangrance|fragance|fragnance/g, "fragrance")
      .replace(/moisturiser/g, "moisturizer")
      .replace(/hiyaluronic|hyalironic/g, "hyaluronic")
      .replace(/niacinmide|niaciamide/g, "niacinamide");
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);

    const query = normalizeQuery(input);
    let botResponse = "";
    let suggestions = [];

    setLoading(true);

    // 1. Check for specific allergy mention (e.g. "allergic to paraben")
    const allergyMatch = query.match(/allergic to ([a-z]+)/i) || query.match(/allergy to ([a-z]+)/i);
    const specificAllergy = allergyMatch ? allergyMatch[1] : "";

    // 2. Check for recommendation intent
    const isRecommendation = query.includes("suggest") || query.includes("recommend") || query.includes("find") || query.includes("show me") || query.includes("good for");
    
    if (isRecommendation || specificAllergy) {
      const foundCategory = categories.find(cat => query.includes(cat)) || "";
      suggestions = await fetchSuggestions(foundCategory, specificAllergy);
      
      if (suggestions.length > 0) {
        botResponse = specificAllergy 
          ? `I've found some products safe for your ${specificAllergy} allergy:`
          : `Based on your profile, here are some safe ${foundCategory || 'products'} I recommend:`;
      } else {
        botResponse = "I couldn't find any specific safe products matching that right now, but I'm checking our latest catalog!";
      }
    } else {
      // 3. Check for skin suitability / concerns
      for (const concern in skinConcerns) {
        if (query.includes(concern) || query.includes("suitable for my skin") || query.includes("good for my skin")) {
          botResponse = `For ${concern} skin concerns: ${skinConcerns[concern]} Try asking for a product recommendation for ${concern} skin!`;
          // If they just ask "what is suitable for my skin", we use 'dry' or a generic fallback if we don't know skin type
          if (query.includes("my skin") && !query.includes(concern)) {
             botResponse = "To help you better, could you tell me if your skin is Dry, Oily, Sensitive, or Acne-prone? Each skin type needs different ingredients!";
          }
          break;
        }
      }

      if (!botResponse) {
        // 4. Check knowledge base
        for (const key in knowledgeBase) {
          if (query.includes(key)) {
            botResponse = knowledgeBase[key];
            break;
          }
        }
      }
    }

    if (!botResponse) {
      botResponse = "I'm not sure about that, but I can help you find safe skincare! Try asking 'Suggest a moisturizer' or ask about 'Parabens'.";
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "bot", text: botResponse, suggestions }]);
      setLoading(false);
    }, 600);

    setInput("");
  };

  return (
    <>
      <div className="chatbot-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "❌" : "🤖"}
      </div>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Ingrevia Assistant</span>
            <button onClick={() => setIsOpen(false)} style={{background: 'none', border: 'none', color: '#fff', cursor: 'pointer'}}>_</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg msg-${m.role}`}>
                {m.text}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="suggestion-list">
                    {m.suggestions.map((p, idx) => (
                      <div key={idx} className="suggestion-item" onClick={() => window.location.href = `/results?search=${p.name}`}>
                        <div className="suggestion-info">
                          <div className="suggestion-name">{p.name}</div>
                          <div className="suggestion-price">₹{p.price}</div>
                        </div>
                        <span style={{fontSize: '0.8rem'}}>➡️</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="msg msg-bot">...</div>}
          </div>
          <div className="chatbot-input">
            <input 
              type="text" 
              placeholder="Ask me something..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend}>{loading ? "." : "Send"}</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
