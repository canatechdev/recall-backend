const sellService = require("../services/merchant.service");

exports.loginMerchant = async (req, res) => {
    const data = await sellService.loginMerchant(req.body);
    res.status(200).json(data);
};

exports.getLeadsByMerchant = async (req, res) => {
    const data = await sellService.getLeadsByMerchant(req.user);
    res.status(200).json(data);
};