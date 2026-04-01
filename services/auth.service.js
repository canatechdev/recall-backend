const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../providers/email.provider");
const { v7: uuid7 } = require('uuid');
// const { password } = require("pg/lib/defaults");


const SALT_ROUNDS = 10;


// VERIFY OTP
exports.verifyOTP = async (data) => {
    // console.log(data, "VERIFY OTP SERVICE")
    const { id, otp, name } = data;
    if (!id || !otp) {
        throw { status: 400, message: "ID and OTP required" };
    }

    const otpResult = await pool.query(
        `UPDATE auth_otp SET attempts=attempts+1 WHERE id = $1 RETURNING email, otp_hash, attempts-1 attempts, created_at`,
        [id]
    );

    if (otpResult.rowCount === 0) {
        throw { status: 404, message: "Invalid OTP" };
    }


    const otpRecord = otpResult.rows[0];
    const decision = await pool.query(`SELECT id FROM users WHERE email=$1`, [otpRecord.email]);
    if (!name && decision.rowCount === 0) {
        throw { status: 400, message: "Name is required for new registration" };
    }

    first_name = data.name ? data.name : "User" + Math.floor(Math.random() * 1000);
    console.log(otpRecord, "OTP RECORD")
    // Check expiry (10 minutes)
    const createdAt = new Date(otpRecord.created_at);
    const now = new Date();
    const diffMinutes = Math.floor((now - createdAt) / 60000);

    if (diffMinutes > 9) {
        throw { status: 401, message: "OTP Expired Request New" };
    }
    if (otpRecord.attempts >= 6) {
        throw { status: 429, message: "Max retries Exceeded" };
    }
    // Verify OTP
    // const isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);

    const isMatch = otp === otpRecord.otp_hash;
    if (!isMatch) {
        throw { status: 401, message: "Invalid OTP" };
    }

    // return { message: "OTP verified" };
    if (decision.rowCount > 0) {
        return await this.loginUser({ email: otpRecord.email, password: "system" });
    }

    await pool.query(`DELETE FROM auth_otp WHERE email = $1`, [otpRecord.email]);
    return await this.registerUser({ email: otpRecord.email, first_name: first_name, last_name: "", password: "system" });
}
// RESEND OTP
exports.resendOTP = async (data) => {
    const { id, email } = data;

    if (!email || !id) {
        throw { status: 400, message: "Email and ID required" };
    }
    const existing = await pool.query("UPDATE auth_otp SET attempts = attempts + 1 WHERE email=$1 AND id=$2 AND created_at BETWEEN NOW() - INTERVAL '5 minutes' AND NOW() RETURNING otp_hash, attempts", [email, id]);
    if (existing.rowCount === 0) {
        return await this.requestOTP({ email });
    }
    if (existing.rows[0].attempts > 2) {
        throw { status: 429, message: "Please Request new OTP" }
    }
    await this.sendEmailOTP({ otp: existing.rows[0].otp_hash, email: email });

    return { message: "OTP Re-sent", id };
}
// REQUEST OTP
exports.requestOTP = async (data) => {
    const { email } = data;

    if (!email) {
        throw { status: 400, message: "Email is required" };
    }

    const existing = await pool.query(`SELECT id, otp_hash, created_at FROM auth_otp WHERE email=$1 AND created_at BETWEEN NOW()- INTERVAL '10 min' AND NOW() ORDER BY created_at DESC`, [email]);

    if (existing.rowCount > 2) {
        const time = Date.now() - new Date(existing.rows[0].created_at).getTime();
        console.log("Time to wait", Math.floor(
            (Date.now() - new Date(existing.rows[0].created_at).getTime()) / 60000
        ), " Minutes")
        throw { status: 429, message: `Too many attempts. Retry after ${Math.ceil(10 - (time / (216000)))} minutes` };
    }
    let otp;
    let id;
    if (existing.rowCount > 0) {
        otp = existing.rows[0].otp_hash;
        id = existing.rows[0].id;
    } else {
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        // const otp_hash = await bcrypt.hash(otp, SALT_ROUNDS);
        id = uuid7();
        await pool.query("INSERT INTO auth_otp (id, email, otp_hash) VALUES ($1, $2, $3)", [id, email, otp]);
    }
    if (!otp) throw { status: 500, message: "Error generating OTP" };

    // console.log(process.env.BREVO_EMAIL, "EMAIL??")
    // console.log(process.env.BREVO_SMTP_KEY, "key??")
    await this.sendEmailOTP({ otp: otp, email: email });
    return { message: "OTP sent", id }; // Remove otp in production
};
exports.sendEmailOTP = async (data) => {
    const { otp, email } = data
    await sendEmail(
        email,
        "OTP from Resello",
        `Your OTP is ${otp}. It expires in 10 minutes.`,
        `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #333;">Verification Code</h2>
    <p>Use the following One-Time Password (OTP) to verify your account. It expires in <b>10 minutes</b>.</p>
    <h1 style="text-align: center; letter-spacing: 4px; color: #1a73e8;">${otp}</h1>
    <p>If you did not request this, please ignore this email.</p>
    <hr>
    <p style="font-size: 12px; color: #888;">© 2026 Your Company. All rights reserved.</p>
  </div>
  `
    );
}
// REGISTRATION
exports.registerUser = async (data) => {
    const client = await pool.connect();
    const { email, first_name, last_name, password } = data;
    // return 'sartak';
    if (!email || !first_name) {
        throw { status: 400, message: "Email and Name are required" };
    }

    try {
        await client.query("BEGIN");

        const existing = await client.query(
            `SELECT id FROM users WHERE email = $1`,
            [email]
        );

        if (existing.rowCount > 0) {
            throw { status: 409, message: "User already exists" };
        }

        // !NOT USING ENCRYPTION RN
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert user
        const userResult = await client.query(
            `
        INSERT INTO users (email,password)
        VALUES ($1,$2)
        RETURNING id, email
      `, [email, hashedPassword]);

        const userId = userResult.rows[0].id;
        // throw Error('ERROR SARTHAK'+userId)
        // Insert profile
        await client.query(
            `
      INSERT INTO user_profile (user_id, first_name, last_name)
      VALUES ($1, $2, $3)
      `,
            [userId, first_name, last_name],
        );

        // Assign default role (assume role_id = 1 is USER)
        await client.query(
            `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, 1)
      `,
            [userId],
        );

        // JWT
        // const token = jwt.sign({ userId, email }, process.env.JWT_REFRESH_SECRET, {
        //     expiresIn: process.env.JWT_EXPIRES_IN,
        // });

        await client.query("COMMIT");

        return await this.loginUser({ email: email, password: password })
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        throw { status: err.status, message: err.message || "Registration failed" };
    } finally {
        client.release();
    }
};

exports.loginUser = async (data) => {
    // console.log(req.body);throw Error('ERROR SARTHAK')
    const { email, password } = data;

    if (!email || !password) {
        throw { status: 400, message: "Email and password required" };
    }

    try {
        const userResult = await pool.query(
            `SELECT id, up.first_name name, email, password, status FROM users u 
            JOIN user_profile up ON u.id=up.user_id
            WHERE email = $1`,
            [email],
        );
        // console.log(userResult.rows);
        if (userResult.rowCount === 0) {
            throw { status: 401, message: "Invalid credential" };
        }

        const user = userResult.rows[0];

        if (user.status !== 1) {
            throw { status: 403, message: "User inactive" };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        // const isMatch = password == user.password;
        if (!isMatch) {
            throw { status: 401, message: "Invalid credentials" };
        }

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
        );

        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: `${process.env.REFRESH_EXPIRES_DAYS}d`,
        });

        await pool.query(
            `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '${process.env.REFRESH_EXPIRES_DAYS} days')
      `,
            [user.id, refreshToken],
        );

        return {
            accessToken,
            refreshToken,
            user
        }
    } catch (err) {
        console.error(err);
        throw { status: err.status, message: err.message || "Login failed" };
    }
};

exports.refreshToken = async (cookies) => {
    console.log( "REFRESH TOKEN RESULT")
    // console.log(req.cookies)
    const { refreshToken } = cookies;

    if (!refreshToken) {
        throw { status: 401, message: "No refresh token" };
    }

    try {
        // 1. check token exists in DB
        const result = await pool.query(
            "SELECT * FROM refresh_tokens WHERE token = $1",
            [refreshToken],
        );

        if (result.rows.length === 0) {
            throw { status: 401, message: "Invalid refresh token" };
        }
        // 2. verify refresh token
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // 3. issue NEW access token
        const accessToken = jwt.sign(
            { userId: payload.userId },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
        );
        return { accessToken };
    } catch (err) {
        throw { status: err.status, message: err.message || "Refresh failed" };
    }
};

exports.logoutUser = async (cookies) => {
    const { refreshToken } = cookies;

    if (refreshToken) {
        await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [
            refreshToken,
        ]);
    }
    return { status: 204, message: "Logged out" };
};


exports.initiateAuth = async (data) => {
    const { email } = data;
    const existing = await pool.query(`SELECT 1 ans from users WHERE email=$1`, [email]);

    return {
        isNewUser: existing.rowCount === 0
    }
};