const pool = require("../config/database");
const slugify = require('slugify')

exports.getUsers = async (params = {}) => {
    const { id } = params;
    const values = [];
    let whquery = "WHERE u.status != 3"; // exclude deleted
    if (id) {
        values.push(id);
        whquery += ` AND u.id=$${values.length}`;
    }
    const data = await pool.query(`
        SELECT u.id, up.first_name, up.last_name, u.email, u.phone, u.status,
               STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name) AS roles,
               BOOL_OR(r.name = 'merchant') AS is_merchant
        FROM users u
        LEFT JOIN user_profile up ON u.id = up.user_id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ${whquery}
        GROUP BY u.id, up.first_name, up.last_name, u.email, u.phone, u.status
        ORDER BY u.id DESC
    `, values);
    return data.rows;
}
exports.deleteUser = async (params) => {
    const { id } = params
    const data = await pool.query(`UPDATE users SET status=3 WHERE id=$1 RETURNING id, email`,
        [id]);
    return data.rows;
}
exports.createUser = async (data) => {
    const { email, phone, password, is_verified, profile, addresses, roles } = data;
    const client = await pool.connect();
    let createdUser;
    try {
        await client.query('BEGIN');
        const insertRes = await client.query(
            `INSERT INTO users(email, phone, password, is_verified) VALUES ($1, $2, $3, $4) RETURNING id, email`,
            [email, phone, password, is_verified]
        );
        createdUser = insertRes.rows[0];
        const user_id = createdUser.id;
        await client.query(
            `INSERT INTO user_profile(user_id, first_name, last_name, avatar_url) VALUES ($1, $2, $3, $4)`,
            [user_id, profile.first_name, profile.last_name, profile.avatar_url || null]
        );
        for (const address of addresses) {
            await client.query(
                `INSERT INTO addresses(user_id, name, phone, line1, line2, city, state, pincode, country, is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [user_id, address.name, address.phone, address.line1, address.line2, address.city, address.state, address.pincode, address.country, address.is_default]
            );
        }
        for (const role of roles) {
            const roleData = await client.query(`SELECT id FROM roles WHERE id=$1`, [role]);
            if (roleData.rowCount === 0) throw { status: 404, message: "No such Role: " + role };
            await client.query(`INSERT INTO user_roles(user_id, role_id) VALUES ($1,$2)`, [user_id, roleData.rows[0].id]);
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    return createdUser;
}

exports.addMerchantRole = async (user_id) => {
    const merchantRole = await pool.query(`SELECT id FROM roles WHERE name='merchant'`);
    if (merchantRole.rowCount === 0) throw { status: 404, message: "Merchant role not found" };
    const roleId = merchantRole.rows[0].id;
    const existing = await pool.query(
        `SELECT 1 FROM user_roles WHERE user_id=$1 AND role_id=$2`,
        [user_id, roleId]
    );
    if (existing.rowCount > 0) throw { status: 409, message: "User is already a merchant" };
    await pool.query(`INSERT INTO user_roles(user_id, role_id) VALUES ($1,$2)`, [user_id, roleId]);
    return { user_id };
};

exports.removeMerchantRole = async (user_id) => {
    const merchantRole = await pool.query(`SELECT id FROM roles WHERE name='merchant'`);
    if (merchantRole.rowCount === 0) throw { status: 404, message: "Merchant role not found" };
    const roleId = merchantRole.rows[0].id;
    const result = await pool.query(
        `DELETE FROM user_roles WHERE user_id=$1 AND role_id=$2 RETURNING user_id`,
        [user_id, roleId]
    );
    if (result.rowCount === 0) throw { status: 404, message: "User is not a merchant" };
    return { user_id };
};

exports.updateUserStatus = async (user_id, status) => {
    if (![1, 2].includes(parseInt(status))) throw { status: 400, message: "Invalid status. Use 1 (active) or 2 (suspended)" };
    const result = await pool.query(
        `UPDATE users SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, status`,
        [parseInt(status), user_id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "User not found" };
    return result.rows[0];
};

exports.updateUser = async (id, data) => {
    const { email, phone, password, is_verified, profile, addresses, roles } = data;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update users table
        if (email || phone || password || is_verified !== undefined) {
            await client.query(
                `UPDATE users SET 
                    email=COALESCE($1, email), 
                    phone=COALESCE($2, phone), 
                    password=COALESCE($3, password), 
                    is_verified=COALESCE($4, is_verified), 
                    updated_at=NOW() 
                 WHERE id=$5`,
                [email, phone, password, is_verified, id]
            );
        }

        // Update user_profile
        if (profile) {
            await client.query(
                `UPDATE user_profile SET 
                    first_name=COALESCE($1, first_name), 
                    last_name=COALESCE($2, last_name), 
                    avatar_url=COALESCE($3, avatar_url)
                 WHERE user_id=$4`,
                [profile.first_name, profile.last_name, profile.avatar_url, id]
            );
        }

        // Update addresses
        if (addresses) {
            await client.query(`DELETE FROM addresses WHERE user_id=$1`, [id]);
            for (const address of addresses) {
                await client.query(
                    `INSERT INTO addresses(user_id, name, phone, line1, line2, city, state, pincode, country, is_default) 
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                    [id, address.name, address.phone, address.line1, address.line2, address.city, address.state, address.pincode, address.country, address.is_default]
                );
            }
        }

        // Update roles
        if (roles) {
            await client.query(`DELETE FROM user_roles WHERE user_id=$1`, [id]);
            for (const role of roles) {
                const roleData = await client.query(`SELECT id FROM roles WHERE id=$1`, [role]);
                if (roleData.rowCount === 0) throw { status: 404, message: "No such Role: " + role };
                await client.query(`INSERT INTO user_roles(user_id, role_id) VALUES ($1,$2)`, [id, roleData.rows[0].id]);
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
    return { id, email };
}

// {
//     "email": "abhi@gmail.com",
//     "phone": "9325924134",
//     "password": "abhishek",
//     "status": "active",
//     "is_verified": true,
//     "profile": {
//         "first_name": "Abhishek",
//         "last_name": "Kute",
//         "avatar_url": null
//     },
//     "addresses": [
//         {
//             "name": "Rupesh",
//             "phone": "9594212288",
//             "line1": "House 8",
//             "line2": "Samruddhi nagar",
//             "city": "Ahmednagar",
//             "state": "Maharashtra",
//             "pincode": "414001",
//             "country": "India",
//             "is_default": true
//         }
//     ],
//     "roles": [
//         "customer"
//     ]
// }