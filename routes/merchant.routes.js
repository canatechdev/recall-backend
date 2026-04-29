const router = require('express').Router();
const merchantController = require('../controllers/merchant.controller');
const { reqBody } = require('../middlewares/req_body.middleware')
const authMiddleware = require('../middlewares/auth.middleware')

// USERS ROUTES

router.post('/login', reqBody, merchantController.loginMerchant);
router.get('/leads', authMiddleware, merchantController.getLeadsByMerchant);
router.get('/leads/:id', authMiddleware, merchantController.getLeadsByLeadId);
router.get('/profile', authMiddleware, merchantController.getProfileDetails);
router.put('/profile/', reqBody, authMiddleware, merchantController.updateProfileDetails);
router.post('/invite_agent', reqBody, authMiddleware, merchantController.inviteMerchantAgent);
router.get('/verify_agent', merchantController.verifyMerchantAgent);
router.post('/register_agent', reqBody, merchantController.registerMerchantAgent);


module.exports = router;
