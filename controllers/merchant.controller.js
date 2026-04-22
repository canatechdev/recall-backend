const merchantService = require("../services/merchant.service");
const asyncHandler = require('../middlewares/async_handler')

exports.loginMerchant = asyncHandler(async (req, res) => {
    const data = await merchantService.loginMerchant(req.body);
    res.status(200).json(data);
});

exports.savePersonalInfoStep1 = asyncHandler(async (req, res) => {
    const result = await profileService.savePersonalInfoStep1(req.body);
    res.status(201).json({ success: true, data: result });
});

exports.getLeadsByMerchant = asyncHandler(async (req, res) => {
    const data = await merchantService.getLeadsByMerchant(req.user);
    res.status(200).json(data);
});

exports.inviteMerchantAgent = asyncHandler(async (req, res) => {
    req.body.user_id=req.user.userId
    const data = await merchantService.inviteMerchantAgent(req.body);
    res.status(200).json(data);
});

exports.verifyMerchantAgent = asyncHandler(async (req, res) => {
    const data = await merchantService.verifyMerchantAgent(req.query);
    res.status(200).json(data);
});