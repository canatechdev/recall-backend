const pool = require('../config/database');

// ── Model Configs ─────────────────────────────────────────

exports.getModelConfigs = async ({ model_slug }) => {
    if (!model_slug) throw { status: 400, message: "Model Slug is required" };
    const result = await pool.query(
        `SELECT smc.id, model_id, smc.name, smc.base_price, smc.is_active
         FROM sell_model_configs smc
        JOIN models m ON smc.model_id=m.id
         WHERE m.slug=$1
         ORDER BY smc.id`,
        [model_slug]
    );
    return result.rows;
};

exports.createModelConfig = async ({ model_slug, name, base_price }) => {
    // const = data;
    if (!model_slug || !name || base_price == null) throw { status: 400, message: "model_slug, name and base_price are required" };

    const exists = await pool.query(
        `SELECT id FROM models WHERE slug=$1`, [model_slug]
    );
    if (exists.rowCount === 0) throw { status: 404, message: "Model not found" };
    const model_id = exists.rows[0].id;

    const dup = await pool.query(
        `SELECT 1 FROM sell_model_configs WHERE model_id=$1 AND name=$2`, [model_id, name]
    );
    if (dup.rowCount > 0) throw { status: 409, message: "Config with this name already exists for this model" };

    const result = await pool.query(
        `INSERT INTO sell_model_configs(model_id, name, base_price)
         VALUES ($1, $2, $3) RETURNING id, model_id, name, base_price, is_active`,
        [model_id, name, base_price]
    );
    return result.rows[0];
};

exports.updateModelConfig = async (id, data) => {
    const { name, base_price, is_active } = data;
    const result = await pool.query(
        `UPDATE sell_model_configs
         SET name=COALESCE($1, name),
             base_price=COALESCE($2, base_price),
             is_active=COALESCE($3, is_active)
         WHERE id=$4
         RETURNING id, model_id, name, base_price, is_active`,
        [name || null, base_price != null ? base_price : null, is_active != null ? is_active : null, id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Config not found" };
    return result.rows[0];
};

exports.deleteModelConfig = async (id) => {
    const result = await pool.query(
        `DELETE FROM sell_model_configs WHERE id=$1 RETURNING id, name`, [id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Config not found" };
    return result.rows[0];
};

// ── Sell Questions ────────────────────────────────────────

exports.getQuestions = async () => {
    const questions = await pool.query(
        `
            SELECT  que.id,
                    que.text,
                    que.sort_index,
                    que.input_type,
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', qo.id,
                                    'text', qo.text,
                                    'deduction', qo.price_deduction,
                                    'show',
                                    COALESCE(
                                        (
                                            SELECT jsonb_agg(show_question_id)
                                            FROM sell_question_conditions WHERE trigger_option_id=qo.id
                                        ),'[]'::JSONB
                                    )
                                )
                            )
                            FROM sell_question_options qo
                            WHERE qo.question_id = que.id
                        ) options,
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', cat.id,
                                    'name', cat.name
                                )
                            )
                            FROM sell_category_questions scq
                            JOIN categories cat ON scq.category_id=cat.id
                            WHERE scq.question_id=que.id
                        ) categories
            FROM sell_questions que
            ORDER BY que.sort_index, que.id
        `
    );
    return questions.rows;
};
exports.getQuestionsByModel = async ({ modelSlug }) => {
    if (!modelSlug) throw { status: 400, message: "Model Slug is required" };
    const questions = await pool.query(
        `
            SELECT m.name model,jsonb_agg(
                jsonb_build_object(
                    'id', que.id,
                    'question', que.text,
                    'que_type', que.input_type,
                    'options',
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', qo.id,
                                    'text', qo.text,
                                    'deduction', qo.price_deduction,
                                    'show',
                                    COALESCE(
                                        (
                                            SELECT jsonb_agg(show_question_id)
                                            FROM sell_question_conditions WHERE trigger_option_id=qo.id
                                        ),'[]'::JSONB
                                    )
                                )
                            )
                            FROM sell_question_options qo
                            WHERE qo.question_id = que.id
                    )
                )
            ) questions FROM models m
            JOIN sell_category_questions cq ON cq.category_id=m.category_id
            JOIN sell_questions que ON que.id=cq.question_id
            WHERE m.slug=$1
            GROUP BY m.name
        `,
        [modelSlug]
    );
    return questions.rows;
};

exports.getQuestionsByCategory = async (category_id) => {
    if (!category_id) throw { status: 400, message: "Category ID is required" };
    const questions = await pool.query(
        `SELECT sq.id, sq.text, sq.description, sq.input_type, sq.sort_index, sq.is_active,
                scq.sort_index category_sort
         FROM sell_questions sq
         JOIN sell_category_questions scq ON sq.id=scq.question_id
         WHERE scq.category_id=$1 AND sq.is_active=true
         ORDER BY scq.sort_index, sq.id`,
        [category_id]
    );

    for (const q of questions.rows) {
        const opts = await pool.query(
            `SELECT id, text, price_deduction, sort_index
             FROM sell_question_options
             WHERE question_id=$1
             ORDER BY sort_index, id`,
            [q.id]
        );
        q.options = opts.rows;
    }
    return questions.rows;
};

exports.createQuestion = async (data) => {
    console.log("Creating question with data:", data);
    const { text, description, input_type, sort_index, category_slugs } = data;
    if (!text || !input_type) throw { status: 400, message: "text and input_type are required" };

    const validTypes = ['yes_no', 'single_select', 'multi_select'];
    if (!validTypes.includes(input_type)) throw { status: 400, message: "input_type must be one of: " + validTypes.join(', ') };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO sell_questions(text, description, input_type, sort_index)
             VALUES ($1, $2, $3, $4) RETURNING id, text, description, input_type, sort_index, is_active`,
            [text, description || null, input_type, sort_index || 1]
        );
        const question = result.rows[0];
        let category_ids = [];
        if (category_slugs && category_slugs.length > 0) {
            for (let i = 0; i < category_slugs.length; i++) {
                const cat = await client.query(
                    `SELECT id FROM categories WHERE slug=$1`,
                    [category_slugs[i]]
                );
                if (cat.rowCount === 0) throw { status: 404, message: "Category not found" };
                category_ids.push(cat.rows[0].id);
                await client.query(
                    `INSERT INTO sell_category_questions(category_id, question_id, sort_index)
                     VALUES ($1, $2, $3)`,
                    [category_ids[i], question.id, i + 1]
                );
            }
        }

        await client.query('COMMIT');
        question.categories = category_ids || [];
        return question;
    } catch (e) {
        await client.query('ROLLBACK');
        throw { status: e.status || 500, message: e.message || "Failed to create question" };
    } finally {
        client.release();
    }
};

exports.updateQuestion = async (id, data) => {
    const { text, description, input_type, sort_index, is_active } = data;
    const result = await pool.query(
        `UPDATE sell_questions
         SET text=COALESCE($1, text),
             description=COALESCE($2, description),
             input_type=COALESCE($3, input_type),
             sort_index=COALESCE($4, sort_index),
             is_active=COALESCE($5, is_active)
         WHERE id=$6
         RETURNING id, text, description, input_type, sort_index, is_active`,
        [text || null, description !== undefined ? description : null, input_type || null, sort_index || null, is_active != null ? is_active : null, id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Question not found" };
    return result.rows[0];
};

exports.deleteQuestion = async (id) => {
    const result = await pool.query(
        `UPDATE sell_questions SET is_active=false WHERE id=$1 RETURNING id, text`, [id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Question not found" };
    return result.rows[0];
};

// ── Question Options ──────────────────────────────────────

exports.getQuestionOptions = async (question_id) => {
    const result = await pool.query(
        `SELECT id, text, price_deduction, sort_index
         FROM sell_question_options
         WHERE question_id=$1
         ORDER BY sort_index, id`,
        [question_id]
    );
    return result.rows;
};

exports.createQuestionOption = async (data) => {
    const { question_id, text, price_deduction, sort_index } = data;
    if (!question_id || !text) throw { status: 400, message: "question_id and text are required" };

    const qExists = await pool.query(`SELECT 1 FROM sell_questions WHERE id=$1`, [question_id]);
    if (qExists.rowCount === 0) throw { status: 404, message: "Question not found" };

    const result = await pool.query(
        `INSERT INTO sell_question_options(question_id, text, price_deduction, sort_index)
         VALUES ($1, $2, $3, $4) RETURNING id, text, price_deduction, sort_index`,
        [question_id, text, price_deduction || 0, sort_index || 1]
    );
    return result.rows[0];
};

exports.updateQuestionOption = async (id, data) => {
    const { text, price_deduction, sort_index } = data;
    const result = await pool.query(
        `UPDATE sell_question_options
         SET text=COALESCE($1, text),
             price_deduction=COALESCE($2, price_deduction),
             sort_index=COALESCE($3, sort_index)
         WHERE id=$4
         RETURNING id, text, price_deduction, sort_index`,
        [text || null, price_deduction != null ? price_deduction : null, sort_index || null, id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Option not found" };
    return result.rows[0];
};

exports.deleteQuestionOption = async (id) => {
    const result = await pool.query(
        `DELETE FROM sell_question_options WHERE id=$1 RETURNING id, text`, [id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Option not found" };
    return result.rows[0];
};

// ── Question Conditions ───────────────────────────────────

exports.getConditions = async (question_id) => {
    const result = await pool.query(
        `SELECT sqc.id, sqc.trigger_option_id, sqo.text trigger_option_text,
                sqc.show_question_id, sq.text show_question_text
         FROM sell_question_conditions sqc
         JOIN sell_question_options sqo ON sqc.trigger_option_id=sqo.id
         JOIN sell_questions sq ON sqc.show_question_id=sq.id
         WHERE sqo.question_id=$1
         ORDER BY sqc.id`,
        [question_id]
    );
    return result.rows;
};

exports.createCondition = async (data) => {
    console.log("Creating condition with data:", data);
    const { trigger_option_id, show_question_id } = data;
    if (!trigger_option_id || !show_question_id) throw { status: 400, message: "trigger_option_id and show_question_id are required" };

    const optExists = await pool.query(`SELECT 1 FROM sell_question_options WHERE id=$1`, [trigger_option_id]);
    if (optExists.rowCount === 0) throw { status: 404, message: "Trigger option not found" };

    const qExists = await pool.query(`SELECT 1 FROM sell_questions WHERE id=$1`, [show_question_id]);
    if (qExists.rowCount === 0) throw { status: 404, message: "Target question not found" };

    const dup = await pool.query(
        `SELECT 1 FROM sell_question_conditions WHERE trigger_option_id=$1 AND show_question_id=$2`,
        [trigger_option_id, show_question_id]
    );
    if (dup.rowCount > 0) throw { status: 409, message: "This condition already exists" };

    const result = await pool.query(
        `INSERT INTO sell_question_conditions(trigger_option_id, show_question_id)
         VALUES ($1, $2) RETURNING id, trigger_option_id, show_question_id`,
        [trigger_option_id, show_question_id]
    );
    return result.rows[0];
};

exports.deleteCondition = async (id) => {
    const result = await pool.query(
        `DELETE FROM sell_question_conditions WHERE id=$1 RETURNING id`, [id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Condition not found" };
    return result.rows[0];
};

// ── Category-Question Mapping ─────────────────────────────

exports.getCategoryQuestions = async (category_id) => {
    const result = await pool.query(
        `SELECT sq.id, sq.text, sq.input_type, sq.sort_index, scq.sort_index category_sort
         FROM sell_category_questions scq
         JOIN sell_questions sq ON scq.question_id=sq.id
         WHERE scq.category_id=$1 AND sq.is_active=true
         ORDER BY scq.sort_index`,
        [category_id]
    );
    return result.rows;
};

exports.mapQuestionToCategory = async (data) => {
    const { category_slug, question_id, sort_index } = data;
    if (!category_slug || !question_id) throw { status: 400, message: "category_slug and question_id are required" };

    const category = await pool.query(
        `SELECT id FROM categories WHERE slug=$1`,
        [category_slug]
    );
    if (category.rowCount === 0) throw { status: 404, message: "Category not found" };
    const category_id = category.rows[0].id;

    const dup = await pool.query(
        `SELECT 1 FROM sell_category_questions WHERE category_id=$1 AND question_id=$2`,
        [category_id, question_id]
    );
    if (dup.rowCount > 0) throw { status: 409, message: "Question already mapped to this category" };

    const result = await pool.query(
        `INSERT INTO sell_category_questions(category_id, question_id, sort_index)
         VALUES ($1, $2, $3) RETURNING category_id, question_id, sort_index`,
        [category_id, question_id, sort_index || 1]
    );
    return result.rows[0];
};

exports.unmapQuestionFromCategory = async (category_id, question_id) => {
    const result = await pool.query(
        `DELETE FROM sell_category_questions WHERE category_id=$1 AND question_id=$2
         RETURNING category_id, question_id`,
        [category_id, question_id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Mapping not found" };
    return result.rows[0];
};

// ── Sell Flow: Questions with Conditions for a Category ─────

exports.getQuestionsByCategorySlug = async (category_slug) => {
    if (!category_slug) throw { status: 400, message: "category_slug is required" };

    const catRes = await pool.query(`SELECT id FROM categories WHERE slug=$1`, [category_slug]);
    if (catRes.rowCount === 0) throw { status: 404, message: "Category not found" };
    const category_id = catRes.rows[0].id;

    // Get top-level questions for this category
    const questions = await pool.query(
        `SELECT sq.id, sq.text, sq.description, sq.input_type, sq.sort_index
         FROM sell_questions sq
         JOIN sell_category_questions scq ON sq.id=scq.question_id
         WHERE scq.category_id=$1 AND sq.is_active=true
         ORDER BY scq.sort_index, sq.id`,
        [category_id]
    );

    // For each question get options + conditions
    for (const q of questions.rows) {
        const opts = await pool.query(
            `SELECT id, text, price_deduction, sort_index
             FROM sell_question_options
             WHERE question_id=$1
             ORDER BY sort_index, id`,
            [q.id]
        );
        q.options = opts.rows;

        // For each option, check if it triggers another question
        for (const opt of q.options) {
            const conds = await pool.query(
                `SELECT sqc.show_question_id
                 FROM sell_question_conditions sqc
                 WHERE sqc.trigger_option_id=$1`,
                [opt.id]
            );
            opt.triggers = conds.rows.map(c => c.show_question_id);
        }
    }

    // Also gather all conditionally-shown questions (not in the category mapping but referenced via conditions)
    const condQuestionIds = new Set();
    for (const q of questions.rows) {
        for (const opt of q.options) {
            for (const tId of opt.triggers) {
                condQuestionIds.add(tId);
            }
        }
    }
    // Remove any that are already top-level
    const topIds = new Set(questions.rows.map(q => q.id));
    const extraIds = [...condQuestionIds].filter(id => !topIds.has(id));

    const conditionalQuestions = [];
    for (const qId of extraIds) {
        const qRes = await pool.query(
            `SELECT id, text, description, input_type, sort_index
             FROM sell_questions WHERE id=$1 AND is_active=true`,
            [qId]
        );
        if (qRes.rowCount === 0) continue;
        const cq = qRes.rows[0];
        const opts = await pool.query(
            `SELECT id, text, price_deduction, sort_index
             FROM sell_question_options WHERE question_id=$1 ORDER BY sort_index, id`,
            [cq.id]
        );
        cq.options = opts.rows;
        for (const opt of cq.options) {
            const conds = await pool.query(
                `SELECT sqc.show_question_id FROM sell_question_conditions sqc WHERE sqc.trigger_option_id=$1`,
                [opt.id]
            );
            opt.triggers = conds.rows.map(c => c.show_question_id);
        }
        conditionalQuestions.push(cq);
    }

    return {
        category_id,
        questions: questions.rows,           // top-level questions shown by default
        conditional_questions: conditionalQuestions  // shown only when triggered
    };
};

// ── Calculate Sell Price ─────────────────────────────────────

exports.calculateSellPrice = async (data) => {
    const { config_id, answers } = data;
    // answers = [{ question_id, option_id }, ...]

    if (!config_id) throw { status: 400, message: "config_id is required" };
    if (!answers || !Array.isArray(answers) || answers.length === 0)
        throw { status: 400, message: "answers array is required" };

    // Get base price from config
    const configRes = await pool.query(
        `SELECT base_price FROM sell_model_configs WHERE id=$1 AND is_active=true`,
        [config_id]
    );
    if (configRes.rowCount === 0) throw { status: 404, message: "Config not found" };

    const basePrice = parseFloat(configRes.rows[0].base_price);
    let finalPrice = basePrice;

    // Sum up flat deductions from selected options
    for (const ans of answers) {
        const optRes = await pool.query(
            `SELECT price_deduction FROM sell_question_options WHERE id=$1 AND question_id=$2`,
            [ans.option_id, ans.question_id]
        );
        if (optRes.rowCount > 0) {
            finalPrice -= parseFloat(optRes.rows[0].price_deduction);
        }
    }

    if (finalPrice < 0) finalPrice = 0;

    return {
        base_price: basePrice,
        total_deduction: basePrice - finalPrice,
        quoted_price: finalPrice
    };
};

// ── Create Sell Listing ──────────────────────────────────────

exports.createSellListing = async (data) => {
    console.log("Creating sell listing with data:", data);
    const { user_id, category_slug, brand_slug, model_slug, config_id, answers, expected_price } = data;

    if (!model_slug || !config_id || !answers || !expected_price || answers.length === 0)
        throw { status: 400, message: "model_slug, config_id, answers, and expected_price are required" };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Resolve IDs
        const modelRes = await client.query(
            `SELECT m.id model_id, m.brand_id, m.category_id
             FROM models m WHERE m.slug=$1`,
            [model_slug]
        );
        if (modelRes.rowCount === 0) throw { status: 404, message: "Model not found" };
        const { model_id, brand_id, category_id } = modelRes.rows[0];

        // Calculate quoted price from answers
        const configRes = await client.query(
            `SELECT base_price FROM sell_model_configs WHERE id=$1 AND is_active=true`,
            [config_id]
        );
        if (configRes.rowCount === 0) throw { status: 404, message: "Config not found" };

        let base_price = parseFloat(configRes.rows[0].base_price);
        // console.log("Base price from config:", base_price);
        let quoted_price = base_price;
        // console.log("quoted price", quoted_price)
        // Each price_deduction is a flat amount to subtract
        for (const ans of answers) {
            for (const opt of ans.options) {
                const optRes = await client.query(
                    `SELECT price_deduction FROM sell_question_options WHERE id=$1 AND question_id=$2`,
                    [opt, ans.question_id]
                );
                // console.log("deva", ans, opt, optRes.rows);
                if (optRes.rowCount > 0) {
                    quoted_price -= (base_price * parseFloat(optRes.rows[0].price_deduction))/100;
                }
            }
        }
        // console.log('rizz_quoted_price', quoted_price)
        if (quoted_price < 0) quoted_price = 0;

        // Insert listing
        const listingRes = await client.query(
            `INSERT INTO sell_listings(user_id, category_id, brand_id, model_id, config_id, base_price, quoted_price, expected_price, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1)
             RETURNING id`,
            [user_id || null, category_id, brand_id, model_id, config_id, base_price, quoted_price, expected_price]
        );
        const listing_id = listingRes.rows[0].id;

        // Insert answers
        for (const ans of answers) {
            for (const opt of ans.options) {
                await client.query(
                    `INSERT INTO sell_listing_answers(listing_id, question_id, option_id)
                 VALUES ($1, $2, $3)`,
                    [listing_id, ans.question_id, opt]
                );
            }
        }

        await client.query('COMMIT');
        return { id: listing_id, base_price, quoted_price, expected_price, status: 'pending' };
    } catch (e) {
        await client.query('ROLLBACK');
        throw { status: e.status || 500, message: e.message || "Failed to create listing" };
    } finally {
        client.release();
    }
};

// ── Get Sell Listings (Leads) ────────────────────────────────

exports.getListings = async ({ status }) => {
    const values = [];
    let whereClause = "WHERE 1=1";

    if (status) {
        values.push(parseInt(status));
        whereClause += ` AND sl.status=$${values.length}`;
    }

    const result = await pool.query(`
        SELECT sl.id, sl.base_price, sl.quoted_price, sl.expected_price,
               sl.created_at, sl.updated_at,
               em.option_name status_label,
               u.email user_email,
               up.first_name, up.last_name,
               c.name category, b.name brand, m.name model,
               smc.name config_name,
               mu.email merchant_email,
               mup.first_name merchant_first_name, mup.last_name merchant_last_name
        FROM sell_listings sl
        LEFT JOIN users u ON sl.user_id=u.id
        LEFT JOIN user_profile up ON u.id=up.user_id
        LEFT JOIN categories c ON sl.category_id=c.id
        LEFT JOIN brands b ON sl.brand_id=b.id
        LEFT JOIN models m ON sl.model_id=m.id
        LEFT JOIN sell_model_configs smc ON sl.config_id=smc.id
        LEFT JOIN enum_master em ON sl.status=em.id AND em.master_name='listing_status'
        LEFT JOIN users mu ON sl.assigned_merchant_id=mu.id
        LEFT JOIN user_profile mup ON mu.id=mup.user_id
        ${whereClause}
        ORDER BY sl.created_at DESC
        LIMIT 100
    `, values);

    return result.rows;
};

// ── Assign Listing to Merchant ───────────────────────────────

exports.assignListing = async (listing_id, merchant_id) => {
    if (!listing_id || !merchant_id)
        throw { status: 400, message: "listing_id and merchant_id are required" };

    // Verify merchant has merchant role
    const merchantCheck = await pool.query(
        `SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id=r.id
         WHERE ur.user_id=$1 AND r.name='merchant'`,
        [merchant_id]
    );
    if (merchantCheck.rowCount === 0)
        throw { status: 400, message: "User is not a merchant" };

    const result = await pool.query(
        `UPDATE sell_listings
         SET assigned_merchant_id=$1, status=2, updated_at=NOW()
         WHERE id=$2 AND status=1
         RETURNING id`,
        [merchant_id, listing_id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Listing not found or not in pending status" };
    return result.rows[0];
};

// ── Transfer Listing (mark as transferred) ───────────────────

exports.transferListing = async (listing_id) => {
    if (!listing_id) throw { status: 400, message: "listing_id is required" };
    const result = await pool.query(
        `UPDATE sell_listings SET status=4, updated_at=NOW()
         WHERE id=$1 AND status=2
         RETURNING id`,
        [listing_id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Listing not found or not in assigned status" };
    return result.rows[0];
};

// ── Reject Listing ───────────────────────────────────────────

exports.rejectListing = async (listing_id) => {
    if (!listing_id) throw { status: 400, message: "listing_id is required" };
    const result = await pool.query(
        `UPDATE sell_listings SET status=3, updated_at=NOW()
         WHERE id=$1 AND (status=1 OR status=2)
         RETURNING id`,
        [listing_id]
    );
    if (result.rowCount === 0) throw { status: 404, message: "Listing not found or already rejected" };
    return result.rows[0];
};

// ── Get Merchants ────────────────────────────────────────────

exports.getMerchants = async () => {
    const result = await pool.query(
        `SELECT u.id, u.email, up.first_name, up.last_name
         FROM users u
         JOIN user_roles ur ON u.id=ur.user_id
         JOIN roles r ON ur.role_id=r.id
         JOIN user_profile up ON u.id=up.user_id
         WHERE r.name='merchant' AND u.status=1
         ORDER BY up.first_name`
    );
    return result.rows;
};
