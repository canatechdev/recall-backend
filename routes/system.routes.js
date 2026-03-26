const express = require('express')
const router = express.Router();
const { reqBody } = require('../middlewares/req_body.middleware')
const systemController = require("../controllers/system.controller")
const upload = require("../config/multer.config");
const authMiddleware = require('../middlewares/auth.middleware');


router.get('/get_services', systemController.getServices)
router.post('/create_service', upload.single('image'), reqBody, systemController.createService)
router.put('/update_service/:id', upload.single('image'), reqBody, systemController.updateService)
router.delete('/delete_service/:id', systemController.deleteService);

// router.get('/get_categories', systemController.getCategories)
router.get('/get_categories/:sub', systemController.getCategories)
router.post('/create_category', upload.single('image'), reqBody, systemController.createCategory)
router.put('/update_category/:id', upload.single('image'), reqBody, systemController.updateCategory)
router.delete('/delete_category/:id', systemController.deleteCategory)

router.get('/get_brands', systemController.getBrands)
router.get('/get_brands/:cat_slug', systemController.getBrands)
// router.get('/get_category_brands/:slug', systemController.getCategoryBrands)
router.post('/create_brand', upload.single('image'), reqBody, systemController.createBrand)
router.put('/update_brand/:id', upload.single('image'), reqBody, systemController.updateBrand)
router.delete('/delete_brand/:id', systemController.deleteBrand)


router.get('/get_roles', systemController.getRoles)


router.get('/series/:brand_slug', systemController.getModelSeries)
router.post('/series', reqBody, systemController.createSeries)
router.put('/series/:id', reqBody, systemController.updateSeries)

// get_model_series/:brand_slug
// /create_series',

router.get('/get_models/:cat_slug/:brand_slug/:series_slug', systemController.getModels)
router.post('/models', upload.single('image'), reqBody, systemController.createModel)
router.put('/models/:id', upload.single('image'), reqBody, systemController.updateModel)


// BANNERS

module.exports = [router]