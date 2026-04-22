const pool = require('../config/database');
const authService = require('./auth.service');

exports.loginMerchant = async ({ email, password }) => {
    if (!email || !password) throw { status: 400, message: "Email and Password are required" };
    const isMerchant = await pool.query(`SELECT * FROM users u JOIN user_roles ur ON u.id=ur.user_id JOIN roles r ON ur.role_id=r.id WHERE u.email=$1 AND r.name='merchant'`, [email]);
    if (isMerchant.rowCount === 0) throw { status: 403, message: "Access denied. Not a merchant account." };

    const data = await authService.loginUser({ email, password });
    return data;
};
exports.getLeadsByMerchant = async ({ userId }) => {
    // console.log(user)
    if (!userId) throw { status: 400, message: "Invalid User" };
    const leads = await pool.query(`
         SELECT sl.id, sl.base_price, sl.quoted_price, sl.expected_price,
               sl.created_at, sl.updated_at,
               em.option_name status_label,
               u.email user_email,
               up.first_name, up.last_name,
               c.name category, b.name brand, m.name model,
               smc.name config_name
        FROM sell_listings sl
        LEFT JOIN users u ON sl.user_id=u.id
        LEFT JOIN user_profile up ON u.id=up.user_id
        LEFT JOIN categories c ON sl.category_id=c.id
        LEFT JOIN brands b ON sl.brand_id=b.id
        LEFT JOIN models m ON sl.model_id=m.id
        LEFT JOIN sell_model_configs smc ON sl.config_id=smc.id
        LEFT JOIN enum_master em ON sl.status=em.id AND em.master_name='listing_status'
        WHERE sl.assigned_merchant_id=$1
        `, [userId]);
    return leads.rows;
};