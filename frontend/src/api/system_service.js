import api from "./axios"

export const get_services = () => {
    return api.get('api/system/get_services')
}
export const get_services_all = () => {
    return api.get('api/system/get_services?all=true')
}
export const delete_service = (id) => {
    return api.delete('api/system/delete_service/' + id)
}
export const create_service = (formData) => {
    return api.post('api/system/create_service/', formData)
}
export const update_service = (id, formData) => {
    return api.put('api/system/update_service/' + id, formData)
}
export const toggle_service = (id, status) => {
    return api.patch('api/system/toggle_service/' + id, { status })
}
export const get_categories = (sub) => {
    return api.get(`api/system/get_categories/${sub}`);
}
export const create_category = (data) => {
    return api.post('api/system/create_category/', data)
}
export const toggle_category = (id, status) => {
    return api.patch('api/system/toggle_category/' + id, { status })
}
export const update_category = (id, data) => {
    return api.put('api/system/update_category/' + id, data)
}

export const delete_category = (id) => {
    return api.delete('api/system/delete_category/' + id)
}

export const get_brands = () => {
    return api.get('api/system/get_brands/')
}
export const get_brands_all = () => {
    return api.get('api/system/get_brands?all=true')
}
export const get_cat_brands = (catId) => {
    return api.get('api/system/get_brands/' + catId + '?all=true')
}

// ── Category ↔ Brand Mapping ─────────────────────────────
export const get_category_brand_mappings = (categoryId) => {
    return api.get('api/system/categories/' + categoryId + '/brands')
}

export const update_category_brand_mappings = (categoryId, brand_ids) => {
    return api.put('api/system/categories/' + categoryId + '/brands', { brand_ids })
}

// export const get_category_brands = (cat_slug) => {
//     return api.get('api/system/get_category_brands/' + cat_slug)
// }
export const create_brand = (data) => {
    return api.post('api/system/create_brand/', data)
}
export const update_brand = (id, data) => {
    return api.put('api/system/update_brand/' + id, data)
}
export const toggle_brand = (id, status) => {
    return api.patch('api/system/toggle_brand/' + id, { status })
}
export const delete_brand = (id) => {
    return api.delete('api/system/delete_brand/' + id)
}

// ── Brands Excel ───────────────────────────────────────
export const download_brands_template = () => {
    return api.get('api/system/brands/template', { responseType: 'blob' })
}

export const import_brands_excel = (formData) => {
    return api.post('api/system/brands/import', formData)
}

// ── Series Excel ───────────────────────────────────────
export const download_series_template = () => {
    return api.get('api/system/series/template', { responseType: 'blob' })
}

export const import_series_excel = (formData) => {
    return api.post('api/system/series/import', formData)
}

// ── Models Excel ───────────────────────────────────────
export const download_models_template = (params) => {
    return api.get('api/system/models/template', { responseType: 'blob', params })
}

export const import_models_excel = (formData) => {
    return api.post('api/system/models/import', formData)
}


export const create_product = () => {
    return api.get('api/system/create_product')
}
export const delete_product = (id) => {
    return api.delete('api/product/delete/' + id)
}
export const get_products = () => {
    return api.get('api/product/get_products')
}
export const update_product = (id, data) => {
    return api.put('api/product/update/' + id, data)
}
export const get_product_by_slug = (slug) => {
    return api.get('api/product/slug/' + slug)
}
export const get_product_by_sku = (sku) => {
    return api.get('api/product/sku/' + sku)
}
export const get_models = (cat_id, brand_id, series_id) => {
    return api.get('api/system/get_models/' + cat_id + '/' + brand_id + '/' + series_id)
}
export const create_model = (data) => {
    return api.post('api/system/models/', data)
}

export const update_model = (id, data) => {
    return api.put('api/system/models/' + id, data)
}

export const delete_model = (id) => {
    return api.delete('api/system/models/' + id)
}



export const get_users = () => {
    return api.get('api/users/get_users')
}
export const create_user = (data) => {
    return api.post('api/users/create', data)
}
export const delete_user = (id) => {
    return api.delete('api/users/delete_user/' + id)
}
export const add_merchant_role = (id) => {
    return api.post(`api/users/${id}/merchant`)
}
export const remove_merchant_role = (id) => {
    return api.delete(`api/users/${id}/merchant`)
}


export const get_roles = () => {
    return api.get('api/system/get_roles/')
}

export const get_brand_series = (id) => {
    return api.get('api/system/series/' + id)
}

export const create_series = (data) => {
    return api.post('api/system/series/', data)
}

export const update_series = (id, data) => {
    return api.put('api/system/series/' + id, data)
}

export const delete_series = (id) => {
    return api.delete('api/system/series/' + id)
}

export const save_product = (data) => {
    return api.post('api/product/create/', data)
}

// ── Sell Flow APIs ───────────────────────────────────────

export const get_model_configs = (model_id) => {
    return api.get('api/sell/configs/' + model_id)
}
export const create_model_config = (data) => {
    return api.post('api/sell/configs', data)
}
export const update_model_config = (id, data) => {
    return api.put('api/sell/configs/' + id, data)
}
export const delete_model_config = (id) => {
    return api.delete('api/sell/configs/' + id)
}

export const get_sell_questions = () => {
    return api.get('api/sell/questions')
}
export const get_sell_questions_by_category = (category_id) => {
    return api.get('api/sell/questions/category/' + category_id)
}
export const create_sell_question = (data) => {
    return api.post('api/sell/questions', data)
}
export const update_sell_question = (id, data) => {
    return api.put('api/sell/questions/' + id, data)
}
export const delete_sell_question = (id) => {
    return api.delete('api/sell/questions/' + id)
}

export const get_question_options = (question_id) => {
    return api.get('api/sell/options/' + question_id)
}
export const create_question_option = (data) => {
    return api.post('api/sell/options', data)
}
export const update_question_option = (id, data) => {
    return api.put('api/sell/options/' + id, data)
}
export const delete_question_option = (id) => {
    return api.delete('api/sell/options/' + id)
}

export const get_question_conditions = (question_id) => {
    return api.get('api/sell/conditions/' + question_id)
}
export const create_question_condition = (data) => {
    return api.post('api/sell/conditions', data)
}
export const delete_question_condition = (id) => {
    return api.delete('api/sell/conditions/' + id)
}

export const get_category_questions = (category_id) => {
    return api.get('api/sell/category-questions/' + category_id)
}
export const map_question_to_category = (data) => {
    return api.post('api/sell/category-questions', data)
}
export const unmap_question_from_category = (category_id, question_id) => {
    return api.delete('api/sell/category-questions/' + category_id + '/' + question_id)
}

// ── Sell Flow: Questions + Price ─────────────────────────────

export const get_sell_flow_questions = (category_slug) => {
    return api.get('api/sell/flow/' + category_slug)
}
export const calculate_sell_price = (data) => {
    return api.post('api/sell/calculate-price', data)
}

// ── Sell Listings (Leads) ────────────────────────────────────

export const get_sell_listings = (status) => {
    return api.get('api/sell/listings' + (status ? '?status=' + status : ''))
}
export const create_sell_listing = (data) => {
    return api.post('api/sell/listings', data)
}
export const assign_listing = (id, merchant_id) => {
    return api.put('api/sell/listings/' + id + '/assign', { merchant_id })
}
export const transfer_listing = (id) => {
    return api.put('api/sell/listings/' + id + '/transfer')
}
export const reject_listing = (id) => {
    return api.put('api/sell/listings/' + id + '/reject')
}

// ── Merchants ────────────────────────────────────────────────

export const get_merchants = () => {
    return api.get('api/sell/merchants')
}
