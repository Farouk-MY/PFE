from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base


class Product(Base):
    __tablename__ = "Produit"

    id = Column(Integer, primary_key=True, index=True)
    designation = Column(String(255), nullable=False)
    description = Column(Text)
    images = Column(ARRAY(String))
    qteStock = Column(Integer, default=0)
    prix = Column(Float, nullable=False)
    categoryId = Column(Integer, ForeignKey("Category.id"))
    nbrPoint = Column(Integer)
    seuilMin = Column(Integer)
    deleted = Column(Boolean, default=False)

    category = relationship("Category", back_populates="products")
    ligne_panier = relationship("LignePanier", back_populates="produit")


class Category(Base):
    __tablename__ = "Category"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    products = relationship("Product", back_populates="category")


class Client(Base):
    __tablename__ = "Client"

    id = Column(Integer, primary_key=True)
    soldePoints = Column(Integer, default=0)
    historiqueAchats = Column(JSON, default=lambda: "[]")
    historiquePoints = Column(JSON, default=lambda: "[]")

    panier = relationship("Panier", back_populates="client")
    commande = relationship("Commande", back_populates="client")


class Panier(Base):
    __tablename__ = "Panier"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime)
    total = Column(Float, default=0)
    remise = Column(Float, default=0)
    livrerDomicile = Column(Boolean, default=False)
    client_id = Column(Integer, ForeignKey("Client.id"))

    client = relationship("Client", back_populates="panier")
    ligne_panier = relationship("LignePanier", back_populates="panier")
    commande = relationship("Commande", back_populates="panier")


class LignePanier(Base):
    __tablename__ = "LignePanier"

    id = Column(Integer, primary_key=True, index=True)
    prix = Column(Float)
    qteCmd = Column(Integer)
    sousTotal = Column(Float)
    panier_id = Column(Integer, ForeignKey("Panier.id"))
    produit_id = Column(Integer, ForeignKey("Produit.id"))

    panier = relationship("Panier", back_populates="ligne_panier")
    produit = relationship("Product", back_populates="ligne_panier")


class Commande(Base):
    __tablename__ = "Commande"

    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float)
    remise = Column(Float)
    pourcentageRemise = Column(Float)
    montantPoint = Column(Float)
    montantLivraison = Column(Float)
    montantAPayer = Column(Float)
    dateLivraison = Column(DateTime)
    pointsGagnes = Column(Integer)
    pointsUtilises = Column(Integer)
    client_id = Column(Integer, ForeignKey("Client.id"))
    panier_id = Column(Integer, ForeignKey("Panier.id"))

    client = relationship("Client", back_populates="commande")
    panier = relationship("Panier", back_populates="commande")
    livraison = relationship("Livraison", back_populates="commande", uselist=False)
    paiement = relationship("Paiement", back_populates="commande", uselist=False)


class Livraison(Base):
    __tablename__ = "Livraison"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime)
    nomLivreur = Column(String)
    statutLivraison = Column(String(50))
    detailPaiement = Column(String)
    commande_id = Column(Integer, ForeignKey("Commande.id"), unique=True)

    commande = relationship("Commande", back_populates="livraison")


class Paiement(Base):
    __tablename__ = "Paiement"

    id = Column(Integer, primary_key=True, index=True)
    montant = Column(Float)
    methode = Column(String, default="espece")
    detailsCarte = Column(JSON, default=lambda: "{}")
    statut = Column(String, default="en_attente")
    date = Column(DateTime, default=datetime.utcnow)
    commande_id = Column(Integer, ForeignKey("Commande.id"), unique=True)

    commande = relationship("Commande", back_populates="paiement")


# Document model for storing document metadata
class Document(Base):
    __tablename__ = "Document"

    id = Column(String(36), primary_key=True, index=True)  # UUID as string
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    document_type = Column(String(50), nullable=False)  # PDF, CSV, JSON, TEXT
    file_path = Column(String(255), nullable=False)  # Path to the file in the filesystem
    doc_metadata = Column(JSON, nullable=True)  # Additional metadata as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)