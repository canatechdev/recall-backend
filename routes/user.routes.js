const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { reqBody } = require('../middlewares/req_body.middleware')
const upload = require('../config/multer.config')
// USERS ROUTES
router.post('/create', upload.single('avatar'), userController.createUser);
router.get('/get_users/', userController.getUsers);
router.get('/get_users/:id', userController.getUsers);
router.put('/update/:id', upload.single('avatar'), userController.updateUser);
router.delete('/delete_user/:id', userController.deleteUser);

// Merchant role
router.post('/:id/merchant', userController.addMerchantRole);
router.delete('/:id/merchant', userController.removeMerchantRole);

// ADDRESSES
// ADDRESS
router.get('/addresses/:user_id', userController.getAddresses);
router.post('/addresses', reqBody, userController.createAddress);

module.exports = [router];