const pool = require("../config/database");
const slugify = require('slugify')
const deleteFile = require("../config/delete.config");
exports.getServices = async () => {
    const data = await pool.query(`SELECT s.id, s.name, img.url from services s
        JOIN service_images si ON s.id=si.service_id
        JOIN images img ON si.image_id=img.id
        where is_active=True`);
    return data.rows;
}
exports.createService = async (data) => {
    const { name, image } = data
    // console.log('lala')
    // return data;
    if (!name || !image) throw { status: 400, message: "Service Name & Image is required" }
    const slug = slugify(name, { lower: true, strict: true });
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const val = await client.query("SELECT 1 ans FROM services WHERE slug=$1", [slug]);
        if (val.rowCount >= 1) throw { status: 409, message: "Service already Exists" }
        console.log(data, "service data");

        const img = await pool.query(`INSERT INTO images(
            url, alt_text, uploaded_by
            ) VALUES ($1, $2, $3) RETURNING id`, [image, name + " Image", null]);
        const servc = await pool.query("INSERT INTO services(name, slug) VALUES ($1, $2) RETURNING id, name, slug", [name, slug]);
        await pool.query(`INSERT INTO service_images(
            service_id, image_id
            ) VALUES ($1, $2)`, [servc.rows[0].id, img.rows[0].id]);

        await client.query("COMMIT");
        return servc.rows;
    } catch (error) {
        await deleteFile(image);
        await client.query("ROLLBACK");

        throw {
            status: error.status || 500,
            message: error.message || "Failed to create Service"
        };
    } finally {
        client.release();
    }
}
exports.deleteService = async (id) => {
    const data = await pool.query(`UPDATE services SET is_active=False WHERE id=$1 RETURNING id, name`, [id]);
    return data.rows;
}

exports.updateService = async (id, data) => {
    const { name, image } = data;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const service = await client.query("SELECT * FROM services WHERE id=$1", [id]);
        if (service.rowCount === 0) throw { status: 404, message: "Service not found" };

        let slug;
        if (name) {
            slug = slugify(name, { lower: true, strict: true });
            const val = await client.query("SELECT 1 ans FROM services WHERE slug=$1 AND id!=$2", [slug, id]);
            if (val.rowCount >= 1) throw { status: 409, message: "Service with this name already Exists" }
            await client.query("UPDATE services SET name=$1, slug=$2 WHERE id=$3", [name, slug, id]);
        }

        if (image) {
            const imgResult = await client.query(`SELECT image_id FROM service_images WHERE service_id=$1`, [id]);
            const oldImageId = imgResult.rows[0].image_id;
            const oldImageResult = await client.query(`SELECT url FROM images WHERE id=$1`, [oldImageId]);
            const oldImageUrl = oldImageResult.rows[0].url;

            const img = await client.query(`INSERT INTO images(url, alt_text, uploaded_by) VALUES ($1, $2, $3) RETURNING id`, [image, name + " Image", null]);
            await client.query(`UPDATE service_images SET image_id=$1 WHERE service_id=$2`, [img.rows[0].id, id]);
            await deleteFile(oldImageUrl);
            await client.query(`DELETE FROM images WHERE id=$1`, [oldImageId]);
        }

        await client.query("COMMIT");
        const updatedService = await pool.query(`SELECT s.id, s.name, img.url from services s
            JOIN service_images si ON s.id=si.service_id
            JOIN images img ON si.image_id=img.id
            where s.id=$1`, [id]);
        return updatedService.rows[0];
    } catch (error) {
        if (image) await deleteFile(image);
        await client.query("ROLLBACK");
        throw {
            status: error.status || 500,
            message: error.message || "Failed to update Service"
        };
    } finally {
        client.release();
    }
}

exports.getCategories = async ({ sub }) => {
    let whquery = "WHERE c1.is_active=True"
    if (sub.toString().toLowerCase() == 'true') {
        whquery += " AND c1.parent_id IS NOT NULL"
    }
    const data = await pool.query(`SELECT c1.id, c1.name, c1.slug, c2.name Parent, '/system/get_brands/'|| c1.slug route, img.url 
        FROM categories c1 LEFT JOIN categories c2 ON c1.parent_id=c2.id
        JOIN category_images ci ON c1.id=ci.category_id
        JOIN images img ON ci.image_id=img.id
         ${whquery}`);
    return data.rows;
}
exports.createCategory = async (data) => {
    const { name, parent_id, image } = data;

    if (!name || !image) throw { status: 400, message: "Name & Image are required" };

    let pid = parent_id || null;

    const slug = slugify(name, { lower: true, strict: true });

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        if (pid) {
            const parentCheck = await client.query(
                "SELECT 1 FROM categories WHERE id=$1",
                [pid]
            );
            if (parentCheck.rowCount === 0)
                throw { status: 404, message: "No such Parent Category" };
        }

        const exists = await client.query(
            "SELECT 1 FROM categories WHERE slug=$1",
            [slug]
        );
        console.log('deva', exists)
        if (exists.rowCount >= 1)
            throw { status: 409, message: "Category already Exists" };

        const img = await client.query(
            `INSERT INTO images(url, alt_text, uploaded_by)
             VALUES ($1,$2,$3) RETURNING id`,
            [image, name + " Image", null]
        );

        const category = await client.query(
            `INSERT INTO categories(name, slug, parent_id)
             VALUES ($1,$2,$3)
             RETURNING id, name, slug`,
            [name, slug, pid]
        );

        await client.query(
            `INSERT INTO category_images(category_id, image_id)
             VALUES ($1,$2)`,
            [category.rows[0].id, img.rows[0].id]
        );

        await client.query("COMMIT");
        return category.rows;
    } catch (error) {
        await deleteFile(image);
        await client.query("ROLLBACK");

        throw {
            status: error.status || 500,
            message: error.message || "Failed to create Category"
        };
    } finally {
        client.release();
    }
};
exports.deleteCategory = async (id) => {
    const data = await pool.query(`UPDATE categories SET is_active=False WHERE id=$1 RETURNING id, name`, [id]);
    return data.rows;
}

exports.updateCategory = async (id, data) => {
    const { name, parent_id, image } = data;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const category = await client.query("SELECT * FROM categories WHERE id=$1", [id]);
        if (category.rowCount === 0) throw { status: 404, message: "Category not found" };

        if (name) {
            const slug = slugify(name, { lower: true, strict: true });
            const val = await client.query("SELECT 1 ans FROM categories WHERE slug=$1 AND id!=$2", [slug, id]);
            if (val.rowCount >= 1) throw { status: 409, message: "Category with this name already Exists" }
            await client.query("UPDATE categories SET name=$1, slug=$2 WHERE id=$3", [name, slug, id]);
        }

        if (parent_id) {
            const parentCheck = await client.query("SELECT 1 FROM categories WHERE id=$1", [parent_id]);
            if (parentCheck.rowCount === 0) throw { status: 404, message: "No such Parent Category" };
            await client.query("UPDATE categories SET parent_id=$1 WHERE id=$2", [parent_id, id]);
        }

        if (image) {
            const imgResult = await client.query(`SELECT image_id FROM category_images WHERE category_id=$1`, [id]);
            const oldImageId = imgResult.rows[0].image_id;
            const oldImageResult = await client.query(`SELECT url FROM images WHERE id=$1`, [oldImageId]);
            const oldImageUrl = oldImageResult.rows[0].url;

            const img = await client.query(`INSERT INTO images(url, alt_text, uploaded_by) VALUES ($1, $2, $3) RETURNING id`, [image, name + " Image", null]);
            await client.query(`UPDATE category_images SET image_id=$1 WHERE category_id=$2`, [img.rows[0].id, id]);
            await deleteFile(oldImageUrl);
            await client.query(`DELETE FROM images WHERE id=$1`, [oldImageId]);
        }

        await client.query("COMMIT");
        const updatedCategory = await pool.query(`SELECT c1.id, c1.name, c1.slug, c2.name Parent, '/system/get_brands/'|| c1.slug route, img.url 
            FROM categories c1 LEFT JOIN categories c2 ON c1.parent_id=c2.id
            JOIN category_images ci ON c1.id=ci.category_id
            JOIN images img ON ci.image_id=img.id
            WHERE c1.id=$1`, [id]);
        return updatedCategory.rows[0];
    } catch (error) {
        if (image) await deleteFile(image);
        await client.query("ROLLBACK");
        throw {
            status: error.status || 500,
            message: error.message || "Failed to update Category"
        };
    } finally {
        client.release();
    }
}

exports.getBrands = async ({ cat_slug }) => {
    // console.log(cat_slug, "category slug") // IGNORE
    let whquery = " WHERE b.status=1";
    if (cat_slug) {
        const cat_data = await pool.query(`select c.id,c.slug from categories c where c.slug=$1`, [cat_slug]);
        if (cat_data.rowCount === 0) throw { status: 404, message: "Category not found" };
        whquery += " AND bc.category_id=" + cat_data.rows[0].id;
        // console.log(whquery,cat_data.rows, "whquery") // IGNORE
    }
    const data = await pool.query(`select b.id, b.name, b.slug, img.url, count(DISTINCT ms.id) series_count
        from brands b
        join brand_categories bc on b.id = bc.brand_id
        join brand_images bi on b.id=bi.brand_id
        join images img on bi.image_id=img.id
        left join model_series ms on b.id=ms.brand_id and ms.status=1
        ${whquery}
        group by b.id, img.url
        `);
    // data.rows.map(b => b.route = `/product/brand/${b.slug}/products`)
    return data.rows;
}
// exports.getCategoryBrands = async (params) => {
//     const { id } = params;
//     if (!id) throw { status: 400, message: "Category Id is required" };
//     const data = await pool.query(`
// select * from brands b
// join brand_categories bc
// on b.id=bc.brand_id
// where bc.category_id=$1`,
//         [id]);
//     return data.rows;
// }
exports.createBrand = async (data) => {
    const { name, category_id, image } = data;

    if (!name || !category_id || !image)
        throw { status: 400, message: "Name, Category & Image are required" };

    const slug = slugify(name, { lower: true, strict: true });
    const client = await pool.connect();

    let imageInserted = false;

    try {
        await client.query("BEGIN");

        const categoryCheck = await client.query(
            "SELECT 1 FROM categories WHERE id=$1",
            [category_id]
        );
        if (categoryCheck.rowCount === 0)
            throw { status: 404, message: "Invalid Category" };

        const exists = await client.query(
            "SELECT 1 FROM brands WHERE slug=$1",
            [slug]
        );
        if (exists.rowCount >= 1)
            throw { status: 409, message: "Brand already Exists" };

        const img = await client.query(
            `INSERT INTO images(url, alt_text, uploaded_by)
             VALUES ($1,$2,$3) RETURNING id`,
            [image, "Brand Image", null]
        );

        imageInserted = true;

        const brand = await client.query(
            `INSERT INTO brands(name, slug)
             VALUES ($1,$2)
             RETURNING id, name, slug`,
            [name, slug]
        );

        await client.query(
            `INSERT INTO brand_categories(brand_id, category_id)
             VALUES ($1,$2)`,
            [brand.rows[0].id, category_id]
        );

        await client.query(
            `INSERT INTO brand_images(brand_id, image_id)
             VALUES ($1,$2)`,
            [brand.rows[0].id, img.rows[0].id]
        );

        await client.query("COMMIT");
        return brand.rows;

    } catch (error) {
        await client.query("ROLLBACK");

        if (imageInserted) await deleteFile(image);

        throw {
            status: error.status || 500,
            message: error.message || "Failed to create Brand"
        };
    } finally {
        client.release();
    }
};
exports.deleteBrand = async (id) => {
    const data = await pool.query(`UPDATE brands SET status=2 WHERE id=$1 RETURNING id, name`, [id]);
    return data.rows;
}

exports.updateBrand = async (id, data) => {
    const { name, category_id, image } = data;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const brand = await client.query("SELECT * FROM brands WHERE id=$1", [id]);
        if (brand.rowCount === 0) throw { status: 404, message: "Brand not found" };

        if (name) {
            const slug = slugify(name, { lower: true, strict: true });
            const val = await client.query("SELECT 1 ans FROM brands WHERE slug=$1 AND id!=$2", [slug, id]);
            if (val.rowCount >= 1) throw { status: 409, message: "Brand with this name already Exists" }
            await client.query("UPDATE brands SET name=$1, slug=$2 WHERE id=$3", [name, slug, id]);
        }

        if (category_id) {
            const categoryCheck = await client.query("SELECT 1 FROM categories WHERE id=$1", [category_id]);
            if (categoryCheck.rowCount === 0) throw { status: 404, message: "Invalid Category" };
            await client.query("UPDATE brand_categories SET category_id=$1 WHERE brand_id=$2", [category_id, id]);
        }

        if (image) {
            const imgResult = await client.query(`SELECT image_id FROM brand_images WHERE brand_id=$1`, [id]);
            const oldImageId = imgResult.rows[0].image_id;
            const oldImageResult = await client.query(`SELECT url FROM images WHERE id=$1`, [oldImageId]);
            const oldImageUrl = oldImageResult.rows[0].url;

            const img = await client.query(`INSERT INTO images(url, alt_text, uploaded_by) VALUES ($1, $2, $3) RETURNING id`, [image, "Brand Image", null]);
            await client.query(`UPDATE brand_images SET image_id=$1 WHERE brand_id=$2`, [img.rows[0].id, id]);
            await deleteFile(oldImageUrl);
            await client.query(`DELETE FROM images WHERE id=$1`, [oldImageId]);
        }

        await client.query("COMMIT");
        const updatedBrand = await pool.query(`select b.id, b.name, b.slug, img.url, count(DISTINCT ms.id) series_count
            from brands b
            join brand_categories bc on b.id = bc.brand_id
            join brand_images bi on b.id=bi.brand_id
            join images img on bi.image_id=img.id
            left join model_series ms on b.id=ms.brand_id and ms.status=1
            WHERE b.id=$1
            group by b.id, img.url`, [id]);
        return updatedBrand.rows[0];
    } catch (error) {
        if (image) await deleteFile(image);
        await client.query("ROLLBACK");
        throw {
            status: error.status || 500,
            message: error.message || "Failed to update Brand"
        };
    } finally {
        client.release();
    }
}

exports.getRoles = async () => {
    const data = await pool.query(`SELECT id, name FROM roles WHERE is_system=True`);
    return data.rows;
}

exports.getModelSeries = async ({ brand_slug }) => {
    // const { id } = params
    if (!brand_slug) throw { status: 404, message: "Brand Slug is required" }
    const data = await pool.query(`select ms.id, ms.name, ms.slug, count(m.id) model_count
        from model_series ms
        join brands b on ms.brand_id=b.id
        left join models m on ms.id=m.series_id and m.status=1
        where ms.status=$1 AND b.status=$2 AND b.slug=$3
        group by ms.id`, [1, 1, brand_slug]);
    return data.rows;
}

exports.createSeries = async ({ name, brand_slug }) => {
    // const  = data
    const client = await pool.connect();

    if (!name || !brand_slug) throw { status: 400, message: "Series Name and Brand are required" }
    const slug = slugify(name, { lower: true, strict: true });
    try {
        await client.query("BEGIN");
        const val0 = await client.query("SELECT id FROM brands WHERE slug=$1", [brand_slug]);
        if (val0.rowCount === 0) throw { status: 404, message: "Invalid Brand" }
        const brand_id = val0.rows[0].id;
        const val = await client.query("SELECT 1 ans FROM model_series WHERE slug=$1 AND brand_id=$2", [slug, brand_id]);
        if (val.rowCount >= 1) throw { status: 409, message: "Series already Exists" }

        const result = await client.query("INSERT INTO model_series(brand_id, name, slug) VALUES ($1, $2, $3) RETURNING id, name, slug", [brand_id, name, slug]);

        await client.query("COMMIT");
        return result.rows;
    } catch (error) {
        await client.query("ROLLBACK");
        throw { status: error.status || 500, message: error.message || "Failed to create Brand" };
    }
    finally {
        client.release();
    }
}
exports.getModels = async ({ cat_slug, brand_slug, series_slug }) => {
    // const { cat_slug, brand_slug, series_slug } = params
    if (!cat_slug || !brand_slug || !series_slug) throw { status: 404, message: "Series, Category & Brand are required" };

    const data = await pool.query(`
        SELECT m.name, m.slug, img.url FROM models m
        JOIN categories c ON m.category_id=c.id
        JOIN brands b ON m.brand_id=b.id
        JOIN model_series ms ON m.series_id=ms.id
        JOIN model_images mi ON m.id=mi.model_id
        JOIN images img ON mi.image_id=img.id
        WHERE c.slug=$1 AND b.slug=$2 AND ms.slug=$3`, [cat_slug, brand_slug, series_slug]);
    return data.rows;
}

exports.createModel = async ({ name, cat_slug, brand_slug, series_slug, image }) => {
    // const { name, cat_id, brand_id, series_id } = data
    const client = await pool.connect();
    let imageInserted = false;
    // console.log(name, cat_slug, brand_slug, series_slug, "model data") // IGNORE

    if (!name || !brand_slug || !cat_slug || !series_slug || !image) throw { status: 400, message: "Unsufficient Parameters" }
    const slug = slugify(name, { lower: true, strict: true });
    try {
        await client.query("BEGIN");
        const val0 = await client.query("SELECT id FROM brands WHERE slug=$1", [brand_slug]);
        if (val0.rowCount === 0) throw { status: 404, message: "Invalid Brand" };
        const val1 = await client.query("SELECT id FROM categories WHERE slug=$1", [cat_slug]);
        if (val1.rowCount === 0) throw { status: 404, message: "Invalid Category Slug" };
        const val2 = await client.query("SELECT id FROM model_series WHERE slug=$1", [series_slug]);
        if (val2.rowCount === 0) throw { status: 404, message: "Invalid Series Slug" };

        const brand_id = val0.rows[0].id;
        const series_id = val2.rows[0].id;
        const cat_id = val1.rows[0].id;

        const valF = await client.query("SELECT 1 ans FROM models WHERE slug=$1 AND brand_id=$2 AND category_id=$3 AND series_id=$4", [slug, brand_id, cat_id, series_id]);
        if (valF.rowCount >= 1) throw { status: 409, message: "Model Already Exists" };

        const result = await client.query("INSERT INTO models(brand_id, series_id, category_id, name, slug) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, slug", [brand_id, series_id, cat_id, name, slug]);

        const model_id = result.rows[0].id;
        const img = await client.query(
            `INSERT INTO images(url, alt_text, uploaded_by)
             VALUES ($1,$2,$3) RETURNING id`,
            [image, "Model Image", null]
        );
        imageInserted = true;
        await client.query(
            `INSERT INTO model_images(model_id, image_id)
             VALUES ($1,$2)`,
            [model_id, img.rows[0].id]
        );

        await client.query("COMMIT");
        return result.rows;
    } catch (error) {
        await client.query("ROLLBACK");
        if (imageInserted) await deleteFile(image);
        throw { status: error.status || 500, message: error.message || "Failed to create Model" };
    }
    finally {
        client.release();
    }
}