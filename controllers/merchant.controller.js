const merchantService = require("../services/merchant.service");
const asyncHandler = require('../middlewares/async_handler')

exports.loginMerchant = asyncHandler(async (req, res) => {
    const data = await merchantService.loginMerchant(req.body);
    res.status(200).json(data);
});

exports.getProfileDetails = asyncHandler(async (req, res) => {
    const data = await merchantService.getProfileDetails(req.user);
    res.status(200).json(data);
});

exports.updateProfileDetails = asyncHandler(async (req, res) => {
    req.body.user = req.user
    const data = await merchantService.updateProfileDetails(req.body);
    res.status(200).json(data);
});

exports.getLeadsByMerchant = asyncHandler(async (req, res) => {
    const data = await merchantService.getLeadsByMerchant(req.user);
    res.status(200).json(data);
});

exports.requestOTP = asyncHandler(async (req, res) => {
    // if(!req.body.listing_id) throw {status:400, message:"Listing ID is required"};

    const data = await merchantService.requestOTP(req.user, req.body);
    res.status(200).json(data);
});

exports.verifyOTP = asyncHandler(async (req, res) => {
    req.body.user = req.user;
    if (!req.body.id || !req.body.otp) throw { status: 400, message: "OTP is required" };
    const data = await merchantService.verifyOTP(req.body);
    res.status(200).json(data);
});

exports.getLeadsByLeadId = asyncHandler(async (req, res) => {
    if (!req.params.id) throw { status: 400, message: "Lead ID is required" };
    const data = await merchantService.getLeadsByLeadId(req.user, req.params);
    res.status(200).json(data);
});

exports.acceptLead = asyncHandler(async (req, res) => {
    req.body.merchant_id = req.user.userId
    const data = await merchantService.acceptLead(req.body);
    res.status(200).json(data);
});

exports.inviteMerchantAgent = asyncHandler(async (req, res) => {
    req.body.user_id = req.user.userId
    const data = await merchantService.inviteMerchantAgent(req.body);
    res.status(200).json(data);
});

exports.verifyMerchantAgent = asyncHandler(async (req, res) => {
    if (!req.query.token) throw { status: 400, message: "Token is required" };
    const data = await merchantService.verifyMerchantAgent(req.query);
    res.status(200).json(data);
});


exports.registerMerchantAgent = asyncHandler(async (req, res) => {
    if (!req.query.token) throw { status: 400, message: "Token is required" };
    req.body.token = req.query.token
    const data = await merchantService.registerMerchantAgent(req.body);
    res.status(200).json(data);
});


exports.getRequoteQuestions = asyncHandler(async (req, res) => {
    if (req.query.context && req.query.context !== "inspection") throw { status: 400, message: "Invalid context" };
    const data = await merchantService.getRequoteQuestions(req.query);
    res.status(200).json(data);
});