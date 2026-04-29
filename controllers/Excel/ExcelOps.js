const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const db = require('../../config/database');
// const logger = require('../../lib/logger');

// ── Helpers ──────────────────────────────────────────────────────────────────
function cleanValue(v) {
    if (v === undefined || v === null || v === '') return null;
    return String(v).trim();
}

function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
        .replace(/\s+/g, '-')            // spaces → hyphens
        .replace(/-+/g, '-');            // collapse multiple hyphens
}

async function fetchLeafCategorySlugs() {
    const result = await db.query(
        `SELECT slug
         FROM categories
         WHERE parent_id IS NOT NULL
           AND slug IS NOT NULL
         ORDER BY slug ASC`
    );
    return result.rows.map(r => r.slug).filter(Boolean);
}

async function fetchBrandSlugs() {
    const result = await db.query(
        `SELECT slug
         FROM brands
         WHERE slug IS NOT NULL
         ORDER BY slug ASC`
    );
    return result.rows.map(r => r.slug).filter(Boolean);
}

async function fetchSeriesSlugs() {
    const result = await db.query(
        `SELECT slug
         FROM model_series
         WHERE slug IS NOT NULL
         ORDER BY slug ASC`
    );
    return result.rows.map(r => r.slug).filter(Boolean);
}

async function fetchFirstSeriesSlugForBrand(brandSlug) {
    if (!brandSlug) return null;
    const result = await db.query(
        `SELECT ms.slug
         FROM model_series ms
         JOIN brands b ON b.id = ms.brand_id
         WHERE b.slug = $1
           AND ms.slug IS NOT NULL
         ORDER BY ms.slug ASC
         LIMIT 1`,
        [brandSlug]
    );
    return result.rows[0]?.slug || null;
}

// ── GET /api/models/template ───────────────────────────────────────────────
async function generateModelsTemplate(req, res) {
    try {
        const workbook = new ExcelJS.Workbook();
        const mainSheet = workbook.addWorksheet('Models Template');

        const categorySlugs = await fetchLeafCategorySlugs();
        const brandSlugs = await fetchBrandSlugs();
        const seriesSlugs = await fetchSeriesSlugs();

        const listsSheet = workbook.addWorksheet('Lists');
        listsSheet.state = 'veryHidden';
        categorySlugs.forEach((slug, i) => {
            listsSheet.getCell(`A${i + 1}`).value = slug;
        });
        brandSlugs.forEach((slug, i) => {
            listsSheet.getCell(`B${i + 1}`).value = slug;
        });
        seriesSlugs.forEach((slug, i) => {
            listsSheet.getCell(`C${i + 1}`).value = slug;
        });

        let currentRow = 1;
        mainSheet.mergeCells(`A${currentRow}:C${currentRow}`);
        const titleCell = mainSheet.getCell(`A${currentRow}`);
        titleCell.value = 'MODEL UPLOAD TEMPLATE';
        titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56A0' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        mainSheet.getRow(currentRow).height = 30;
        currentRow++;

        const instructions = [
            'Instructions:',
            '- Fields marked with * are mandatory',
            '- Slug is auto-generated from Model Name on import (lowercase, hyphenated) — leave it blank or provide a custom one',
            '- Fill the Context section once (Category / Brand / Series), then enter models below',
            '- Status: optional (1=active, 2=inactive, 3=deprecated). Defaults to 1',
        ];
        instructions.forEach((line) => {
            mainSheet.getRow(currentRow).values = [line];
            mainSheet.getRow(currentRow).font = { italic: true, color: { argb: 'FFCC0000' }, size: 10 };
            currentRow++;
        });
        currentRow++;

        // ── Context (fill once) ─────────────────────────────────────────────
        mainSheet.getRow(currentRow).values = ['Context (fill once):'];
        mainSheet.getRow(currentRow).font = { bold: true };
        currentRow++;

        const ctxCategoryRow = currentRow;
        mainSheet.getRow(currentRow).values = ['Category Slug *', '', ''];
        currentRow++;
        const ctxBrandRow = currentRow;
        mainSheet.getRow(currentRow).values = ['Brand Slug *', '', ''];
        currentRow++;
        const ctxSeriesRow = currentRow;
        mainSheet.getRow(currentRow).values = ['Series Slug *', '', ''];
        currentRow++;
        currentRow++;

        const categoryListFormula = categorySlugs.length
            ? `=Lists!$A$1:$A$${categorySlugs.length}`
            : '""';
        const brandListFormula = brandSlugs.length
            ? `=Lists!$B$1:$B$${brandSlugs.length}`
            : '""';
        const seriesListFormula = seriesSlugs.length
            ? `=Lists!$C$1:$C$${seriesSlugs.length}`
            : '""';

        mainSheet.getCell(`B${ctxCategoryRow}`).dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: [categoryListFormula],
            showErrorMessage: true,
            errorTitle: 'Invalid Category',
            error: 'Select a valid category slug from the dropdown',
        };
        mainSheet.getCell(`B${ctxBrandRow}`).dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: [brandListFormula],
            showErrorMessage: true,
            errorTitle: 'Invalid Brand',
            error: 'Select a valid brand slug from the dropdown',
        };
        mainSheet.getCell(`B${ctxSeriesRow}`).dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: [seriesListFormula],
            showErrorMessage: true,
            errorTitle: 'Invalid Series',
            error: 'Select a valid series slug from the dropdown',
        };

        const prefillCategoryRaw = cleanValue(req.query?.category_slug) || cleanValue(req.query?.cat_slug);
        const prefillBrandRaw = cleanValue(req.query?.brand_slug);
        const prefillSeriesRaw = cleanValue(req.query?.series_slug);
        const prefillCategory = prefillCategoryRaw ? String(prefillCategoryRaw).toLowerCase() : null;
        const prefillBrand = prefillBrandRaw ? String(prefillBrandRaw).toLowerCase() : null;
        const prefillSeries = prefillSeriesRaw ? slugify(String(prefillSeriesRaw)) : null;

        const sampleCategory = categorySlugs[0] || '';
        const sampleBrand = brandSlugs[0] || '';
        const sampleSeries = (await fetchFirstSeriesSlugForBrand(sampleBrand)) || seriesSlugs[0] || '';

        mainSheet.getCell(`B${ctxCategoryRow}`).value = prefillCategory || sampleCategory;
        mainSheet.getCell(`B${ctxBrandRow}`).value = prefillBrand || sampleBrand;
        mainSheet.getCell(`B${ctxSeriesRow}`).value = prefillSeries || sampleSeries;

        const HEADER_ROW = currentRow;
        mainSheet.getRow(HEADER_ROW).values = [
            'Model Name *',
            'Slug (auto if blank)',
            'Status (1/2/3)',
        ];
        mainSheet.getRow(HEADER_ROW).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        mainSheet.getRow(HEADER_ROW).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        mainSheet.getRow(HEADER_ROW).height = 20;

        [35, 30, 18].forEach((w, i) => {
            mainSheet.getColumn(i + 1).width = w;
        });

        const FIRST_DATA_ROW = HEADER_ROW + 1;
        for (let i = 0; i < 200; i++) {
            const row = FIRST_DATA_ROW + i;
            mainSheet.getRow(row).height = 20;
        }

        // sample
        mainSheet.getRow(FIRST_DATA_ROW).values = [
            'Galaxy S24 Ultra',
            'galaxy-s24-ultra',
            1,
        ];
        mainSheet.getRow(FIRST_DATA_ROW).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
        mainSheet.getRow(FIRST_DATA_ROW).font = { italic: true, color: { argb: 'FF555555' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Model_Upload_Template.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ── POST /api/models/import ────────────────────────────────────────────────
async function processModelsUploadedFile(req, res) {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    try {
        const DEBUG = String(process.env.DEBUG_MODELS_EXCEL_IMPORT || '').toLowerCase() === '1'
            || String(process.env.DEBUG_MODELS_EXCEL_IMPORT || '').toLowerCase() === 'true';

        if (DEBUG) {
            console.log('[models-import] file:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                hasBuffer: !!req.file.buffer,
                hasPath: !!req.file.path,
            });
        }

        const workbook = req.file.buffer
            ? xlsx.read(req.file.buffer, { type: 'buffer' })
            : (req.file.path ? xlsx.readFile(req.file.path) : null);
        if (!workbook) {
            return res.status(400).json({ success: false, message: 'Invalid upload: expected an Excel file buffer or path' });
        }
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const reqCategorySlugRaw = cleanValue(req.body?.category_slug) || cleanValue(req.body?.cat_slug);
        const reqBrandSlugRaw = cleanValue(req.body?.brand_slug);
        const reqSeriesSlugRaw = cleanValue(req.body?.series_slug);
        const reqCategorySlug = reqCategorySlugRaw ? String(reqCategorySlugRaw).toLowerCase() : null;
        const reqBrandSlug = reqBrandSlugRaw ? String(reqBrandSlugRaw).toLowerCase() : null;
        const reqSeriesSlug = reqSeriesSlugRaw ? slugify(String(reqSeriesSlugRaw)) : null;

        let headerRow = null;
        let mode = null; // 'context' | 'legacy'
        for (let r = 1; r <= 50; r++) {
            const aCell = sheet[`A${r}`];
            const value = cleanValue(aCell?.v);
            if (value === 'Model Name *') {
                headerRow = r;
                mode = 'context';
                break;
            }
            if (value === 'Category Slug *') {
                const bValue = cleanValue(sheet[`B${r}`]?.v);
                if (bValue === 'Brand Slug *') {
                    headerRow = r;
                    mode = 'legacy';
                    break;
                }
            }
        }
        if (!headerRow) {
            return res.status(400).json({ success: false, message: 'Invalid template: could not find header row "Model Name *" in column A' });
        }
        if (DEBUG) console.log('[models-import] detected headerRow:', headerRow, 'mode:', mode);
        const firstDataRow = headerRow + 1;

        // If UI didn't send context, try to read it from the template context section
        // Expected labels in column A with values in column B
        if (mode === 'context' && (!reqCategorySlug || !reqBrandSlug || !reqSeriesSlug)) {
            const findContextValue = (label) => {
                const maxRow = Math.min(80, headerRow - 1);
                for (let r = 1; r <= maxRow; r++) {
                    const a = cleanValue(sheet[`A${r}`]?.v);
                    if (a === label) {
                        return cleanValue(sheet[`B${r}`]?.v);
                    }
                }
                return null;
            };

            const sheetCategory = !reqCategorySlug ? findContextValue('Category Slug *') : null;
            const sheetBrand = !reqBrandSlug ? findContextValue('Brand Slug *') : null;
            const sheetSeries = !reqSeriesSlug ? findContextValue('Series Slug *') : null;

            if (sheetCategory && !reqCategorySlugRaw) req.body.category_slug = sheetCategory;
            if (sheetBrand && !reqBrandSlugRaw) req.body.brand_slug = sheetBrand;
            if (sheetSeries && !reqSeriesSlugRaw) req.body.series_slug = sheetSeries;
        }

        // recompute after potential sheet context injection
        const reqCategorySlugRaw2 = cleanValue(req.body?.category_slug) || cleanValue(req.body?.cat_slug);
        const reqBrandSlugRaw2 = cleanValue(req.body?.brand_slug);
        const reqSeriesSlugRaw2 = cleanValue(req.body?.series_slug);
        const reqCategorySlug2 = reqCategorySlugRaw2 ? String(reqCategorySlugRaw2).toLowerCase() : null;
        const reqBrandSlug2 = reqBrandSlugRaw2 ? String(reqBrandSlugRaw2).toLowerCase() : null;
        const reqSeriesSlug2 = reqSeriesSlugRaw2 ? slugify(String(reqSeriesSlugRaw2)) : null;

        const rows = xlsx.utils.sheet_to_json(sheet, mode === 'legacy' ? {
            header: ['category_slug', 'brand_slug', 'series_slug', 'name', 'slug', 'status'],
            range: firstDataRow - 1,
        } : {
            header: ['name', 'slug', 'status'],
            range: firstDataRow - 1,
        });

        const inserted = [], failedRows = [];
        const FIRST_DATA_EXCEL_ROW = firstDataRow;

        for (const [index, row] of rows.entries()) {
            const EXCEL_ROW_NUM = FIRST_DATA_EXCEL_ROW + index;

            if (mode === 'legacy') {
                if (!row.category_slug && !row.brand_slug && !row.series_slug && !row.name && !row.slug && !row.status) continue;
            } else {
                if (!row.name && !row.slug && !row.status) continue;
            }

            try {
                const categorySlugLegacyRaw = mode === 'legacy' ? cleanValue(row.category_slug) : null;
                const brandSlugLegacyRaw = mode === 'legacy' ? cleanValue(row.brand_slug) : null;
                const seriesSlugLegacyRaw = mode === 'legacy' ? cleanValue(row.series_slug) : null;

                const categorySlug = (reqCategorySlug2 || (categorySlugLegacyRaw ? String(categorySlugLegacyRaw).toLowerCase() : null));
                const brandSlug = (reqBrandSlug2 || (brandSlugLegacyRaw ? String(brandSlugLegacyRaw).toLowerCase() : null));
                const seriesSlug = (reqSeriesSlug2 || (seriesSlugLegacyRaw ? slugify(String(seriesSlugLegacyRaw)) : null));

                if (!categorySlug) throw new Error('Category Slug is required');
                if (!brandSlug) throw new Error('Brand Slug is required');
                if (!seriesSlug) throw new Error('Series Slug is required');

                const name = cleanValue(row.name);
                if (!name) throw new Error('Model Name is required');

                const slug = cleanValue(row.slug) || slugify(name);
                if (!/^[a-z0-9-]+$/.test(slug)) {
                    throw new Error(`Slug "${slug}" contains invalid characters (only lowercase letters, numbers, hyphens)`);
                }

                const statusRaw = cleanValue(row.status);
                const status = statusRaw ? Number(statusRaw) : 1;
                const statusFinal = Number.isFinite(status) && status > 0 ? status : 1;

                const client = await db.connect();
                try {
                    await client.query('BEGIN');

                    const categoryResult = await client.query(
                        `SELECT id
                         FROM categories
                         WHERE slug = $1
                           AND parent_id IS NOT NULL
                         LIMIT 1`,
                        [categorySlug]
                    );
                    if (!categoryResult.rows.length) throw new Error(`Category slug "${categorySlug}" not found (or not a child category)`);
                    const categoryId = categoryResult.rows[0].id;

                    const brandResult = await client.query(
                        `SELECT id FROM brands WHERE slug = $1 LIMIT 1`,
                        [brandSlug]
                    );
                    if (!brandResult.rows.length) throw new Error(`Brand slug "${brandSlug}" not found`);
                    const brandId = brandResult.rows[0].id;

                    const seriesResult = await client.query(
                        `SELECT id
                         FROM model_series
                         WHERE brand_id = $1
                           AND slug = $2
                         LIMIT 1`,
                        [brandId, seriesSlug]
                    );
                    if (!seriesResult.rows.length) throw new Error(`Series slug "${seriesSlug}" not found for brand "${brandSlug}"`);
                    const seriesId = seriesResult.rows[0].id;

                    const modelResult = await client.query(
                        `INSERT INTO models (brand_id, series_id, category_id, name, slug, status)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (brand_id, category_id, series_id, name) DO UPDATE
                           SET slug = EXCLUDED.slug,
                               status = EXCLUDED.status
                         RETURNING id`,
                        [brandId, seriesId, categoryId, name, slug, statusFinal]
                    );

                    await client.query('COMMIT');
                    inserted.push({ category_slug: categorySlug, brand_slug: brandSlug, series_slug: seriesSlug, name, slug, status: statusFinal, model_id: modelResult.rows[0].id });
                } catch (e) {
                    try { await client.query('ROLLBACK'); } catch (_) { }
                    throw e;
                } finally {
                    client.release();
                }
            } catch (err) {
                if (DEBUG) {
                    console.log('[models-import] row failed:', {
                        rowNumber: EXCEL_ROW_NUM,
                        error: err?.message,
                        code: err?.code,
                        detail: err?.detail,
                    });
                }
                failedRows.push({
                    rowNumber: EXCEL_ROW_NUM,
                    data: row,
                    error: err?.message || 'Row failed',
                    code: err?.code,
                    detail: err?.detail,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `${inserted.length} model row(s) processed`,
            data: {
                inserted_count: inserted.length,
                failed_count: failedRows.length,
                inserted,
                failed: failedRows,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// ── GET /api/brands/template ─────────────────────────────────────────────────
async function generateTemplate(req, res) {
    try {
        const workbook = new ExcelJS.Workbook();
        const mainSheet = workbook.addWorksheet('Brands Template');

        const categorySlugs = await fetchLeafCategorySlugs();
        const listsSheet = workbook.addWorksheet('Lists');
        listsSheet.state = 'veryHidden';
        categorySlugs.forEach((slug, i) => {
            listsSheet.getCell(`A${i + 1}`).value = slug;
        });

        // ── Title ─────────────────────────────────────────────────────────────
        let currentRow = 1;
        mainSheet.mergeCells(`A${currentRow}:D${currentRow}`);
        const titleCell = mainSheet.getCell(`A${currentRow}`);
        titleCell.value = 'BRAND UPLOAD TEMPLATE';
        titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56A0' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        mainSheet.getRow(currentRow).height = 30;
        currentRow++;

        // ── Instructions ──────────────────────────────────────────────────────
        const instructions = [
            'Instructions:',
            '- Fields marked with * are mandatory',
            '- Slug is auto-generated from Brand Name on import (lowercase, hyphenated) — leave it blank or provide a custom one',
            '- Category: select a category slug from the dropdown (only categories where parent_id is not null)',
            '- Alt Text: short description (stored on the brand record)',
        ];
        instructions.forEach((line) => {
            mainSheet.getRow(currentRow).values = [line];
            mainSheet.getRow(currentRow).font = { italic: true, color: { argb: 'FFCC0000' }, size: 10 };
            currentRow++;
        });
        currentRow++; // spacer

        // ── Headers ───────────────────────────────────────────────────────────
        const HEADER_ROW = currentRow;
        mainSheet.getRow(HEADER_ROW).values = [
            'Brand Name *', 'Slug (auto if blank)', 'Alt Text', 'Category Slug *'
        ];
        mainSheet.getRow(HEADER_ROW).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        mainSheet.getRow(HEADER_ROW).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        mainSheet.getRow(HEADER_ROW).height = 20;

        // Column widths
        [30, 30, 35, 35].forEach((w, i) => {
            mainSheet.getColumn(i + 1).width = w;
        });

        const FIRST_DATA_ROW = HEADER_ROW + 1;
        const categoryListFormula = categorySlugs.length
            ? `=Lists!$A$1:$A$${categorySlugs.length}`
            : '""';

        // Category dropdown (col D) for 200 rows
        for (let i = 0; i < 200; i++) {
            const row = FIRST_DATA_ROW + i;
            mainSheet.getCell(`D${row}`).dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: [categoryListFormula],
                showErrorMessage: true,
                errorTitle: 'Invalid Category',
                error: 'Select a valid category slug from the dropdown',
            };
            mainSheet.getRow(row).height = 20;
        }

        // ── Sample row ────────────────────────────────────────────────────────
        mainSheet.getRow(FIRST_DATA_ROW).values = ['Nike', 'nike', 'Nike brand alt text', categorySlugs[0] || ''];
        mainSheet.getRow(FIRST_DATA_ROW).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
        mainSheet.getRow(FIRST_DATA_ROW).font = { italic: true, color: { argb: 'FF555555' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Brand_Upload_Template.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        // logger.error('Brand template generation failed:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// ── POST /api/brands/upload ──────────────────────────────────────────────────
async function processUploadedFile(req, res) {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    try {
        const DEBUG = String(process.env.DEBUG_BRANDS_EXCEL_IMPORT || '').toLowerCase() === '1'
            || String(process.env.DEBUG_BRANDS_EXCEL_IMPORT || '').toLowerCase() === 'true';

        if (DEBUG) {
            console.log('[brands-import] file:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                hasBuffer: !!req.file.buffer,
                hasPath: !!req.file.path,
            });
        }
        // ── Parse sheet data ──────────────────────────────────────────────────
        const workbook = req.file.buffer
            ? xlsx.read(req.file.buffer, { type: 'buffer' })
            : (req.file.path ? xlsx.readFile(req.file.path) : null);
        if (!workbook) {
            return res.status(400).json({
                success: false,
                message: 'Invalid upload: expected an Excel file buffer or path',
            });
        }
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Discover header row (so template instruction lines can change safely)
        let headerRow = null; // 1-based
        for (let r = 1; r <= 50; r++) {
            const aCell = sheet[`A${r}`];
            const value = cleanValue(aCell?.v);
            if (value === 'Brand Name *') {
                headerRow = r;
                break;
            }
        }
        if (!headerRow) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template: could not find header row "Brand Name *" in column A',
            });
        }
        if (DEBUG) console.log('[brands-import] detected headerRow:', headerRow);
        const firstDataRow = headerRow + 1; // 1-based

        const rows = xlsx.utils.sheet_to_json(sheet, {
            header: ['name', 'slug', 'alt_text', 'category_slug'],
            range: firstDataRow - 1, // SheetJS expects 0-based row index
        });

        if (DEBUG) {
            console.log('[brands-import] parsed rows:', rows.length);
            console.log('[brands-import] first row preview:', rows[0]);
        }

        const inserted = [], failedRows = [];
        const FIRST_DATA_EXCEL_ROW = firstDataRow;

        for (const [index, row] of rows.entries()) {
            const EXCEL_ROW_NUM = FIRST_DATA_EXCEL_ROW + index;

            // Skip completely empty rows
            if (!row.name && !row.slug) continue;

            try {
                // ── Brand fields ──────────────────────────────────────────────
                const name = cleanValue(row.name);
                if (!name) throw new Error('Brand Name is required');

                const slug = cleanValue(row.slug) || slugify(name);
                if (!/^[a-z0-9-]+$/.test(slug))
                    throw new Error(`Slug "${slug}" contains invalid characters (only lowercase letters, numbers, hyphens)`);

                const categorySlugRaw = cleanValue(row.category_slug);
                const categorySlug = categorySlugRaw ? String(categorySlugRaw).toLowerCase() : null;
                if (!categorySlug) throw new Error('Category Slug is required');

                // ── Insert brand + category mapping (transaction per row) ─────
                const client = await db.connect();
                try {
                    await client.query('BEGIN');

                    const brandResult = await client.query(
                        `INSERT INTO brands (name, slug, status)
                         VALUES ($1, $2, 1)
                         ON CONFLICT (slug) DO UPDATE
                           SET name = EXCLUDED.name,
                               status = EXCLUDED.status
                         RETURNING id`,
                        [name, slug]
                    );
                    const brandId = brandResult.rows[0].id;
                    const categoryResult = await client.query(
                        `SELECT id
                         FROM categories
                         WHERE slug = $1
                           AND parent_id IS NOT NULL
                         LIMIT 1`,
                        [categorySlug]
                    );
                    if (!categoryResult.rows.length) {
                        throw new Error(`Category slug "${categorySlug}" not found (or not a child category)`);
                    }
                    const categoryId = categoryResult.rows[0].id;

                    // Replace existing category mapping (single category per brand from Excel)
                    await client.query(
                        `DELETE FROM brand_categories WHERE brand_id = $1`,
                        [brandId]
                    );
                    await client.query(
                        `INSERT INTO brand_categories (brand_id, category_id)
                         VALUES ($1, $2)`,
                        [brandId, categoryId]
                    );

                    await client.query('COMMIT');
                    inserted.push({ name, slug, brand_id: brandId, category_slug: categorySlug });
                } catch (e) {
                    try { await client.query('ROLLBACK'); } catch (_) { }
                    throw e;
                } finally {
                    client.release();
                }

            } catch (err) {
                // logger.error(`Row ${EXCEL_ROW_NUM} failed:`, err.message);
                if (DEBUG) {
                    console.log('[brands-import] row failed:', {
                        rowNumber: EXCEL_ROW_NUM,
                        error: err?.message,
                        code: err?.code,
                        detail: err?.detail,
                    });
                }
                failedRows.push({
                    rowNumber: EXCEL_ROW_NUM,
                    data: row,
                    error: err?.message || 'Row failed',
                    code: err?.code,
                    detail: err?.detail,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `${inserted.length} brand(s) processed`,
            data: {
                inserted_count: inserted.length,
                failed_count: failedRows.length,
                inserted,
                failed: failedRows,
            },
        });

    } catch (err) {
        // logger.error('Brand upload error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}

// ── GET /api/series/template ────────────────────────────────────────────────
async function generateSeriesTemplate(req, res) {
    try {
        const workbook = new ExcelJS.Workbook();
        const mainSheet = workbook.addWorksheet('Series Template');

        const brandSlugs = await fetchBrandSlugs();
        const listsSheet = workbook.addWorksheet('Lists');
        listsSheet.state = 'veryHidden';
        brandSlugs.forEach((slug, i) => {
            listsSheet.getCell(`A${i + 1}`).value = slug;
        });

        let currentRow = 1;
        mainSheet.mergeCells(`A${currentRow}:D${currentRow}`);
        const titleCell = mainSheet.getCell(`A${currentRow}`);
        titleCell.value = 'MODEL SERIES UPLOAD TEMPLATE';
        titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56A0' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        mainSheet.getRow(currentRow).height = 30;
        currentRow++;

        const instructions = [
            'Instructions:',
            '- Fields marked with * are mandatory',
            '- Slug is auto-generated from Series Name on import (lowercase, hyphenated) — leave it blank or provide a custom one',
            '- Brand Slug: select an existing brand slug from the dropdown',
            '- Status: optional (1=active, 2=inactive, 3=deprecated). Defaults to 1',
        ];
        instructions.forEach((line) => {
            mainSheet.getRow(currentRow).values = [line];
            mainSheet.getRow(currentRow).font = { italic: true, color: { argb: 'FFCC0000' }, size: 10 };
            currentRow++;
        });
        currentRow++;

        const HEADER_ROW = currentRow;
        mainSheet.getRow(HEADER_ROW).values = [
            'Brand Slug *',
            'Series Name *',
            'Slug (auto if blank)',
            'Status (1/2/3)'
        ];
        mainSheet.getRow(HEADER_ROW).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        mainSheet.getRow(HEADER_ROW).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        mainSheet.getRow(HEADER_ROW).height = 20;

        [25, 30, 30, 18].forEach((w, i) => {
            mainSheet.getColumn(i + 1).width = w;
        });

        const FIRST_DATA_ROW = HEADER_ROW + 1;
        const brandListFormula = brandSlugs.length
            ? `=Lists!$A$1:$A$${brandSlugs.length}`
            : '""';

        for (let i = 0; i < 200; i++) {
            const row = FIRST_DATA_ROW + i;
            mainSheet.getCell(`A${row}`).dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: [brandListFormula],
                showErrorMessage: true,
                errorTitle: 'Invalid Brand',
                error: 'Select a valid brand slug from the dropdown',
            };
            mainSheet.getRow(row).height = 20;
        }

        mainSheet.getRow(FIRST_DATA_ROW).values = [brandSlugs[0] || '', 'Galaxy S', 'galaxy-s', 1];
        mainSheet.getRow(FIRST_DATA_ROW).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
        mainSheet.getRow(FIRST_DATA_ROW).font = { italic: true, color: { argb: 'FF555555' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Model_Series_Upload_Template.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ── POST /api/series/import ────────────────────────────────────────────────
async function processSeriesUploadedFile(req, res) {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    try {
        const DEBUG = String(process.env.DEBUG_SERIES_EXCEL_IMPORT || '').toLowerCase() === '1'
            || String(process.env.DEBUG_SERIES_EXCEL_IMPORT || '').toLowerCase() === 'true';

        if (DEBUG) {
            console.log('[series-import] file:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                hasBuffer: !!req.file.buffer,
                hasPath: !!req.file.path,
            });
        }

        const workbook = req.file.buffer
            ? xlsx.read(req.file.buffer, { type: 'buffer' })
            : (req.file.path ? xlsx.readFile(req.file.path) : null);
        if (!workbook) {
            return res.status(400).json({ success: false, message: 'Invalid upload: expected an Excel file buffer or path' });
        }
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        let headerRow = null;
        for (let r = 1; r <= 50; r++) {
            const aCell = sheet[`A${r}`];
            const value = cleanValue(aCell?.v);
            if (value === 'Brand Slug *') {
                headerRow = r;
                break;
            }
        }
        if (!headerRow) {
            return res.status(400).json({ success: false, message: 'Invalid template: could not find header row "Brand Slug *" in column A' });
        }
        if (DEBUG) console.log('[series-import] detected headerRow:', headerRow);
        const firstDataRow = headerRow + 1;

        const rows = xlsx.utils.sheet_to_json(sheet, {
            header: ['brand_slug', 'name', 'slug', 'status'],
            range: firstDataRow - 1,
        });

        const inserted = [], failedRows = [];
        const FIRST_DATA_EXCEL_ROW = firstDataRow;

        for (const [index, row] of rows.entries()) {
            const EXCEL_ROW_NUM = FIRST_DATA_EXCEL_ROW + index;
            if (!row.brand_slug && !row.name && !row.slug && !row.status) continue;

            try {
                const brandSlugRaw = cleanValue(row.brand_slug);
                const brandSlug = brandSlugRaw ? String(brandSlugRaw).toLowerCase() : null;
                if (!brandSlug) throw new Error('Brand Slug is required');

                const name = cleanValue(row.name);
                if (!name) throw new Error('Series Name is required');

                const slug = cleanValue(row.slug) || slugify(name);
                if (!/^[a-z0-9-]+$/.test(slug)) {
                    throw new Error(`Slug "${slug}" contains invalid characters (only lowercase letters, numbers, hyphens)`);
                }

                const statusRaw = cleanValue(row.status);
                const status = statusRaw ? Number(statusRaw) : 1;
                const statusFinal = Number.isFinite(status) && status > 0 ? status : 1;

                const client = await db.connect();
                try {
                    await client.query('BEGIN');

                    const brandResult = await client.query(
                        `SELECT id FROM brands WHERE slug = $1 LIMIT 1`,
                        [brandSlug]
                    );
                    if (!brandResult.rows.length) throw new Error(`Brand slug "${brandSlug}" not found`);
                    const brandId = brandResult.rows[0].id;

                    const seriesResult = await client.query(
                        `INSERT INTO model_series (brand_id, name, slug, status)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT (brand_id, name) DO UPDATE
                           SET slug = EXCLUDED.slug,
                               status = EXCLUDED.status
                         RETURNING id`,
                        [brandId, name, slug, statusFinal]
                    );

                    await client.query('COMMIT');
                    inserted.push({ brand_slug: brandSlug, name, slug, status: statusFinal, series_id: seriesResult.rows[0].id });
                } catch (e) {
                    try { await client.query('ROLLBACK'); } catch (_) { }
                    throw e;
                } finally {
                    client.release();
                }

            } catch (err) {
                if (DEBUG) {
                    console.log('[series-import] row failed:', {
                        rowNumber: EXCEL_ROW_NUM,
                        error: err?.message,
                        code: err?.code,
                        detail: err?.detail,
                    });
                }
                failedRows.push({
                    rowNumber: EXCEL_ROW_NUM,
                    data: row,
                    error: err?.message || 'Row failed',
                    code: err?.code,
                    detail: err?.detail,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `${inserted.length} series row(s) processed`,
            data: {
                inserted_count: inserted.length,
                failed_count: failedRows.length,
                inserted,
                failed: failedRows,
            },
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    generateTemplate,
    processUploadedFile,
    generateSeriesTemplate,
    processSeriesUploadedFile,
    generateModelsTemplate,
    processModelsUploadedFile,
};