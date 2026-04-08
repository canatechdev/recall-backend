import React, { useState, useEffect } from "react";
import { CIcon } from "@coreui/icons-react";
import {
    cilPlus,
    cilX,
    cilCheck,
    cilPencil,
    cilChevronRight,
    cilReload,
    cilTag,
    cilLibrary,
    cilLayers,
    cilDevices,
    cilSettings,
    cilList,
} from "@coreui/icons";
import { get_categories, get_cat_brands, get_brand_series, create_series, update_series, get_models, create_model, update_model, get_model_configs, create_model_config, update_model_config, delete_model_config } from "../../../api/system_service";

// const BASE = "http://localhost:5500";

const STATUS_OPTIONS = ["active", "inactive", "deprecated"];
const statusBadge = (s) => {
    const map = { active: "bg-success", inactive: "bg-secondary", deprecated: "bg-warning text-dark" };
    return <span className={`badge ${map[s] || "bg-secondary"}`}>{s}</span>;
};

function toSlug(str) {
    return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ── Reusable inline form row ──────────────────────────────────────────────────
function InlineForm({ fields, onSave, onCancel, loading }) {
    const [vals, setVals] = useState(() => Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""])));
    const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

    const handleNameChange = (k, v) => {
        set(k, v);
        const slugField = fields.find((f) => f.key === "slug");
        if (slugField && !vals._slugTouched) set("slug", toSlug(v));
    };

    return (
        <div className="border rounded p-3 mb-2 bg-body shadow-sm">
            <div className="row g-2">
                {fields.map((f) => (
                    <div key={f.key} className={f.col || "col-md-6"}>
                        <label className="form-label small fw-semibold mb-1">{f.label}</label>
                        {f.type === "select" ? (
                            <select
                                className="form-select form-select-sm"
                                value={vals[f.key]}
                                onChange={(e) => set(f.key, e.target.value)}
                            >
                                {f.options.map((o) => (
                                    <option key={o.value ?? o} value={o.value ?? o}>
                                        {o.label ?? o}
                                    </option>
                                ))}
                            </select>
                        ) : f.type === "file" ? (
                            <input
                                type="file"
                                className="form-control form-control-sm"
                                accept="image/*"
                                onChange={(e) => set(f.key, e.target.files[0] ?? null)}
                            />
                        ) : (
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder={f.placeholder || ""}
                                value={vals[f.key]}
                                onChange={(e) =>
                                    f.key === "name"
                                        ? handleNameChange(f.key, e.target.value)
                                        : f.key === "slug"
                                            ? (set("_slugTouched", true), set("slug", e.target.value))
                                            : set(f.key, e.target.value)
                                }
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="d-flex gap-2 mt-2 justify-content-end">
                <button className="btn btn-sm btn-outline-secondary" onClick={onCancel} disabled={loading}>
                    <CIcon icon={cilX} className="me-1" /> Cancel
                </button>
                <button className="btn btn-sm btn-success" onClick={() => onSave(vals)} disabled={loading}>
                    <CIcon icon={cilCheck} className="me-1" /> {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ items }) {
    return (
        <nav className="mb-3">
            <ol className="breadcrumb mb-0 small">
                {items.map((item, i) => (
                    <li key={i} className={`breadcrumb-item ${i === items.length - 1 ? "active fw-semibold" : ""}`}>
                        {item.onClick && i < items.length - 1 ? (
                            <button className="btn btn-link p-0 small" onClick={item.onClick}>
                                {item.label}
                            </button>
                        ) : (
                            item.label
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BrandModelManager() {
    const [toast, setToast] = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => setToast(null), 3500);
    };

    // Data
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [series, setSeries] = useState([]);
    const [models, setModels] = useState([]);

    // Selection state
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedSeries, setSelectedSeries] = useState(null);

    // Loading states
    const [loadingCats, setLoadingCats] = useState(false);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingSeries, setLoadingSeries] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [saving, setSaving] = useState(false);

    // Add form visibility
    const [showAddSeries, setShowAddSeries] = useState(false);
    const [showAddModel, setShowAddModel] = useState(false);

    // Edit state
    const [editingSeries, setEditingSeries] = useState(null); // {id, name, slug}



    const fetchCategories = async () => {
        try {
            setLoadingCats(true);
            const res = await get_categories(true);
            if (res.status == 200) setCategories(res.data);
        } catch {
            showToast("danger", "Failed to load categories.");
        } finally {
            setLoadingCats(false);
        }
    };

    const fetchBrands = async (categorySlug) => {
        try {
            setLoadingBrands(true);
            const res = await get_cat_brands(categorySlug);
            console.log(res.data)
            if (res.status == 200) setBrands(res.data);
        } catch {
            showToast("danger", "Failed to load brands.");
        } finally {
            setLoadingBrands(false);
        }
    };

    const fetchSeries = async (brandSlug) => {
        try {
            setLoadingSeries(true);
            const res = await get_brand_series(brandSlug);
            // const data = await res.json();
            if (res.status == 200) setSeries(res.data);
        } catch {
            showToast("danger", "Failed to load series.");
        } finally {
            setLoadingSeries(false);
        }
    };

    const fetchModels = async (seriesSlug) => {
        try {
            setLoadingModels(true);
            // console.warn(selectedCategory.id, selectedBrand.id, seriesId)
            const res = await get_models(selectedCategory.slug, selectedBrand.slug, seriesSlug);

            // const data = await res.json();
            setModels(res.data);
        } catch {
            showToast("danger", "Failed to load models.");
        } finally {
            setLoadingModels(false);
        }
    };

    // ── Selections ───────────────────────────────────────────
    const selectCategory = (cat) => {
        setSelectedCategory(cat);
        setSelectedBrand(null);
        setSelectedSeries(null);
        setSeries([]); setModels([]);
        setShowAddSeries(false); setShowAddModel(false);
        setEditingSeries(null);
        fetchBrands(cat.slug);
    };

    const selectBrand = (brand) => {
        setSelectedBrand(brand);
        setSelectedSeries(null);
        setModels([]);
        setShowAddSeries(false); setShowAddModel(false);
        setEditingSeries(null);
        fetchSeries(brand.slug);
    };

    const selectSeries = (s) => {
        setSelectedSeries(s);
        setShowAddModel(false);
        setEditingSeries(null);
        fetchModels(s.slug);
    };

    // ── Save handlers ────────────────────────────────────────
    const saveSeries = async (vals) => {
        try {
            // alert(JSON.stringify(vals))
            setSaving(true);
            const res = await create_series({
                brand_slug: selectedBrand.slug,
                name: vals.name,
            });
            if (res.status !== 200) throw new Error((await res.json()).message || "Failed");
            showToast("success", `Series "${vals.name}" created!`);
            setShowAddSeries(false);
            setEditingSeries(null);
            fetchSeries(selectedBrand.slug);
        } catch (e) {
            showToast("danger", e.message);
        } finally {
            setSaving(false);
        }
    };

    const saveSeriesUpdate = async (vals) => {
        try {
            if (!editingSeries?.id) return;
            setSaving(true);
            const res = await update_series(editingSeries.id, { name: vals.name });
            showToast("success", `Series updated to "${res?.data?.name || vals.name}"`);
            setEditingSeries(null);
            fetchSeries(selectedBrand.slug);
        } catch (e) {
            showToast("danger", e?.response?.data?.message || e.message || "Failed to update series");
        } finally {
            setSaving(false);
        }
    };

    const saveModel = async (vals) => {
        try {
            setSaving(true);
            const formData = new FormData();
            formData.append("brand_slug", selectedBrand.slug);
            formData.append("series_slug", selectedSeries.slug);
            formData.append("cat_slug", selectedCategory.slug);
            formData.append("name", vals.name);
            if (vals.image) formData.append("image", vals.image);
            const res = await create_model(formData);
            if (res.status !== 200) throw new Error((await res.json()).message || "Failed");
            showToast("success", `Model "${vals.name}" created!`);
            setShowAddModel(false);
            fetchModels(selectedSeries.slug);
        } catch (e) {
            showToast("danger", e.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Init ─────────────────────────────────────────────────
    useEffect(() => { fetchCategories(); }, []);

    // ── Determine active panel ───────────────────────────────
    // 0=categories, 1=brands, 2=series, 3=models
    const activePanel = selectedSeries ? 3 : selectedBrand ? 2 : selectedCategory ? 1 : 0;

    const breadcrumbItems = [
        { label: "Categories", onClick: activePanel > 0 ? () => { setSelectedCategory(null); setSelectedBrand(null); setSelectedSeries(null); setSeries([]); setModels([]); setBrands([]); } : null },
        ...(selectedCategory ? [{ label: selectedCategory.name, onClick: activePanel > 1 ? () => { setSelectedBrand(null); setSelectedSeries(null); setModels([]); setSeries([]); } : null }] : []),
        ...(selectedBrand ? [{ label: selectedBrand.name, onClick: activePanel > 2 ? () => { setSelectedSeries(null); setModels([]); } : null }] : []),
        ...(selectedSeries ? [{ label: selectedSeries.name }] : []),
    ];

    const panelTitle = [
        { icon: cilTag, label: "Select Category", sub: "Start by picking a category" },
        { icon: cilLibrary, label: `Brands in "${selectedCategory?.name}"`, sub: "Select a brand to manage its series" },
        { icon: cilLayers, label: `Series — ${selectedBrand?.name}`, sub: "Select a series to manage its models" },
        { icon: cilDevices, label: `Models — ${selectedSeries?.name}`, sub: `${selectedBrand?.name} › ${selectedSeries?.name}` },
    ][activePanel];

    return (
        <div className="container py-4">
            {/* Toast */}
            {toast && (
                <div
                    className={`alert alert-${toast.type} alert-dismissible d-flex align-items-center gap-2 position-fixed top-0 end-0 m-3 shadow`}
                    style={{ zIndex: 9999, minWidth: 300 }}
                >
                    <CIcon icon={toast.type === "success" ? cilCheck : cilX} />
                    <span>{toast.msg}</span>
                    <button className="btn-close" onClick={() => setToast(null)} />
                </div>
            )}

            <div className="card shadow-sm border-0">
                {/* Header */}
                <div className="card-header bg-body d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="fw-bold text-uppercase mb-0">
                            <CIcon icon={panelTitle.icon} className="me-2 text-primary" />
                            {panelTitle.label}
                        </h4>
                        <small className="text-muted">{panelTitle.sub}</small>
                    </div>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={fetchCategories}
                        disabled={loadingCats}
                        title="Refresh categories"
                    >
                        <CIcon icon={cilReload} />
                    </button>
                </div>

                <div className="card-body">
                    {/* Breadcrumb */}
                    {activePanel > 0 && <Breadcrumb items={breadcrumbItems} />}

                    {/* Progress steps */}
                    <div className="d-flex align-items-center gap-1 mb-4 small text-muted flex-wrap">
                        {["Category", "Brand", "Series", "Model"].map((s, i) => (
                            <span key={i} className="d-flex align-items-center gap-1">
                                <span className={`badge rounded-pill ${activePanel >= i ? "bg-primary" : "bg-body-secondary text-body-secondary border"}`}>
                                    {i + 1}
                                </span>
                                <span className={activePanel === i ? "fw-semibold text-primary" : ""}>{s}</span>
                                {i < 3 && <CIcon icon={cilChevronRight} className="text-muted" style={{ width: 12 }} />}
                            </span>
                        ))}
                    </div>

                    {/* ── PANEL 0 — Categories ── */}
                    {activePanel === 0 && (
                        <PanelGrid
                            items={categories}
                            loading={loadingCats}
                            emptyMsg="No active categories found."
                            onSelect={selectCategory}
                            renderBadge={(c) => !c.is_active ? statusBadge("active") : statusBadge("inactive")}
                            renderSub={(c) => c.parent_id ? `Sub-category` : `Top-level`}
                        />
                    )}

                    {/* ── PANEL 1 — Brands ── */}
                    {activePanel === 1 && (
                        <PanelGrid
                            items={brands}
                            loading={loadingBrands}
                            emptyMsg={`No brands found for "${selectedCategory?.name}".`}
                            onSelect={selectBrand}
                            renderBadge={(b) => statusBadge(b.status || "active")}
                            renderSub={(b) => `${b.series_count} series`}
                        />
                    )}

                    {/* ── PANEL 2 — Series ── */}
                    {activePanel === 2 && (
                        <div>
                            <div className="d-flex justify-content-end mb-3">
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => { setShowAddSeries((p) => !p); setEditingSeries(null); }}
                                >
                                    <CIcon icon={showAddSeries ? cilX : cilPlus} className="me-1" />
                                    {showAddSeries ? "Cancel" : "Add Series"}
                                </button>
                            </div>

                            {showAddSeries && (
                                <InlineForm
                                    fields={[
                                        { key: "name", label: "Series Name", placeholder: "e.g. Galaxy S", col: "col-md-4" },
                                    ]}
                                    onSave={saveSeries}
                                    onCancel={() => setShowAddSeries(false)}
                                    loading={saving}
                                />
                            )}

                            {editingSeries && (
                                <div className="mb-2">
                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                        <div className="small text-muted">
                                            Editing series: <strong>{editingSeries.name}</strong>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setEditingSeries(null)}
                                            disabled={saving}
                                        >
                                            <CIcon icon={cilX} className="me-1" /> Cancel edit
                                        </button>
                                    </div>
                                    <InlineForm
                                        key={editingSeries.id}
                                        fields={[
                                            { key: "name", label: "Series Name", placeholder: "e.g. Galaxy S", col: "col-md-4", default: editingSeries.name },
                                        ]}
                                        onSave={saveSeriesUpdate}
                                        onCancel={() => setEditingSeries(null)}
                                        loading={saving}
                                    />
                                </div>
                            )}

                            <PanelList
                                items={series}
                                loading={loadingSeries}
                                emptyMsg={`No series found for "${selectedBrand?.name}". Add one above.`}
                                selected={selectedSeries}
                                onSelect={selectSeries}
                                onEdit={(s) => { setEditingSeries(s); setShowAddSeries(false); }}
                                renderBadge={(s) => statusBadge(s.status)}
                                renderSub={(s) => `${s.model_count} models`}
                            />
                        </div>
                    )}

                    {/* ── PANEL 3 — Models ── */}
                    {activePanel === 3 && (
                        <div>
                            <div className="d-flex justify-content-end mb-3">
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => setShowAddModel((p) => !p)}
                                >
                                    <CIcon icon={showAddModel ? cilX : cilPlus} className="me-1" />
                                    {showAddModel ? "Cancel" : "Add Model"}
                                </button>
                            </div>

                            {showAddModel && (
                                <InlineForm
                                    fields={[
                                        { key: "name", label: "Model Name", placeholder: "e.g. Galaxy S24 Ultra", col: "col-md-4" },
                                        { key: "image", label: "Model Image", type: "file", col: "col-md-4" },
                                    ]}
                                    onSave={saveModel}
                                    onCancel={() => setShowAddModel(false)}
                                    loading={saving}
                                />
                            )}

                            {/* Context info bar */}
                            <div className="alert alert-light border d-flex gap-3 flex-wrap small mb-3 py-2">
                                <span><span className="text-muted">Category:</span> <strong>{selectedCategory?.name}</strong></span>
                                <span>›</span>
                                <span><span className="text-muted">Brand:</span> <strong>{selectedBrand?.name}</strong></span>
                                <span>›</span>
                                <span><span className="text-muted">Series:</span> <strong>{selectedSeries?.name}</strong></span>
                            </div>

                            <ModelTable
                                models={models}
                                loading={loadingModels}
                                emptyMsg={`No models in "${selectedSeries?.name}" yet. Add one above.`}
                                refreshModels={() => fetchModels(selectedSeries.slug)}
                                showToast={showToast}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Panel Grid (Categories & Brands) ─────────────────────────────────────────
function PanelGrid({ items, loading, emptyMsg, onSelect, renderBadge, renderSub }) {
    if (loading) return <LoadingSpinner />;
    if (!items.length) return <EmptyState msg={emptyMsg} />;

    return (
        <div className="row g-3">
            {items.map((item, index) => (
                <div key={index} className="col-md-4 col-sm-6">
                    <button
                        className="btn btn-outline-secondary w-100 text-start p-3 h-100 d-flex justify-content-between align-items-center"
                        style={{ borderRadius: 8 }}
                        onClick={() => onSelect(item)}
                    >
                        <div>
                            <div className="fw-semibold">{item.name}</div>
                            <div className="text-muted small">{renderSub(item)}</div>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1">
                            {renderBadge(item)}
                            <CIcon icon={cilChevronRight} className="text-muted" style={{ width: 14 }} />
                        </div>
                    </button>
                </div>
            ))}
        </div>
    );
}

// ── Panel List (Series) ───────────────────────────────────────────────────────
function PanelList({ items, loading, emptyMsg, selected, onSelect, onEdit, renderBadge, renderSub }) {
    if (loading) return <LoadingSpinner />;
    if (!items.length) return <EmptyState msg={emptyMsg} />;

    return (
        <div className="d-flex flex-column gap-2">
            {items.map((item, index) => {
                const isSelected = selected?.slug === item.slug;
                return (
                    <div key={index} className="d-flex gap-2 align-items-stretch">
                        <button
                            className={`btn flex-grow-1 text-start p-3 d-flex justify-content-between align-items-center ${isSelected ? "btn-primary" : "btn-outline-secondary"}`}
                            style={{ borderRadius: 8 }}
                            onClick={() => onSelect(item)}
                        >
                            <div>
                                <div className="fw-semibold">{item.name}</div>
                                <div className={`small ${isSelected ? "text-white-50" : "text-muted"}`}>{renderSub(item)}</div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                {!isSelected && renderBadge(item)}
                                <CIcon icon={cilChevronRight} style={{ width: 14 }} />
                            </div>
                        </button>

                        {onEdit && (
                            <button
                                className={`btn ${isSelected ? "btn-outline-light" : "btn-outline-secondary"}`}
                                style={{ borderRadius: 8, minWidth: 46 }}
                                onClick={() => onEdit(item)}
                                title="Edit series"
                            >
                                <CIcon icon={cilPencil} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Model Table ───────────────────────────────────────────────────────────────
function ModelTable({ models, loading, emptyMsg, refreshModels, showToast }) {
    const [configModelSlug, setConfigModelSlug] = useState(null);
    const [viewModelSlug, setViewModelSlug] = useState(null);
    const [editingModel, setEditingModel] = useState(null); // {id, name}
    const [configs, setConfigs] = useState([]);
    const [loadingConfigs, setLoadingConfigs] = useState(false);
    const [showAddConfig, setShowAddConfig] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [savingModel, setSavingModel] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);

    const fetchConfigs = async (modelSlug) => {
        try {
            setLoadingConfigs(true);
            const res = await get_model_configs(modelSlug);
            setConfigs(res.data);
        } catch (e) {
            setConfigs([]);
        } finally {
            setLoadingConfigs(false);
        }
    };

    const handleConfigure = (modelSlug) => {
        if (configModelSlug === modelSlug) {
            setConfigModelSlug(null);
            setConfigs([]);
        } else {
            setConfigModelSlug(modelSlug);
            setViewModelSlug(null);
            setEditingModel(null);
            fetchConfigs(modelSlug);
        }
        setShowAddConfig(false);
        setEditingConfig(null);
    };

    const handleView = (modelSlug) => {
        if (viewModelSlug === modelSlug) {
            setViewModelSlug(null);
            setConfigs([]);
        } else {
            setViewModelSlug(modelSlug);
            setConfigModelSlug(null);
            setEditingModel(null);
            fetchConfigs(modelSlug);
        }
    };

    const handleEditModel = (m) => {
        setEditingModel({ id: m.id, name: m.name });
        setConfigModelSlug(null);
        setViewModelSlug(null);
        setShowAddConfig(false);
        setEditingConfig(null);
        setConfigs([]);
    };

    const saveModelUpdate = async (vals) => {
        try {
            if (!editingModel?.id) return;
            setSavingModel(true);
            await update_model(editingModel.id, { name: vals.name });
            showToast?.("success", `Model updated to "${vals.name}"`);
            setEditingModel(null);
            refreshModels?.();
        } catch (e) {
            showToast?.("danger", e?.response?.data?.message || e.message || "Failed to update model");
        } finally {
            setSavingModel(false);
        }
    };

    const saveConfig = async (vals) => {
        try {
            setSavingConfig(true);
            await create_model_config({
                model_slug: configModelSlug,
                name: vals.name,
                base_price: parseFloat(vals.base_price)
            });
            setShowAddConfig(false);
            fetchConfigs(configModelSlug);
        } catch (e) {
            console.log(e?.response?.data?.message || "Failed to save config");
        } finally {
            setSavingConfig(false);
        }
    };

    const handleUpdateConfig = async (id, field, value) => {
        try {
            await update_model_config(id, { [field]: value });
            fetchConfigs(configModelSlug);
            setEditingConfig(null);
        } catch (e) {
            console.log(e?.response?.data?.message || "Failed to update");
        }
    };

    const handleDeleteConfig = async (id) => {
        if (!confirm('Delete this config?')) return;
        try {
            await delete_model_config(id);
            fetchConfigs(configModelSlug);
        } catch (e) {
            console.log(e?.response?.data?.message || "Failed to delete");
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!models.length) return <EmptyState msg={emptyMsg} />;

    return (
        <div className="table-responsive">
            <table className="table table-bordered align-middle">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Model Name</th>
                        <th>Slug</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {models.map((m, i) => (
                        <React.Fragment key={i}>
                            <tr>
                                <td className="text-muted small">{i + 1}</td>
                                <td className="fw-semibold">{m.name}</td>
                                <td><code className="small">{m.slug}</code></td>
                                <td className="d-flex gap-2">
                                    <button
                                        className={`btn btn-sm ${configModelSlug === m.slug ? 'btn-primary' : 'btn-outline-primary'} d-flex`}
                                        onClick={() => handleConfigure(m.slug)}
                                    >
                                        <CIcon icon={cilSettings} style={{ width: 20, height: 20 }} />
                                        <span className="my-auto">&nbsp;Configure</span>
                                    </button>
                                    <button
                                        className={`btn btn-sm ${viewModelSlug === m.slug ? 'btn-primary' : 'btn-outline-primary'} d-flex`}
                                        onClick={() => handleView(m.slug)}
                                    >
                                        <CIcon icon={cilList} style={{ width: 20, height: 20 }} />
                                        <span className="my-auto">&nbsp;View</span>
                                    </button>

                                    <button
                                        className={`btn btn-sm ${editingModel?.id === m.id ? 'btn-warning' : 'btn-outline-warning'} d-flex`}
                                        onClick={() => (editingModel?.id === m.id ? setEditingModel(null) : handleEditModel(m))}
                                        disabled={!m.id}
                                        title={!m.id ? 'Model id missing (refresh page)' : 'Edit model name'}
                                    >
                                        <CIcon icon={cilPencil} style={{ width: 20, height: 20 }} />
                                        <span className="my-auto">&nbsp;Edit</span>
                                    </button>
                                </td>
                            </tr>

                            {editingModel?.id === m.id && (
                                <tr key={`edit-${m.id}`}>
                                    <td colSpan="4" className="bg-body-tertiary p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold mb-0">Edit Model — {m.name}</h6>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => setEditingModel(null)}
                                                disabled={savingModel}
                                            >
                                                <CIcon icon={cilX} className="me-1" /> Cancel
                                            </button>
                                        </div>

                                        <InlineForm
                                            key={m.id}
                                            fields={[
                                                { key: "name", label: "Model Name", placeholder: "e.g. Galaxy S24 Ultra", col: "col-md-5", default: m.name },
                                            ]}
                                            onSave={saveModelUpdate}
                                            onCancel={() => setEditingModel(null)}
                                            loading={savingModel}
                                        />
                                    </td>
                                </tr>
                            )}

                            {/* Configure panel — add/edit configs */}
                            {configModelSlug === m.slug && (
                                <tr key={`config-${m.slug}`}>
                                    <td colSpan="4" className="bg-body-tertiary p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold mb-0">Sell Configs — {m.name}</h6>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => { setShowAddConfig(!showAddConfig); setEditingConfig(null); }}
                                            >
                                                <CIcon icon={showAddConfig ? cilX : cilPlus} className="me-1" />
                                                {showAddConfig ? 'Cancel' : 'Add Config'}
                                            </button>
                                        </div>

                                        {showAddConfig && (
                                            <InlineForm
                                                fields={[
                                                    { key: "name", label: "Config Name", placeholder: "e.g. 6GB / 128GB", col: "col-md-5" },
                                                    { key: "base_price", label: "Base Price (₹)", placeholder: "e.g. 15000", col: "col-md-5" },
                                                ]}
                                                onSave={saveConfig}
                                                onCancel={() => setShowAddConfig(false)}
                                                loading={savingConfig}
                                            />
                                        )}

                                        {loadingConfigs ? <LoadingSpinner /> : configs.length === 0 ? (
                                            <EmptyState msg="No configs yet. Add one above." />
                                        ) : (
                                            <table className="table table-sm table-bordered mb-0">
                                                <thead>
                                                    <tr><th>#</th><th>Config</th><th>Base Price</th><th>Active</th><th>Actions</th></tr>
                                                </thead>
                                                <tbody>
                                                    {configs.map((c, idx) => (
                                                        <tr key={c.id}>
                                                            <td className="text-muted small">{idx + 1}</td>
                                                            <td>
                                                                {editingConfig?.id === c.id ? (
                                                                    <span className="fw-semibold">Editing…</span>
                                                                ) : (
                                                                    c.name
                                                                )}
                                                            </td>
                                                            <td>₹{Number(c.base_price || 0).toLocaleString()}</td>
                                                            <td>
                                                                <span className={`badge ${c.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                                    {c.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="d-flex gap-1">
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary"
                                                                    onClick={() => {
                                                                        setShowAddConfig(false);
                                                                        setEditingConfig({ id: c.id, name: c.name, base_price: c.base_price });
                                                                    }}
                                                                    title="Edit config"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-warning"
                                                                    onClick={() => handleUpdateConfig(c.id, 'is_active', !c.is_active)}
                                                                    title={c.is_active ? 'Deactivate' : 'Activate'}
                                                                >
                                                                    {c.is_active ? 'Disable' : 'Enable'}
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleDeleteConfig(c.id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}

                                        {editingConfig?.id ? (
                                            <div className="mt-3">
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <div className="small text-muted">
                                                        Editing config: <strong>{editingConfig.name}</strong>
                                                    </div>
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => setEditingConfig(null)}
                                                        disabled={savingConfig}
                                                    >
                                                        <CIcon icon={cilX} className="me-1" /> Cancel edit
                                                    </button>
                                                </div>
                                                <InlineForm
                                                    key={editingConfig.id}
                                                    fields={[
                                                        { key: 'name', label: 'Config Name', placeholder: 'e.g. 6GB / 128GB', col: 'col-md-5', default: editingConfig.name },
                                                        { key: 'base_price', label: 'Base Price (₹)', placeholder: 'e.g. 15000', col: 'col-md-5', default: String(editingConfig.base_price ?? '') },
                                                    ]}
                                                    onSave={async (vals) => {
                                                        try {
                                                            setSavingConfig(true);
                                                            await update_model_config(editingConfig.id, {
                                                                name: vals.name,
                                                                base_price: vals.base_price === '' || vals.base_price == null ? null : parseFloat(vals.base_price),
                                                            });
                                                            showToast?.('success', 'Config updated');
                                                            setEditingConfig(null);
                                                            fetchConfigs(configModelSlug);
                                                        } catch (e) {
                                                            showToast?.('danger', e?.response?.data?.message || e.message || 'Failed to update config');
                                                        } finally {
                                                            setSavingConfig(false);
                                                        }
                                                    }}
                                                    onCancel={() => setEditingConfig(null)}
                                                    loading={savingConfig}
                                                />
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            )}

                            {/* View panel — read-only list */}
                            {viewModelSlug === m.slug && (
                                <tr key={`view-${m.slug}`}>
                                    <td colSpan="4" className="bg-body-tertiary p-3">
                                        <h6 className="fw-bold mb-3">Configs — {m.name}</h6>
                                        {loadingConfigs ? <LoadingSpinner /> : configs.length === 0 ? (
                                            <EmptyState msg="No configs added yet." />
                                        ) : (
                                            <div className="d-flex flex-wrap gap-2">
                                                {configs.map(c => (
                                                    <div key={c.id} className={`border rounded p-2 px-3 ${c.is_active ? 'bg-body' : 'bg-body-secondary text-muted'}`}>
                                                        <div className="fw-semibold small">{c.name}</div>
                                                        <div className="text-muted small">₹{Number(c.base_price).toLocaleString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function LoadingSpinner() {
    return (
        <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border spinner-border-sm text-primary me-2" />
            <span className="text-muted small">Loading...</span>
        </div>
    );
}

function EmptyState({ msg }) {
    return (
        <div className="text-center text-muted py-5">
            <div className="fs-3 mb-2">—</div>
            <div className="small">{msg}</div>
        </div>
    );
}