import logging
from typing import Dict, List, Any, Optional, Tuple

from app.core.rag_engine import rag_engine
from app.utils.db import DBService
from app.utils.auth_db import auth_db_service
from app.models.schemas import ChatRequest, ChatResponse, MessageRole, Message

logger = logging.getLogger(__name__)


class AuthChatService:
    """Service for handling authenticated chat interactions"""

    def __init__(self):
        self.rag_engine = rag_engine
        self.db_service = DBService

    async def process_authenticated_message(self, chat_request: ChatRequest) -> ChatResponse:
        """Process a chat message with authentication awareness"""
        try:
            query = chat_request.query
            history = [{"role": msg.role, "content": msg.content} for msg in chat_request.history]
            authenticated = chat_request.metadata.get("authenticated", False) if chat_request.metadata else False
            request_type = chat_request.metadata.get("request_type", None) if chat_request.metadata else None
            
            # If this is specifically an order tracking request
            if request_type == "order_tracking" or self._is_order_tracking_query(query):
                return await self._handle_authenticated_order_tracking(query, authenticated)
            elif self._is_stock_check_query(query):
                return await self._handle_stock_check(query)

            # Get relevant database information
            db_info = await self._get_relevant_db_info(query, authenticated)

            # Use RAG with database context
            answer, relevant_docs = self.rag_engine.process_query(
                query=query,
                history=history,
                db_info=db_info
            )
            
            # Format answer to ensure it's concise
            answer = self._format_concise_response(answer)

            return ChatResponse(
                answer=answer,
                context=[doc["content"] for doc in relevant_docs[:3]],
                sources=[doc.get("metadata", {}).get("source") for doc in relevant_docs if "metadata" in doc]
            )

        except Exception as e:
            logger.error(f"Error processing authenticated message: {str(e)}")
            return ChatResponse(
                answer="I apologize, but I encountered an error while processing your request. Please try again.",
                context=None,
                sources=None
            )

    async def _get_relevant_db_info(self, query: str, authenticated: bool = False) -> str:
        """Get relevant database information for the query based on authentication status"""
        info_parts = []

        # Get product information if query seems product-related
        if any(word in query.lower() for word in ["product", "item", "price", "cost", "buy"]):
            products = await self.db_service.get_all_products()
            if products:
                info_parts.append("Available Products:")
                for product in products[:5]:  # Limit to 5 products for context
                    info_parts.append(
                        f"- {product['designation']}: "
                        f"${product['prix']:.2f}, "
                        f"{product['stock_status']}"
                    )
        
        # If authenticated, add personalized information
        if authenticated:
            # This could include recent orders, preferences, etc.
            # For now, just add a placeholder
            info_parts.append("\nUser is authenticated. Personalized information available.")

        return "\n".join(info_parts)

    def _is_order_tracking_query(self, query: str) -> bool:
        """Check if query is about order tracking"""
        tracking_keywords = [
            "track my order", "order status", "where is my order",
            "shipping status", "delivery status", "order #", "order number",
            "track order", "order tracking"
        ]
        return any(keyword in query.lower() for keyword in tracking_keywords)

    def _is_stock_check_query(self, query: str) -> bool:
        """Check if query is about stock availability"""
        stock_keywords = [
            "in stock", "available", "stock", "inventory",
            "when will", "back in stock", "availability"
        ]
        return any(keyword in query.lower() for keyword in stock_keywords)

    async def _handle_authenticated_order_tracking(self, query: str, authenticated: bool) -> ChatResponse:
        """Handle order tracking query based on authentication status"""
        if not authenticated:
            return ChatResponse(
                answer="To track your specific order, please log in to your account. As a guest, I can only provide general information about our shipping and delivery processes.",
                context=None,
                sources=None
            )
        
        # If authenticated, proceed with order tracking
        order_id = self._extract_order_id(query)

        if not order_id:
            # For authenticated users, try to get their recent orders
            # In a real implementation, we would extract the user_id from the authentication token
            # For now, we'll use a placeholder user_id of 1
            user_id = 1  # This would come from the authentication token in a real implementation
            recent_orders = await auth_db_service.get_recent_orders_for_authenticated_user(user_id=user_id)
            
            if recent_orders:
                response_parts = ["Here are your recent orders:"]
                for order in recent_orders[:3]:  # Limit to 3 recent orders
                    response_parts.append(
                        f"Order #{order['id']} - {order['date']} - Status: {order.get('statutLivraison', 'Processing')}"
                    )
                response_parts.append("\nYou can ask about a specific order by providing the order number.")
                return ChatResponse(
                    answer="\n".join(response_parts),
                    context=None,
                    sources=None
                )
            else:
                return ChatResponse(
                    answer="I don't see any recent orders in your account. If you've placed an order, please provide the order number so I can check its status.",
                    context=None,
                    sources=None
                )

        # If order_id is provided, get the specific order info
        order_info = await self.db_service.get_order_info(order_id)

        if not order_info:
            return ChatResponse(
                answer=f"I couldn't find any information for order #{order_id}. Please check if the order number is correct.",
                context=None,
                sources=None
            )

        # Format response
        response_parts = [f"Here's the status of your order #{order_id}:"]

        if "statutLivraison" in order_info:
            response_parts.append(f"Status: {order_info['statutLivraison']}")

        if "date_livraison" in order_info:
            response_parts.append(f"Expected delivery: {order_info['date_livraison']}")

        if "items" in order_info and order_info["items"]:
            response_parts.append("\nItems in your order:")
            for item in order_info["items"]:
                response_parts.append(
                    f"- {item['designation']} "
                    f"(Quantity: {item['qteCmd']}, "
                    f"Price: ${item['prix']:.2f})"
                )

        if "paiement_status" in order_info:
            response_parts.append(f"\nPayment status: {order_info['paiement_status']}")

        return ChatResponse(
            answer="\n".join(response_parts),
            context=None,
            sources=None
        )

    async def _handle_stock_check(self, query: str) -> ChatResponse:
        """Handle stock check query"""
        product_name = self._extract_product_name(query)

        if not product_name:
            return ChatResponse(
                answer="I'd be happy to check stock availability. Which product are you interested in?",
                context=None,
                sources=None
            )

        stock_info = await self.db_service.check_stock(product_name=product_name)

        if not stock_info:
            return ChatResponse(
                answer=f"I couldn't find any product matching '{product_name}'. Could you please check the spelling or try a different product?",
                context=None,
                sources=None
            )

        # Format response
        response_parts = [f"Here's the availability information for {stock_info['designation']}:"]

        response_parts.append(f"\nStatus: {stock_info['stock_status']}")
        response_parts.append(f"Price: ${stock_info['prix']:.2f}")

        if stock_info.get('category_name'):
            response_parts.append(f"Category: {stock_info['category_name']}")

        if stock_info.get('nbrPoint', 0) > 0:
            response_parts.append(f"Reward Points: {stock_info['nbrPoint']}")

        return ChatResponse(
            answer="\n".join(response_parts),
            context=None,
            sources=None
        )

    def _extract_order_id(self, query: str) -> Optional[int]:
        """Extract order ID from query"""
        import re
        patterns = [
            r"order\s*#?\s*(\d+)",
            r"#\s*(\d+)",
            r"order\s*number\s*(\d+)",
            r"tracking\s*number\s*(\d+)"
        ]

        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        return None

    def _extract_product_name(self, query: str) -> Optional[str]:
        """Extract product name from query"""
        import re
        patterns = [
            r"stock\s*(?:for|of)\s*([\w\s]+?)(?:\?|$|\.)",
            r"([\w\s]+?)\s*(?:in stock|available)",
            r"availability\s*(?:for|of)\s*([\w\s]+?)(?:\?|$|\.)",
            r"do you have\s*([\w\s]+?)(?:\?|$|\.)",
        ]

        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                product_name = match.group(1).strip()
                if product_name:
                    return product_name

        words = query.split()
        if len(words) >= 2:
            return " ".join(words[-3:])

        return None
        
    def _format_concise_response(self, response: str) -> str:
        """Format response to be more concise for e-commerce context"""
        # Remove unnecessary phrases and filler words
        phrases_to_remove = [
            "I'm happy to help you with that.",
            "I'd be glad to assist you.",
            "Thank you for your question.",
            "I hope this helps.",
            "Please let me know if you need anything else.",
            "Is there anything else you'd like to know?"
        ]
        
        result = response
        for phrase in phrases_to_remove:
            result = result.replace(phrase, "")
        
        # Split into sentences and limit if too long
        sentences = [s.strip() for s in result.split(".") if s.strip()]
        
        # If more than 5 sentences, keep only the most important ones
        if len(sentences) > 5:
            # Keep first 2 and last 2 sentences as they often contain the most relevant info
            sentences = sentences[:2] + sentences[-2:]
        
        # Rejoin with periods
        result = ". ".join(sentences)
        if not result.endswith("."):
            result += "."
            
        return result.strip()


# Create a singleton instance
auth_chat_service = AuthChatService()