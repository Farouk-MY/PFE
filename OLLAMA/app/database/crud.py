from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class DatabaseController:
    @staticmethod
    async def get_product_info(db: Session, product_id: Optional[int] = None, product_name: Optional[str] = None) -> \
    Optional[Dict[str, Any]]:
        """Get product information"""
        try:
            query = text("""
                         SELECT p.*, c.name as category_name
                         FROM "Produit" p
                                  LEFT JOIN "Category" c ON p."categoryId" = c.id
                         WHERE p.deleted = FALSE
                           AND (
                             CASE
                                 WHEN :product_id IS NOT NULL THEN p.id = :product_id
                                 WHEN :product_name IS NOT NULL THEN p.designation ILIKE :product_name
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
        except Exception as e:
            logger.error(f"Error getting product info: {str(e)}")
            return None

    @staticmethod
    async def get_order_info(db: Session, order_id: int) -> Optional[Dict[str, Any]]:
        """Get order information"""
        try:
            query = text("""
                         SELECT c.*,
                                l."statutLivraison",
                                l.date                   as date_livraison,
                                l."nomLivreur",
                                p.statut                 as paiement_status,
                                COALESCE(lp.items, '[]') as items
                         FROM "Commande" c
                                  LEFT JOIN "Livraison" l ON c.id = l.commande_id
                                  LEFT JOIN "Paiement" p ON c.id = p.commande_id
                                  LEFT JOIN LATERAL (
                             SELECT json_agg(json_build_object(
                                     'produit_id', lp.produit_id,
                                     'designation', pr.designation,
                                     'qteCmd', lp."qteCmd",
                                     'prix', lp.prix
                                             )) as items
                             FROM "LignePanier" lp
                                      JOIN "Produit" pr ON lp.produit_id = pr.id
                             WHERE lp.panier_id = c.panier_id
                                 ) lp ON true
                         WHERE c.id = :order_id
                         """)

            result = db.execute(query, {"order_id": order_id}).first()

            if result:
                return dict(result._mapping)
            return None
        except Exception as e:
            logger.error(f"Error getting order info: {str(e)}")
            return None

    @staticmethod
    async def check_stock(db: Session, product_id: Optional[int] = None, product_name: Optional[str] = None) -> \
    Optional[Dict[str, Any]]:
        """Check product stock"""
        try:
            query = text("""
                         SELECT p.*,
                                c.name as category_name
                         FROM "Produit" p
                                  LEFT JOIN "Category" c ON p."categoryId" = c.id
                         WHERE p.deleted = FALSE
                           AND (
                             CASE
                                 WHEN :product_id IS NOT NULL THEN p.id = :product_id
                                 WHEN :product_name IS NOT NULL THEN p.designation ILIKE :product_name
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
        except Exception as e:
            logger.error(f"Error checking stock: {str(e)}")
            return None

    @staticmethod
    async def get_all_products(db: Session) -> List[Dict[str, Any]]:
        """Get all products"""
        try:
            query = text("""
                         SELECT p.*,
                                c.name as category_name
                         FROM "Produit" p
                                  LEFT JOIN "Category" c ON p."categoryId" = c.id
                         WHERE p.deleted = FALSE
                         """)

            results = db.execute(query).fetchall()
            return [dict(row._mapping) for row in results]
        except Exception as e:
            logger.error(f"Error getting all products: {str(e)}")
            return []