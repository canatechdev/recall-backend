const userService = require('../services/user.service.js');

const parseMaybeJson = (value) => {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value;
    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
}

exports.getUsers = async (req, res) => {
    const data = await userService.getUsers(req.params);
    res.status(200).json(data);
}
exports.deleteUser = async (req, res) => {
    const data = await userService.deleteUser(req.params);
    res.status(200).json(data);
}

exports.createUser = async (req, res) => {
    const body = { ...req.body };
    body.profile = parseMaybeJson(body.profile) || {};
    body.addresses = parseMaybeJson(body.addresses) || [];
    body.roles = parseMaybeJson(body.roles) || [];

    if (req.file) {
        body.profile = body.profile || {};
        body.profile.avatar_url = req.file.filename;
    }

    const data = await userService.createUser(body);
    res.status(201).json(data);
}

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    if (!id) throw { status: 400, message: "ID is required" };
    const body = { ...req.body };
    body.profile = parseMaybeJson(body.profile);
    body.addresses = parseMaybeJson(body.addresses);
    body.roles = parseMaybeJson(body.roles);

    if (req.file) {
        body.profile = body.profile || {};
        body.profile.avatar_url = req.file.filename;
    }

    const data = await userService.updateUser(id, body);
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

// ADDRESS
exports.createAddress = async (req, res) => {
    const data = await userService.createAddress(req.body);
    res.status(201).json(data);
};

exports.getAddresses = async (req, res) => {
    const data = await userService.getAddresses(req.params.user_id);
    res.status(200).json(data);
};