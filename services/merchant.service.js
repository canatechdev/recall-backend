const pool = require('../config/database');
const bcrypt = require("bcrypt");
const authService = require('./auth.service');
const { v7: uuid7 } = require('uuid')
const { sendEmail } = require("../providers/email.provider");
const { sendEmailOTP } = require("../services/auth.service")
const { getQuestions } = require('./sell.service');
const SALT_ROUNDS = 10;

exports.loginMerchant = async ({ email, password }) => {
    if (!email || !password) throw { status: 400, message: "Email and Password are required" };

    const isMerchant = await pool.query(`SELECT * FROM users u JOIN user_roles ur ON u.id=ur.user_id JOIN roles r ON ur.role_id=r.id WHERE u.email=$1 AND (r.name='merchant' OR r.name='agent') AND u.status=1`, [email]);

    if (isMerchant.rowCount === 0) throw { status: 403, message: "Access denied. Not a merchant account." };

    const data = await authService.loginUser({ email, password });
    return data;
};
exports.getProfileDetails = async ({ userId, roles }) => {
    // console.log(userId, roles)
    if (!userId || !roles || !roles.includes('merchant')) {
        throw { status: 403, message: "Not Allowed" };
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `SELECT u.id, up.first_name, up.last_name, u.email, u.phone, r.name role FROM users u
            JOIN user_profile up ON u.id=up.user_id
            JOIN user_roles ur ON u.id=ur.user_id
            JOIN roles r ON ur.role_id=r.id
            WHERE u.id = $1 AND r.name='merchant'`,
            [userId]
        );

        if (result.rowCount == 0) {
            throw { status: 403, message: "Invalid or Expired Token" };
        }

        // await this.sendEmailOTP({ link: link, email: contact });
        await client.query('COMMIT');

        return result.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        throw { status: 500, message: error.message || "Internal Server Error" };
    } finally {
        client.release();
    }
};

exports.updateProfileDetails = async ({ user, first_name, last_name, email, phone }) => {
    // console.log(user, first_name)
    if (!user || !first_name || !last_name || !email || !user.roles.includes('merchant') || !phone) {
        throw { status: 400, message: "Insufficient Details" };
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `SELECT u.id, up.first_name, up.last_name, u.email, u.phone, r.name role FROM users u
            JOIN user_profile up ON u.id=up.user_id
            JOIN user_roles ur ON u.id=ur.user_id
            JOIN roles r ON ur.role_id=r.id
            WHERE u.id = $1 AND r.name='merchant'`,
            [user.userId]
        );

        if (result.rowCount == 0) {
            throw { status: 403, message: "Request Forbidden" };
        }

        let updateUser = await client.query(
            `UPDATE users SET email=$1, phone=$2 WHERE id=$3 RETURNING email, phone`,
            [email, phone, user.userId]
        );
        const updateProfile = await client.query(
            `UPDATE user_profile SET first_name=$1, last_name=$2 WHERE user_id=$3 RETURNING first_name, last_name`,
            [first_name, last_name, user.userId]
        );
        updateUser = { ...updateUser.rows[0], ...updateProfile.rows[0] };
        await client.query('COMMIT');

        return updateUser;

    } catch (error) {
        await client.query('ROLLBACK');
        throw { status: 500, message: error.message || "Internal Server Error" };
    } finally {
        client.release();
    }
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
exports.getLeadsByLeadId = async ({ userId }, { id }) => {
    // console.log(user)
    if (!id) throw { status: 400, message: "Invalid Lead ID" };
    const leads = await pool.query(`
         SELECT sl.id, sl.base_price, sl.quoted_price, sl.expected_price,
               sl.created_at, sl.updated_at,
               em.option_name status_label,
               u.email user_email,
               up.first_name, up.last_name,
               c.name category, b.name brand, m.name model,
               smc.name config_name,
               sp.pickup_date, sp.pickup_slot_start, sp.pickup_slot_end
        FROM sell_listings sl
        LEFT JOIN users u ON sl.user_id=u.id
        LEFT JOIN user_profile up ON u.id=up.user_id
        LEFT JOIN categories c ON sl.category_id=c.id
        LEFT JOIN brands b ON sl.brand_id=b.id
        LEFT JOIN models m ON sl.model_id=m.id
        LEFT JOIN sell_model_configs smc ON sl.config_id=smc.id
        LEFT JOIN sell_pickups sp ON sl.id=sp.listing_id
        JOIN addresses a ON sp.address_id=a.id
        LEFT JOIN enum_master em ON sl.status=em.id AND em.master_name='listing_status'
        WHERE sl.id=$1 AND sl.assigned_merchant_id=$2
        `, [id, userId]);
    return leads.rows;
};

exports.requestOTP = async ({ userId }, { listing_id, email }) => {
    // console.log(userId,'deva')
    const client = await pool.connect();
    // const id = uuid7();
    // let result;
    try {
        const getEmail = await client.query(`SELECT id FROM sell_listings WHERE id=$1`, [listing_id]);
        // // console.log(getEmail.rows)
        if (getEmail.rowCount === 0) throw { status: 400, message: "Invalid Listing Selected" };
        // const email = getEmail.rows[0].email;

        const existing = await client.query(`SELECT id, otp_hash, created_at, attempts FROM sell_listing_otps WHERE sent_to=$1 AND created_at BETWEEN NOW()- INTERVAL '10 min' AND NOW() ORDER BY created_at DESC`, [email]);

        // console.log("SANKet", existing.rows)
        if (existing.rowCount > 0 && existing.rows[0].attempts > 1) {
            throw {
                status: 429, message: `Too many attempts Wait for ${10 - (Math.floor(
                    (Date.now() - new Date(existing.rows[0].created_at).getTime()) / 60000))
                    } Minutes`
            }
        }
        if (existing.rowCount > 2) {
            const time = Date.now() - new Date(existing.rows[0].created_at).getTime();

            console.log("Time to wait", Math.floor(
                (Date.now() - new Date(existing.rows[0].created_at).getTime()) / 60000
            ), " Minutes");

            throw { status: 429, message: `Too many attempts. Retry after ${Math.ceil(10 - (time / (216000)))} minutes` };
        }
        // let otp;
        let id;
        if (existing.rowCount > 0) {
            otp = existing.rows[0].otp_hash;
            id = existing.rows[0].id;
            await client.query(`UPDATE sell_listing_otps SET attempts=attempts+1 WHERE id=$1`, [id]);
        } else {
            otp = Math.floor(100000 + Math.random() * 900000).toString();
            // const otp_hash = await bcrypt.hash(otp, SALT_ROUNDS);
            id = uuid7();
            result = await client.query("INSERT INTO sell_listing_otps (id, listing_id, sent_to, otp_hash) VALUES ($1, $2, $3, $4) RETURNING id", [id, listing_id, email, otp]);
        }
        if (!otp) throw { status: 500, message: "Error generating OTP" };

        await sendEmailOTP({ otp, email });
        await client.query('COMMIT');
        return { message: "OTP sent to email", id: id };
    } catch (error) {
        await client.query('ROLLBACK');
        throw { status: error.status || 500, message: error.message }
    }
    finally {
        client.release();
    }
}

exports.verifyOTP = async ({ user, id, otp }) => {
    if (!id || !otp) {
        throw { status: 400, message: "ID and OTP required" };
    }
    const client = await pool.connect();
    // const id = uuid7();
    let result;
    try {

        const otpResult = await client.query(
            `UPDATE sell_listing_otps SET attempts=attempts+1 WHERE id = $1 RETURNING sent_to, otp_hash, attempts-1 attempts, created_at`,
            [id]
        );
        if (otpResult.rowCount === 0) {
            throw { status: 404, message: "Invalid OTP" };
        }

        const otpRecord = otpResult.rows[0];

        const createdAt = new Date(otpRecord.created_at);
        const now = new Date();
        const diffMinutes = Math.floor((now - createdAt) / 60000);

        if (diffMinutes > 9) {
            throw { status: 401, message: "OTP Expired Request New" };
        }
        if (otpRecord.attempts >= 5) {
            throw {
                status: 429, message: `Max retries Exceeded. Request new OTP after ${10 - (Math.floor(
                    (Date.now() - new Date(createdAt).getTime()) / 60000))
                    } Minutes`
            };
        }

        // Verify OTP
        // const isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);
        console.log(otpRecord, otp)
        const isMatch = otp === otpRecord.otp_hash;
        if (!isMatch) {
            throw { status: 401, message: "Invalid OTP" };
        }

        await client.query(`DELETE FROM sell_listing_otps WHERE sent_to = $1`, [otpRecord.sent_to]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw { status: error.status || 500, message: error.message }
    }
    finally {
        client.release();
    }
    return { message: "OTP verified" };
}


exports.acceptLead = async ({ lead_id, merchant_id }) => {
    if (!lead_id || !merchant_id) throw { status: 400, message: "Invalid Data" };

    const result = await pool.query(
        `UPDATE sell_listings SET status=(SELECT id FROM enum_master WHERE master_name='listing_status' AND option_name='assigned')
        WHERE id=$1 AND assigned_merchant_id=$2 RETURNING *`,
        [lead_id, merchant_id]
    );
    if (result.rowCount == 0) throw { status: 403, message: "" }
    return result.rows;
}


exports.inviteMerchantAgent = async ({
    user_id, contact
}) => {

    if (!user_id || !contact) {
        throw { status: 400, message: "Contact Details are required" };
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const isMerchant = await client.query(
            `SELECT * FROM users u 
            JOIN user_roles ur ON ur.user_id=u.id 
            JOIN roles r ON ur.role_id=r.id
            WHERE r.name='merchant' AND u.id = $1`,
            [user_id]
        );

        if (isMerchant.rowCount == 0) {
            throw { status: 403, message: "Forbidden" };
        }
        const token = uuid7();
        const result = await client.query(
            `INSERT INTO merchant_agent_invites(merchant_id, contact, token)
            VALUES($1,$2,$3)
            ON CONFLICT(contact) DO UPDATE SET token=EXCLUDED.token, status=1, created_at = NOW()
            RETURNING *`,
            [user_id, contact, token]
        );

        const link = `${process.env.BASE_URL}/api/merchant/verify_agent?token=${token}`;
        // console.log(link, contact)

        await this.sendEmailOTP({ link: link, email: contact });
        await client.query('COMMIT');

        return result.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        throw { status: 500, message: error.message || "Internal Server Error" };
    } finally {
        client.release();
    }
};

exports.verifyMerchantAgent = async ({ token }) => {

    if (!token) {
        throw { status: 400, message: "Token is required" };
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `SELECT * FROM merchant_agent_invites mi
            JOIN users u ON mi.merchant_id=u.id
            WHERE mi.token = $1 AND mi.status < 3 AND mi.created_at > NOW() - INTERVAL '48 hours'`,
            [token]
        );

        if (result.rowCount == 0) {
            await client.query('UPDATE merchant_agent_invites SET status = 3 WHERE token=$1', [token]);
            throw { status: 403, message: "Invalid or Expired Token" };
        }

        await client.query(
            `UPDATE merchant_agent_invites SET status=2 WHERE token=$1`,
            [token]
        );
        // await this.sendEmailOTP({ link: link, email: contact });
        await client.query('COMMIT');

        return {
            message: "Token is valid. Agent can proceed with registration.", merchant_id: result.rows[0].merchant_id
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw { status: 500, message: error.message || "Internal Server Error" };
    } finally {
        client.release();
    }
};

exports.registerMerchantAgent = async ({ merchant_id, first_name, last_name, email, phone, password, token }) => {
    if (!merchant_id || !first_name || !last_name || !email || !phone || !password) {
        throw { status: 400, message: "Insufficient Details" };
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const [isTokenValid, isMerchantValid, isExisting] = await Promise.all([
            client.query(
                `SELECT token, contact FROM merchant_agent_invites WHERE token = $1 AND status = 2`,
                [token]
            ),
            client.query(
                `SELECT 1 FROM users u
                JOIN user_roles ur ON u.id=ur.user_id
                JOIN roles r ON ur.role_id=r.id
                WHERE u.id = $1 AND r.name='merchant'`,
                [merchant_id]
            ),
            client.query(
                `SELECT 1 FROM users WHERE email=$1`,
                [email]
            )
        ]);
        if (isTokenValid.rowCount === 0) {
            throw { status: 403, message: "Invalid or Expired Token" };
        }
        if (isTokenValid.rows[0].contact !== email) {
            throw { status: 403, message: "Invalid Invitee" };
        }
        if (isMerchantValid.rowCount === 0) {
            throw { status: 403, message: "Request Forbidden" };
        }
        if (isExisting.rowCount > 0) {
            throw { status: 409, message: "User with this email already exists" };
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        let agent = await client.query(
            `INSERT INTO users (email, phone, password) VALUES ($1, $2, $3) RETURNING id, email, phone`,
            [email, phone, hashedPassword]
        );
        const agent_profile = await client.query(
            `INSERT INTO user_profile (first_name, last_name, user_id) VALUES ($1, $2, $3) RETURNING first_name, last_name`,
            [first_name, last_name, agent.rows[0].id]
        );
        await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, (SELECT id FROM roles WHERE name='agent'))`,
            [agent.rows[0].id]
        );
        await client.query(`INSERT INTO merchant_agents (merchant_id, agent_user_id) VALUES ($1, $2)`, [merchant_id, agent.rows[0].id]);
        await client.query(
            `UPDATE merchant_agent_invites SET status=3,agent_user_id=$2 WHERE token=$1`,
            [token, agent.rows[0].id]
        );
        agent = { ...agent.rows[0], ...agent_profile.rows[0] };
        await client.query('COMMIT');

        return agent;

    } catch (error) {
        await client.query('ROLLBACK');
        throw { status: 500, message: error.message || "Internal Server Error" };
    } finally {
        client.release();
    }
};

exports.getRequoteQuestions = async (query) => {
    const client = await pool.connect();
    try {
        return await getQuestions(query);
    } catch (error) {
        await client.query('ROLLBACK');
        throw { status: 500, message: error.message || "Internal Server Error" };
    } finally {
        client.release();
    }
};

exports.postRequote = async ({listing_id, answers}) => {
    
}

exports.sendEmailOTP = async ({ link, email }) => {
    await sendEmail(
        email,
        "Verification Link from Resello",
        `Click this link to verify your account: ${link}. It expires in 48 hours.`,
        `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #333;">Registration Link</h2>
    <p>Use the following Link to verify your account. It expires in <b>48 hours</b>.</p>
    <h1 style="text-align: center; letter-spacing: 4px; color: #1a73e8;"> <a href="${link}" style="display:block;text-align:center;background:#1d4ed8;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-size:13px;font-weight:700;">Verify Agent →</a>
</h1>
    <p>If you did not request this, please ignore this email.</p>
    <hr>
    <p style="font-size: 12px; color: #888;">© 2026 Recello. All rights reserved.</p>
  </div>
  `
    );
}