const userService = require('../services/user.service.js');

exports.getUsers = async (req, res) => {
    const data = await userService.getUsers(req.params);
    res.status(200).json(data);
}
exports.deleteUser = async (req, res) => {
    const data = await userService.deleteUser(req.params);
    res.status(200).json(data);
}

exports.createUser = async (req, res) => {
    const data = await userService.createUser(req.body);
    res.status(201).json(data);
}

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    if (!id) throw { status: 400, message: "ID is required" };
    const data = await userService.updateUser(id, req.body);
    res.status(200).json(data);
}

exports.addMerchantRole = async (req, res) => {
    const data = await userService.addMerchantRole(req.params.id);
    res.status(200).json(data);
}

exports.removeMerchantRole = async (req, res) => {
    const data = await userService.removeMerchantRole(req.params.id);
    res.status(200).json(data);
}

exports.updateUserStatus = async (req, res) => {
    const data = await userService.updateUserStatus(req.params.id, req.body.status);
    res.status(200).json(data);
}