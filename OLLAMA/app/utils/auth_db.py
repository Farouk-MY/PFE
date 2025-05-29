import logging
from typing import Dict, List, Any, Optional
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.connection import SessionLocal

logger = logging.getLogger(__name__)


class AuthDBService:
    """Service for interacting with the e-commerce database with authentication awareness"""

    @staticmethod
    async def get_recent_orders_for_authenticated_user(user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get recent orders for the authenticated user"""
        try:
            with SessionLocal() as db:
                # If no user_id is provided, we can't fetch orders
                if not user_id:
                    return []
                
                query = text("""
                             SELECT c.*,
                                    l."statutLivraison",
                                    l.date as date_livraison,
                                    p.statut as paiement_status
                             FROM "Commande" c
                                      LEFT JOIN "Livraison" l ON c.id = l.commande_id
                                      LEFT JOIN "Paiement" p ON c.id = p.commande_id
                             WHERE c.client_id = :user_id
                             ORDER BY c.id DESC
                             LIMIT 5
                             """)

                results = db.execute(query, {"user_id": user_id}).fetchall()

                if results:
                    return [dict(row._mapping) for row in results]
                return []
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_recent_orders_for_authenticated_user: {str(e)}")
            return []

    @staticmethod
    async def get_user_info(user_id: int) -> Optional[Dict[str, Any]]:
        """Get user information"""
        try:
            with SessionLocal() as db:
                query = text("""
                             SELECT *
                             FROM "Client"
                             WHERE id = :user_id
                             """)

                result = db.execute(query, {"user_id": user_id}).first()

                if result:
                    return dict(result._mapping)
                return None
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_user_info: {str(e)}")
            return None

    @staticmethod
    async def get_user_orders(user_id: int) -> List[Dict[str, Any]]:
        """Get all orders for a specific user"""
        try:
            with SessionLocal() as db:
                query = text("""
                             SELECT c.*,
                                    l."statutLivraison",
                                    l.date as date_livraison,
                                    p.statut as paiement_status
                             FROM "Commande" c
                                      LEFT JOIN "Livraison" l ON c.id = l.commande_id
                                      LEFT JOIN "Paiement" p ON c.id = p.commande_id
                             WHERE c.client_id = :user_id
                             ORDER BY c.id DESC
                             """)

                results = db.execute(query, {"user_id": user_id}).fetchall()

                if results:
                    return [dict(row._mapping) for row in results]
                return []
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_user_orders: {str(e)}")
            return []


# Create a singleton instance
auth_db_service = AuthDBService()