import logging
from typing import Dict, List, Any, Optional
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import SessionLocal, get_db

logger = logging.getLogger(__name__)


class DBService:
    """Service for interacting with the e-commerce database"""

    @staticmethod
    async def get_product_info(product_id: Optional[int] = None, product_name: Optional[str] = None) -> Optional[
        Dict[str, Any]]:
        """Get product information"""
        try:
            with SessionLocal() as db:
                # PostgreSQL is case-sensitive with quoted identifiers
                # Ensure we use exact case matching for column names
                query = text("""
                             SELECT p.*,
                                    c.name  as category_name,
                                    CASE
                                        WHEN p."qteStock" > p."seuilMin" THEN 'In Stock'
                                        WHEN p."qteStock" > 0 THEN 'Low Stock'
                                        ELSE 'Out of Stock'
                                        END as stock_status
                             FROM "Produit" p
                                      LEFT JOIN "Category" c ON p."categoryId" = c.id
                             WHERE p.deleted = FALSE
                               AND (
                                 CASE
                                     WHEN :product_id IS NOT NULL THEN p.id = :product_id
                                     WHEN :product_name IS NOT NULL THEN p.designation ILIKE :product_name
                                     ELSE FALSE
                                     END
                                 )
                             """)

                result = db.execute(
                    query,
                    {
                        "product_id": product_id,
                        "product_name": f"%{product_name}%" if product_name else None
                    }
                ).first()

                if result:
                    return dict(result._mapping)
                return None
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_product_info: {str(e)}")
            return None

    @staticmethod
    async def get_order_info(order_id: int) -> Optional[Dict[str, Any]]:
        """Get order information"""
        try:
            with SessionLocal() as db:
                query = text("""
                             SELECT c.*,
                                    l."statutLivraison",
                                    l.date   as date_livraison,
                                    l."nomLivreur",
                                    p.statut as paiement_status,
                                    json_agg(
                                            json_build_object(
                                                    'produit_id', lp.produit_id,
                                                    'designation', pr.designation,
                                                    'qteCmd', lp."qteCmd",
                                                    'prix', lp.prix
                                            )
                                    )        as items
                             FROM "Commande" c
                                      LEFT JOIN "Livraison" l ON c.id = l.commande_id
                                      LEFT JOIN "Paiement" p ON c.id = p.commande_id
                                      LEFT JOIN "Panier" pa ON c.panier_id = pa.id
                                      LEFT JOIN "LignePanier" lp ON pa.id = lp.panier_id
                                      LEFT JOIN "Produit" pr ON lp.produit_id = pr.id
                             WHERE c.id = :order_id
                             GROUP BY c.id, l.id, p.id
                             """)

                result = db.execute(query, {"order_id": order_id}).first()

                if result:
                    return dict(result._mapping)
                return None
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_order_info: {str(e)}")
            return None

    @staticmethod
    async def check_stock(product_id: Optional[int] = None, product_name: Optional[str] = None) -> Optional[
        Dict[str, Any]]:
        """Check product stock"""
        try:
            with SessionLocal() as db:
                # Fix case sensitivity by quoting column names
                query = text("""
                             SELECT p.*,
                                    c.name  as category_name,
                                    CASE
                                        WHEN p."qteStock" > p."seuilMin" THEN 'In Stock'
                                        WHEN p."qteStock" > 0 THEN 'Low Stock'
                                        ELSE 'Out of Stock'
                                        END as stock_status
                             FROM "Produit" p
                                      LEFT JOIN "Category" c ON p."categoryId" = c.id
                             WHERE p.deleted = FALSE
                               AND (
                                 CASE
                                     WHEN :product_id IS NOT NULL THEN p.id = :product_id
                                     WHEN :product_name IS NOT NULL THEN p.designation ILIKE :product_name
                                     ELSE FALSE
                                     END
                                 )
                             """)

                result = db.execute(
                    query,
                    {
                        "product_id": product_id,
                        "product_name": f"%{product_name}%" if product_name else None
                    }
                ).first()

                if result:
                    return dict(result._mapping)
                return None
        except SQLAlchemyError as e:
            logger.error(f"Database error in check_stock: {str(e)}")
            return None

    @staticmethod
    async def get_all_products() -> List[Dict[str, Any]]:
        """Get all products"""
        try:
            with SessionLocal() as db:
                # Fix case sensitivity by quoting column names
                query = text("""
                             SELECT p.*,
                                    c.name  as category_name,
                                    CASE
                                        WHEN p."qteStock" > p."seuilMin" THEN 'In Stock'
                                        WHEN p."qteStock" > 0 THEN 'Low Stock'
                                        ELSE 'Out of Stock'
                                        END as stock_status
                             FROM "Produit" p
                                      LEFT JOIN "Category" c ON p."categoryId" = c.id
                             WHERE p.deleted = FALSE
                             ORDER BY p.designation
                             """)

                results = db.execute(query).fetchall()
                return [dict(row._mapping) for row in results]
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_all_products: {str(e)}")
            return []