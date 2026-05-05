from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from .database import Base

class Chemical(Base):
    __tablename__ = "chemicals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    family = Column(String)
    risk_score = Column(Integer)
    risk_category = Column(String)
    explanation = Column(Text)
    irritation_index = Column(Integer, default=0)
    endocrine_disruptor = Column(Boolean, default=False)
    carcinogenic_flag = Column(Boolean, default=False)
    regulatory_status = Column(String)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    synonyms = relationship("ChemicalSynonym", back_populates="chemical")


class ChemicalSynonym(Base):
    __tablename__ = "chemical_synonyms"

    id = Column(Integer, primary_key=True)
    chemical_id = Column(Integer, ForeignKey("chemicals.id", ondelete="CASCADE"))
    synonym_name = Column(String, unique=True, nullable=False)

    chemical = relationship("Chemical", back_populates="synonyms")


class AnalysisLog(Base):
    __tablename__ = "analysis_logs"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_input = Column(Text)  # Changed to Text to support long ingredient lists
    overall_score = Column(Integer)
    category = Column(String)
    analysis_reasoning = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    age = Column(Integer)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    allergies = relationship("UserAllergy", back_populates="user", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


class UserAllergy(Base):
    __tablename__ = "user_allergies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    allergen = Column(String)

    user = relationship("User", back_populates="allergies")


class IngredientMapping(Base):
    __tablename__ = "ingredient_mapping"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_name = Column(String, unique=True, nullable=False, index=True)
    normalized_name = Column(String, nullable=False)
    family = Column(String)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Integer)
    ingredients = Column(String)
    brand = Column(String)
    image_url = Column(String)
    rating = Column(Float, default=0.0)
    reviews = Column(Integer, default=0)
    description = Column(String)

class CartItem(Base):
    __tablename__ = "cart"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    quantity = Column(Integer, default=1)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    total_amount = Column(Float)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
