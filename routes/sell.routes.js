const express = require('express');
const router = express.Router();
const { reqBody } = require('../middlewares/req_body.middleware');
const sellController = require('../controllers/sell.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Model Configs
router.get('/configs/:model_slug', sellController.getModelConfigs);
router.post('/configs', reqBody, sellController.createModelConfig);
router.put('/configs/:id', reqBody, sellController.updateModelConfig);
router.delete('/configs/:id', sellController.deleteModelConfig);

// Questions
router.get('/questions', sellController.getQuestions);
router.get('/questions/:modelSlug', sellController.getQuestionsByModel);
router.get('/questions/category/:category_id', sellController.getQuestionsByCategory);
router.post('/questions', reqBody, sellController.createQuestion);
router.put('/questions/:id', reqBody, sellController.updateQuestion);
router.delete('/questions/:id', sellController.deleteQuestion);

// Question Options
router.get('/options/:question_id', sellController.getQuestionOptions);
router.post('/options', reqBody, sellController.createQuestionOption);
router.put('/options/:id', reqBody, sellController.updateQuestionOption);
router.delete('/options/:id', sellController.deleteQuestionOption);

// Conditions
router.get('/conditions/:question_id', sellController.getConditions);
router.post('/conditions', reqBody, sellController.createCondition);
router.delete('/conditions/:id', sellController.deleteCondition);

// Category-Question Mapping
router.get('/category-questions/:category_id', sellController.getCategoryQuestions);
router.post('/category-questions', reqBody, sellController.mapQuestionToCategory);
router.delete('/category-questions/:category_id/:question_id', sellController.unmapQuestionFromCategory);

// Sell Flow: Questions with conditions for a category
router.get('/flow/:category_slug', sellController.getQuestionsByCategorySlug);

// Price Calculation
router.post('/calculate-price', reqBody, sellController.calculatePrice);

// Sell Listings (Leads)
router.get('/listings', sellController.getListings);
router.post('/listings',reqBody, sellController.createListing);
router.put('/listings/:id/assign', reqBody, sellController.assignListing);
router.put('/listings/:id/transfer', sellController.transferListing);
router.put('/listings/:id/reject', sellController.rejectListing);

// Merchants
router.get('/merchants', sellController.getMerchants);

module.exports = router;
