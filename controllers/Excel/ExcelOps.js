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

                const altText = cleanValue(row.alt_text);

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

module.exports = { generateTemplate, processUploadedFile };