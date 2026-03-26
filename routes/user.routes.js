const router = require('express').Router();
const userController = require('../controllers/user.controller');

// USERS ROUTES
router.post('/create', userController.createUser);
router.get('/get_users/', userController.getUsers);
router.get('/get_users/:id', userController.getUsers);
router.put('/update/:id', userController.updateUser);
router.delete('/delete_user/:id', userController.deleteUser);

// Merchant role
router.post('/:id/merchant', userController.addMerchantRole);
router.delete('/:id/merchant', userController.removeMerchantRole);

// Status (suspend / activate)
router.put('/:id/status', userController.updateUserStatus);

module.exports = [router];