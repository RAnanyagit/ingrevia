from fastapi import FastAPI, Depends, HTTPException, Request, Response
from contextlib import asynccontextmanager
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Optional, List
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from .database import SessionLocal, engine
from .models import Chemical, AnalysisLog, User, Base, UserAllergy, IngredientMapping, Product, CartItem, Order, OrderItem
from .risk_engine import calculate_product_risk
from .schemas import (
    AnalysisLogResponse, 
    IngredientListRequest, 
    UserCreate, 
    UserLogin,
    UserAllergyCreate
)
from .core.security import hash_password, verify_password
from .core.auth import create_access_token
from typing import List
from .core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from .core.logging import setup_logging
import time
import asyncio

logger = setup_logging()

async def initialize_db():
    # Database Initialization (non-blocking for Neon cold starts)
    max_retries = 10
    retry_delay = 2 # seconds
    
    loop = asyncio.get_event_loop()
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Database initialization attempt {attempt + 1}/{max_retries}...")
            # We use a standard sync call here, but wrap it to be safe and non-blocking
            await loop.run_in_executor(None, lambda: Base.metadata.create_all(bind=engine))
            logger.info("Database synchronized successfully. Ready for requests.")
            break
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                retry_delay *= 2 # Exponential backoff
            else:
                logger.error("Final database connection attempt failed. App may be unstable.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start database initialization in the background
    asyncio.create_task(initialize_db())
    yield

app = FastAPI(
    title="Ingrevia API",
    version="5.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Serve Static Files (for product images)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} "
        f"Status: {response.status_code} "
        f"Time: {process_time:.4f}s"
    )
    return response

# ----------------------------
# DEPENDENCY
# ----------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------------------
# ROOT
# ----------------------------

@app.get("/")
def root():
    return {"message": "Ingrevia API Running - Modular Version"}

# ----------------------------
# ANALYZE LIST
# ----------------------------

@app.post("/analyze-list")
def analyze_list(request: IngredientListRequest, db: Session = Depends(get_db)):
    # Clean and split ingredients
    ingredients_lower = [i.strip().lower() for i in request.ingredients.split(",")]

    # 1. Chemical Analysis (Risk Score)
    chemical_objects = db.query(Chemical).filter(
        func.lower(Chemical.name).in_(ingredients_lower)
    ).all()

    # Calculate risk using the dedicated engine
    overall_score, category, recognized, reasoning = calculate_product_risk(chemical_objects)

    # 2. Intelligence Layer: Ingredient Mapping
    mapped_ingredients = []
    for ing in ingredients_lower:
        mapping = db.query(IngredientMapping).filter(
            IngredientMapping.ingredient_name.ilike(ing.strip())
        ).first()
        
        if mapping:
            mapped_ingredients.append(mapping.normalized_name.lower())
        else:
            mapped_ingredients.append(ing.strip().lower())

    # 3. Personalized Allergy Check (Using Mapped/Normalized Ingredients)
    if request.user_email:
        user = db.query(User).filter(User.email == request.user_email).first()
        if user:
            user_allergies = db.query(UserAllergy).filter(UserAllergy.user_id == user.id).all()
            user_allergy_list = [a.allergen.lower() for a in user_allergies]

            allergy_found = False
            found_allergens = []

            # Check both original recognized ingredients AND mapped ingredients
            for ingredient_name in mapped_ingredients:
                if ingredient_name in user_allergy_list:
                    allergy_found = True
                    found_allergens.append(ingredient_name.capitalize())

            if allergy_found:
                category = "High"
                allergens_str = ", ".join(list(set(found_allergens)))
                reasoning = f"High risk because {allergens_str} family ingredients match your allergy profile. " + reasoning

    # Identify unrecognized ingredients properly
    recognized_names = [chem.name.lower() for chem in chemical_objects]
    unrecognized = [
        ing for ing in ingredients_lower
        if ing not in recognized_names
    ]

    log_entry = AnalysisLog(
        ingredient_input=request.ingredients,
        overall_score=overall_score,
        category=category,
        analysis_reasoning=reasoning
    )
    db.add(log_entry)
    db.commit()

    return {
        "product_analysis": {
            "overall_weighted_risk_score": overall_score,
            "overall_risk_category": category,
            "analysis_reasoning": reasoning
        },
        "recognized_ingredients": recognized,
        "unrecognized_ingredients": unrecognized
    }

# ----------------------------
# AUDIT LOGS
# ----------------------------

@app.get("/analysis-logs", response_model=list[AnalysisLogResponse])
def get_logs(
    category: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(AnalysisLog)

    if category:
        query = query.filter(AnalysisLog.category == category)

    logs = query.order_by(AnalysisLog.timestamp.desc()).limit(limit).all()
    return logs

# ----------------------------
# ANALYTICS
# ----------------------------

@app.get("/analytics/summary")
def risk_summary(db: Session = Depends(get_db)):
    total = db.query(func.count(AnalysisLog.id)).scalar()
    high = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.category == "High").scalar()
    moderate = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.category == "Moderate").scalar()
    low = db.query(func.count(AnalysisLog.id)).filter(AnalysisLog.category == "Low").scalar()

    return {
        "total_analyses": total,
        "high_risk": high,
        "moderate_risk": moderate,
        "low_risk": low
    }

# ----------------------------
# GET ALL CHEMICALS
# ----------------------------

@app.get("/chemicals")
def get_chemicals(db: Session = Depends(get_db)):
    chemicals = db.query(Chemical).all()
    return chemicals

# ----------------------------
# USER AUTHENTICATION
# ----------------------------

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        age=user.age,
        phone=user.phone
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email})
    return {"access_token": token}

# ----------------------------
# ALLERGY PROFILE
# ----------------------------

@app.post("/add-allergies")
def add_allergies(request: UserAllergyCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for item in request.allergies:
        existing = db.query(UserAllergy).filter(
            UserAllergy.user_id == user.id, 
            func.lower(UserAllergy.allergen) == item.lower()
        ).first()
        if not existing:
            entry = UserAllergy(user_id=user.id, allergen=item)
            db.add(entry)

    db.commit()
    return {"message": "Allergies saved"}

@app.get("/get-allergies")
def get_allergies(user_email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = db.query(UserAllergy).filter(UserAllergy.user_id == user.id).all()
    return [item.allergen for item in data]

# ----------------------------
# PRODUCT SEARCH
# ----------------------------

@app.get("/search-products")
def search_products(allergy: str, db: Session = Depends(get_db)):
    products = db.query(Product).all()
    
    # Split search terms (e.g., "Paraben, SLS" -> ["paraben", "sls"])
    search_terms = [a.strip().lower() for a in allergy.split(",")]
    
    # 1. Map search terms to their families/normalized names for smarter search
    normalized_search_terms = []
    for term in search_terms:
        mapping = db.query(IngredientMapping).filter(
            IngredientMapping.ingredient_name.ilike(term)
        ).first()
        if mapping:
            normalized_search_terms.append(mapping.normalized_name.lower())
        else:
            normalized_search_terms.append(term)

    result = []

    for product in products:
        product_ings = [i.strip().lower() for i in (product.ingredients or "").split(",")]
        risk = "Low"

        # 2. Get Chemical objects for ALL ingredients to calculate general risk
        chemical_objects = db.query(Chemical).filter(
            func.lower(Chemical.name).in_(product_ings)
        ).all()
        
        overall_score, risk_cat, _, _ = calculate_product_risk(chemical_objects)
        risk = risk_cat

        # 3. Check against User Search Terms (Allergies) for "Critical" risk
        has_allergy = False
        for ing_name in product_ings:
            mapping = db.query(IngredientMapping).filter(
                IngredientMapping.ingredient_name.ilike(ing_name)
            ).first()
            normalized_ing = mapping.normalized_name.lower() if mapping else ing_name
            
            if normalized_ing in normalized_search_terms or any(term in normalized_ing for term in normalized_search_terms):
                has_allergy = True
                break
        
        if has_allergy:
            risk = "Critical"
            reason = f"Matches search term: {allergy}"
        else:
            reason = f"General Risk: {risk_cat}"
            if risk_cat == "Low":
                reason = "Safe for your search profile"

        # 4. Calculate Recommendation Score
        score = 0
        if risk == "Low": score += 50
        elif risk == "Moderate": score += 20
        elif risk == "High": score -= 20
        elif risk == "Critical": score -= 100

        # Quality Boost (Rating)
        score += (product.rating or 0) * 10

        # Value Boost (Lower Price = Higher Score)
        price_bonus = max(0, 1000 - (product.price or 0)) / 50
        score += price_bonus

        result.append({
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "brand": product.brand or "Unknown Brand",
            "image": product.image_url or "https://via.placeholder.com/200",
            "risk": risk,
            "score": round(score, 1),
            "reason": reason,
            "rating": product.rating or 0.0,
            "reviews": product.reviews or 0,
            "description": product.description or "No description available."
        })

    # Sort by score descending (Recommended first)
    result.sort(key=lambda x: x["score"], reverse=True)
    return result


# ----------------------------
# CART MANAGEMENT
# ----------------------------

@app.post("/cart/add")
def add_to_cart(user_email: str, product_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if item exists
    item = db.query(CartItem).filter(CartItem.user_id == user.id, CartItem.product_id == product_id).first()
    if item:
        item.quantity += 1
    else:
        item = CartItem(user_id=user.id, product_id=product_id, quantity=1)
        db.add(item)
    
    db.commit()
    db.refresh(item)
    return item

@app.get("/cart")
def get_cart(user_email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        return []
    
    items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
    result = []
    for item in items:
        result.append({
            "id": item.product.id,
            "name": item.product.name,
            "price": item.product.price,
            "image": item.product.image_url or "https://via.placeholder.com/200",
            "quantity": item.quantity
        })

@app.put("/cart/update")
def update_quantity(user_email: str, product_id: int, quantity: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    item = db.query(CartItem).filter(CartItem.user_id == user.id, CartItem.product_id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    if quantity <= 0:
        db.delete(item)
    else:
        item.quantity = quantity
    
    db.commit()
    return {"message": "Quantity updated", "new_quantity": quantity}

@app.delete("/cart/remove")
def remove_from_cart(user_email: str, product_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    item = db.query(CartItem).filter(CartItem.user_id == user.id, CartItem.product_id == product_id).first()
    if item:
        db.delete(item)
        db.commit()
    
    return {"message": "Item removed from cart"}

@app.delete("/cart/clear")
def clear_cart(user_email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}

# ----------------------------
# ORDER & CHECKOUT
# ----------------------------

@app.post("/checkout")
def checkout(user_email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cart_items = db.query(CartItem).filter(CartItem.user_id == user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total = sum(item.product.price * item.quantity for item in cart_items)
    
    # Create Order
    new_order = Order(user_id=user.id, total_amount=total)
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Create Order Items
    for item in cart_items:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(order_item)
    
    # Clear Cart
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    
    return {"message": "Order placed successfully", "order_id": new_order.id}

@app.get("/order/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    items = []
    for item in order.items:
        items.append({
            "id": item.product.id,
            "name": item.product.name,
            "price": item.product.price,
            "quantity": item.quantity,
            "image": item.product.image_url or "https://via.placeholder.com/200"
        })
        
    return {
        "id": order.id,
        "total": order.total_amount,
        "status": order.status,
        "date": order.created_at,
        "items": items
    }

@app.get("/invoice/{order_id}")
def generate_invoice(order_id: int, db: Session = Depends(get_db)):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    import os

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    user = order.user
    user_allergies = [a.allergen.lower() for a in user.allergies]
    
    file_name = f"invoice_{order_id}.pdf"
    file_path = os.path.join("app/static/invoices", file_name)
    
    # Ensure directory exists (just in case)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    # Header
    elements.append(Paragraph(f"INVOICE - Order #{order.id}", styles["Title"]))
    elements.append(Paragraph(f"Customer: {user.name} ({user.email})", styles["Normal"]))
    elements.append(Paragraph(f"Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 20))
    
    # Items Table
    data = [["Product", "Qty", "Price", "Subtotal"]]
    safe_count = 0
    high_risk_count = 0
    
    for item in order.items:
        subtotal = item.product.price * item.quantity
        data.append([item.product.name, str(item.quantity), f"Rs. {item.product.price}", f"Rs. {subtotal}"])
        
        # Risk Calculation for Summary
        product_ings = [i.strip().lower() for i in item.product.ingredients.split(",")]
        # Check against allergies
        has_allergy = False
        for ing in product_ings:
            mapping = db.query(IngredientMapping).filter(IngredientMapping.ingredient_name.ilike(ing)).first()
            norm = mapping.normalized_name.lower() if mapping else ing
            if norm in user_allergies:
                has_allergy = True
                break
        
        if has_allergy:
            high_risk_count += 1
        else:
            # Check general chemicals
            chemicals = db.query(Chemical).filter(func.lower(Chemical.name).in_(product_ings)).all()
            _, risk_cat, _, _ = calculate_product_risk(chemicals)
            if risk_cat in ["High", "Moderate"]:
                high_risk_count += 1
            else:
                safe_count += 1

    table = Table(data, colWidths=[300, 50, 80, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"<b>Total Amount: Rs. {order.total_amount}</b>", styles["Heading3"]))
    
    # BONUS: Allergy Safety Summary
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("🛡️ Allergy Safety Summary", styles["Heading2"]))
    elements.append(Paragraph(f"- Products marked SAFE for your profile: <b>{safe_count}</b>", styles["Normal"]))
    elements.append(Paragraph(f"- Products with HIGH RISK / ALLERGY MATCH: <b>{high_risk_count}</b>", styles["Normal"]))
    
    if high_risk_count > 0:
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("<i>⚠️ Caution: Some items in this order might trigger allergies or contain high-risk ingredients.</i>", styles["Normal"]))

    doc.build(elements)
    
    return FileResponse(file_path, media_type='application/pdf', filename=file_name)

@app.get("/allergy-report/{order_id}")
def generate_allergy_report(order_id: int, db: Session = Depends(get_db)):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    import os

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    user = order.user
    user_allergies = [a.allergen.lower() for a in user.allergies]
    
    file_name = f"allergy_report_{order_id}.pdf"
    file_path = os.path.join("app/static/reports", file_name)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    # Header
    elements.append(Paragraph("Ingrevia Health & Allergy Report", styles["Title"]))
    elements.append(Paragraph(f"Customer: {user.name} ({user.email})", styles["Normal"]))
    elements.append(Paragraph(f"Order Date: {order.created_at.strftime('%Y-%m-%d')}", styles["Normal"]))
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("🛡️ Personal Allergy Analysis", styles["Heading2"]))
    elements.append(Paragraph("This report cross-references your order items against your personal allergy profile.", styles["Normal"]))
    elements.append(Spacer(1, 10))

    # Detailed Analysis
    data = [["Product", "Status", "Identified Allergens", "Recommendation"]]
    
    for item in order.items:
        product_ings = [i.strip().lower() for i in item.product.ingredients.split(",")]
        found_allergens = []
        for ing in product_ings:
            mapping = db.query(IngredientMapping).filter(IngredientMapping.ingredient_name.ilike(ing)).first()
            norm = mapping.normalized_name.lower() if mapping else ing
            if norm in user_allergies:
                found_allergens.append(norm.capitalize())
        
        status = "SAFE ✅" if not found_allergens else "MATCH FOUND ❌"
        allergy_str = ", ".join(list(set(found_allergens))) if found_allergens else "None"
        rec = "Safe to use" if not found_allergens else "Check alternatives"
        
        data.append([item.product.name, status, allergy_str, rec])

    table = Table(data, colWidths=[150, 100, 150, 120])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 30))
    
    # Recommendations Section
    elements.append(Paragraph("✨ Recommended Safe Alternatives", styles["Heading2"]))
    elements.append(Paragraph("If any items were flagged, we suggest these safe options from our marketplace:", styles["Normal"]))
    elements.append(Spacer(1, 15))
    
    risky_items = []
    for item in order.items:
        product_ings = [i.strip().lower() for i in item.product.ingredients.split(",")]
        has_allergy = False
        for ing in product_ings:
            mapping = db.query(IngredientMapping).filter(IngredientMapping.ingredient_name.ilike(ing)).first()
            norm = mapping.normalized_name.lower() if mapping else ing
            if norm in user_allergies:
                has_allergy = True
                break
        if has_allergy:
            risky_items.append(item)
    
    if not risky_items:
        elements.append(Paragraph("All products in this order are safe for your profile. Great choice!", styles["Italic"]))
    else:
        for item in risky_items:
            product_type = ""
            for t in ["Cleanser", "Moisturizer", "Serum", "Sunscreen", "Shampoo"]:
                if t.lower() in item.product.name.lower():
                    product_type = t
                    break
            
            # Query for safe alternatives
            query = db.query(Product).filter(Product.id != item.product.id)
            if product_type:
                query = query.filter(Product.name.ilike(f"%{product_type}%"))
            
            all_alternatives = query.all()
            safe_alt = None
            for alt in all_alternatives:
                alt_ings = [i.strip().lower() for i in alt.ingredients.split(",")]
                is_alt_safe = True
                for ing in alt_ings:
                    mapping = db.query(IngredientMapping).filter(IngredientMapping.ingredient_name.ilike(ing)).first()
                    norm = mapping.normalized_name.lower() if mapping else ing
                    if norm in user_allergies:
                        is_alt_safe = False
                        break
                if is_alt_safe:
                    safe_alt = alt
                    break # Get the first safe one
            
            if safe_alt:
                elements.append(Paragraph(f"<b>Replacement for {item.product.name}:</b>", styles["Normal"]))
                elements.append(Paragraph(f"💡 Recommendation: <b>{safe_alt.name}</b> by {safe_alt.brand}", styles["Normal"]))
                elements.append(Paragraph(f"<i>Why: This product matches your category and is free from your specific allergens.</i>", styles["Normal"]))
                elements.append(Spacer(1, 10))
            else:
                elements.append(Paragraph(f"<b>For {item.product.name}:</b> No direct safe alternative found in the current store catalog.", styles["Normal"]))
                elements.append(Spacer(1, 10))

    elements.append(Spacer(1, 40))
    elements.append(Paragraph("Disclaimer: This report is an AI-generated safety summary. Always consult your dermatologist for medical advice.", styles["Italic"]))

    doc.build(elements)
    
    return FileResponse(file_path, media_type='application/pdf', filename=file_name)

# ----------------------------
# PRODUCT BROWSING

# ----------------------------
# PRODUCT BROWSING
# ----------------------------

@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@app.get("/products-with-risk")
def get_products_with_risk(user_email: str, db: Session = Depends(get_db)):
    products = db.query(Product).all()
    
    # 1. Fetch User Allergies
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        return []
        
    user_allergies = db.query(UserAllergy).filter(UserAllergy.user_id == user.id).all()
    allergy_list = [a.allergen.lower() for a in user_allergies]

    result = []

    for product in products:
        product_ings = [i.strip().lower() for i in product.ingredients.split(",")]
        risk = "Low"

        # 2. Get Chemical objects for general risk
        chemical_objects = db.query(Chemical).filter(
            func.lower(Chemical.name).in_(product_ings)
        ).all()
        
        overall_score, risk_cat, _, _ = calculate_product_risk(chemical_objects)
        risk = risk_cat

        # 3. Check against User Allergies
        has_allergy = False
        for ing_name in product_ings:
            mapping = db.query(IngredientMapping).filter(
                IngredientMapping.ingredient_name.ilike(ing_name)
            ).first()
            normalized_name = mapping.normalized_name.lower() if mapping else ing_name
            
            if normalized_name in allergy_list:
                has_allergy = True
                break
        
        if has_allergy:
            risk = "Critical"
            reason = "Contains ingredients matching your allergies"
        else:
            reason = f"General Risk: {risk_cat}"
            if risk_cat == "Low":
                reason = "Safe ingredients for your profile"

        # 4. Calculate Recommendation Score
        score = 0
        if risk == "Low": score += 50
        elif risk == "Moderate": score += 20
        elif risk == "High": score -= 20
        elif risk == "Critical": score -= 100

        # Quality Boost (Rating)
        score += (product.rating or 0) * 10

        # Value Boost (Lower Price = Higher Score)
        price_bonus = max(0, 1000 - (product.price or 0)) / 50
        score += price_bonus

        result.append({
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "ingredients": product.ingredients,
            "image": product.image_url or "https://via.placeholder.com/200",
            "risk": risk,
            "score": round(score, 1),
            "reason": reason,
            "rating": product.rating
        })

    # Sort by score descending (Recommended first)
    result.sort(key=lambda x: x["score"], reverse=True)
    return result
