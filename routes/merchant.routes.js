const router = require('express').Router();
const merchantController = require('../controllers/merchant.controller');
const { reqBody } = require('../middlewares/req_body.middleware')
const authMiddleware = require('../middlewares/auth.middleware')
const allowRoles = require('../middlewares/snippets.middleware').allowRoles;
const upload = require('../config/multer.config');
// USERS ROUTES

router.post('/login', reqBody, merchantController.loginMerchant);

router.post('/requestOTP', authMiddleware, allowRoles('merchant', 'agent'), reqBody, merchantController.requestOTP);
router.post('/verifyOTP', authMiddleware, allowRoles('merchant', 'agent'), reqBody, merchantController.verifyOTP);


router.post('/leads/accept', authMiddleware, allowRoles('merchant', 'agent'), reqBody, merchantController.acceptLead);
router.get('/leads/:id', authMiddleware, allowRoles('merchant', 'agent'), merchantController.getLeadsByLeadId);
router.get('/leads', authMiddleware, allowRoles('merchant', 'agent'), merchantController.getLeadsByMerchant);

router.get('/profile', authMiddleware, merchantController.getProfileDetails);
router.put('/profile/', reqBody, authMiddleware, merchantController.updateProfileDetails);

router.post('/invite_agent', reqBody, authMiddleware, merchantController.inviteMerchantAgent);
router.get('/verify_agent', merchantController.verifyMerchantAgent);
router.post('/register_agent', reqBody, merchantController.registerMerchantAgent);

router.get('/get_agents', authMiddleware, allowRoles('merchant'), merchantController.getMerchantAgents);

router.get('/requote/questions',authMiddleware, allowRoles('merchant', 'agent'), merchantController.getRequoteQuestions);
router.post('/requote',authMiddleware, allowRoles('merchant', 'agent'), merchantController.postRequote);

// Accept answered inspection questions (supports multipart/form-data for proof images)
router.post('/requote/questions', authMiddleware, allowRoles('merchant', 'agent'), upload.any(), merchantController.submitRequoteAnswers);


module.exports = router;
