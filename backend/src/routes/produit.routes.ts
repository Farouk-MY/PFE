// src/routes/produit.routes.ts
import { Router } from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    hardDeleteProduct,
    searchProducts,
    checkStock,
    getProductDashboard,
    updateStock,
    getLowStockProducts,
    getTrendingProducts,
    getProductsByCategory
} from '../controllers/produit.controller';
import path from 'path';
import { uploadProductImagesHandler } from '../middleware/upload.middleware';

const router = Router();

// Route pour la page HTML des produits tendance
router.get('/produits-tendance', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/produits-tendance.html'));
});

// Les autres routes existantes
router.get('/produits/tendance', getTrendingProducts);
router.get('/search', searchProducts);

// Category specific routes
router.get('/category/:categoryId', getProductsByCategory);

router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Create product with image upload middleware
router.post('/', uploadProductImagesHandler, createProduct);

// Update product with image upload middleware
router.put('/:id', uploadProductImagesHandler, updateProduct);

router.delete('/:id', deleteProduct);
router.delete('/:id/permanent', hardDeleteProduct);
router.get('/:id/stock', checkStock);
router.get('/admin/produit/:id', getProductDashboard);
router.put('/admin/produit/:id/stock', updateStock);
router.get('/admin/produits-faibles', getLowStockProducts);

export default router;