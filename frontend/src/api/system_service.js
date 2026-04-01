import api from "./axios"

export const get_services = () => {
    return api.get('system/get_services')
}
export const get_services_all = () => {
    return api.get('system/get_services?all=true')
}
export const delete_service = (id) => {
    return api.delete('system/delete_service/' + id)
}
export const create_service = (formData) => {
    return api.post('system/create_service/', formData)
}
export const update_service = (id, formData) => {
    return api.put('system/update_service/' + id, formData)
}
export const toggle_service = (id, status) => {
    return api.patch('system/toggle_service/' + id, { status })
}
export const get_categories = (sub) => {
    return api.get(`system/get_categories/${sub}`);
}
export const create_category = (data) => {
    return api.post('system/create_category/', data)
}
export const toggle_category = (id, status) => {
    return api.patch('system/toggle_category/' + id, { status })
}
export const update_category = (id, data) => {
    return api.put('system/update_category/' + id, data)
}

export const get_brands = () => {
    return api.get('system/get_brands/')
}
export const get_cat_brands = (catId) => {
    return api.get('system/get_brands/' + catId + '?all=true')
}

// export const get_category_brands = (cat_slug) => {
//     return api.get('system/get_category_brands/' + cat_slug)
// }
export const create_brand = (data) => {
    return api.post('system/create_brand/', data)
}
export const update_brand = (id, data) => {
    return api.put('system/update_brand/' + id, data)
}
export const toggle_brand = (id, status) => {
    return api.patch('system/toggle_brand/' + id, { status })
}
export const delete_brand = (id) => {
    return api.delete('system/delete_brand/' + id)
}


export const create_product = () => {
    return api.get('system/create_product')
}
export const delete_product = (id) => {
    return api.delete('product/delete/' + id)
}
export const get_products = () => {
    return api.get('product/get_products')
}
export const update_product = (id, data) => {
    return api.put('product/update/' + id, data)
}
export const get_product_by_slug = (slug) => {
    return api.get('product/slug/' + slug)
}
export const get_product_by_sku = (sku) => {
    return api.get('product/sku/' + sku)
}
export const get_models = (cat_id, brand_id, series_id) => {
    return api.get('system/get_models/' + cat_id + '/' + brand_id + '/' + series_id)
}
export const create_model = (data) => {
    return api.post('system/models/', data)
}



export const get_users = () => {
    return api.get('users/get_users')
}
export const create_user = (data) => {
    return api.post('users/create', data)
}
export const delete_user = (id) => {
    return api.delete('users/delete_user/' + id)
}
export const add_merchant_role = (id) => {
    return api.post(`users/${id}/merchant`)
}
export const remove_merchant_role = (id) => {
    return api.delete(`users/${id}/merchant`)
}
export const update_user_status = (id, status) => {
    return api.put(`users/${id}/status`, { status })
}


export const get_roles = () => {
    return api.get('system/get_roles/')
}

export const get_brand_series = (id) => {
    return api.get('system/series/' + id)
}

export const create_series = (data) => {
    return api.post('system/series/', data)
}

export const save_product = (data) => {
    return api.post('product/create/', data)
}

// ── Sell Flow APIs ───────────────────────────────────────

export const get_model_configs = (model_id) => {
    return api.get('sell/configs/' + model_id)
}
export const create_model_config = (data) => {
    return api.post('sell/configs', data)
}
export const update_model_config = (id, data) => {
    return api.put('sell/configs/' + id, data)
}
export const delete_model_config = (id) => {
    return api.delete('sell/configs/' + id)
}

export const get_sell_questions = () => {
    return api.get('sell/questions')
}
export const get_sell_questions_by_category = (category_id) => {
    return api.get('sell/questions/category/' + category_id)
}
export const create_sell_question = (data) => {
    return api.post('sell/questions', data)
}
export const update_sell_question = (id, data) => {
    return api.put('sell/questions/' + id, data)
}
export const delete_sell_question = (id) => {
    return api.delete('sell/questions/' + id)
}

export const get_question_options = (question_id) => {
    return api.get('sell/options/' + question_id)
}
export const create_question_option = (data) => {
    return api.post('sell/options', data)
}
export const update_question_option = (id, data) => {
    return api.put('sell/options/' + id, data)
}
export const delete_question_option = (id) => {
    return api.delete('sell/options/' + id)
}

export const get_question_conditions = (question_id) => {
    return api.get('sell/conditions/' + question_id)
}
export const create_question_condition = (data) => {
    return api.post('sell/conditions', data)
}
export const delete_question_condition = (id) => {
    return api.delete('sell/conditions/' + id)
}

export const get_category_questions = (category_id) => {
    return api.get('sell/category-questions/' + category_id)
}
export const map_question_to_category = (data) => {
    return api.post('sell/category-questions', data)
}
export const unmap_question_from_category = (category_id, question_id) => {
    return api.delete('sell/category-questions/' + category_id + '/' + question_id)
}

// ── Sell Flow: Questions + Price ─────────────────────────────

export const get_sell_flow_questions = (category_slug) => {
    return api.get('sell/flow/' + category_slug)
}
export const calculate_sell_price = (data) => {
    return api.post('sell/calculate-price', data)
}

// ── Sell Listings (Leads) ────────────────────────────────────

export const get_sell_listings = (status) => {
    return api.get('sell/listings' + (status ? '?status=' + status : ''))
}
export const create_sell_listing = (data) => {
    return api.post('sell/listings', data)
}
export const assign_listing = (id, merchant_id) => {
    return api.put('sell/listings/' + id + '/assign', { merchant_id })
}
export const transfer_listing = (id) => {
    return api.put('sell/listings/' + id + '/transfer')
}
export const reject_listing = (id) => {
    return api.put('sell/listings/' + id + '/reject')
}

// ── Merchants ────────────────────────────────────────────────

export const get_merchants = () => {
    return api.get('sell/merchants')
}
