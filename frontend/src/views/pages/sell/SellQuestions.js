import React, { useState, useEffect, useMemo } from "react";
import ThemedTablePage from 'src/components/ThemedTablePage'
import CIcon from "@coreui/icons-react";
import {
    cilPlus, cilX, cilCheck, cilPencil, cilTrash, cilChevronRight,
    cilReload, cilArrowRight, cilLink
} from "@coreui/icons";
import {
    get_sell_questions, create_sell_question, update_sell_question, delete_sell_question,
    create_question_option, delete_question_option,
    get_question_conditions, create_question_condition, delete_question_condition,
    get_categories, map_question_to_category, unmap_question_from_category
} from "../../../api/system_service";

const INPUT_TYPES = [
    { value: "yes_no", label: "Yes / No" },
    { value: "single_select", label: "Single Select" },
    { value: "multi_select", label: "Multi Select" },
];

// yes_no placeholder options — shown when DB options haven't loaded yet
const YES_NO_DEFAULTS = [
    { id: null, text: "Yes", price_deduction: 0, sort_index: 1, show: [], _synthetic: true },
    { id: null, text: "No", price_deduction: 0, sort_index: 2, show: [], _synthetic: true },
];

/**
 * Normalize a raw option from the API.
 * Handles both field naming conventions: price_deduction vs deduction.
 * Ensures `show` is always an array of strings.
 */
const normalizeOption = (o = {}) => ({
    ...o,
    id: o.id ?? null,
    text: o.text ?? "",
    price_deduction: Number(o.price_deduction ?? o.deduction ?? 0),
    sort_index: o.sort_index ?? 0,
    show: Array.isArray(o.show) ? o.show.map(String) : [],
});

/**
 * Normalize a raw question from the API.
 * Ensures options, categories are always arrays and IDs are strings.
 */
const normalizeQuestion = (q = {}) => ({
    ...q,
    id: String(q.id ?? ""),
    text: q.text ?? "",
    description: q.description ?? "",
    input_type: q.input_type ?? "single_select",
    sort_index: q.sort_index ?? q.index ?? 0,
    options: Array.isArray(q.options) ? q.options.map(normalizeOption) : [],
    categories: Array.isArray(q.categories) ? q.categories : [],
});

/** Effective options for a question — always returns Yes/No stubs for yes_no type. */
const getEffectiveOptions = (q) => {
    if (!q) return [];
    if (q.input_type !== "yes_no") return q.options ?? [];
    return (q.options?.length > 0) ? q.options : YES_NO_DEFAULTS;
};

const inputTypeBadge = (type) => {
    const map = { yes_no: "bg-info", single_select: "bg-primary", multi_select: "bg-warning text-dark" };
    return <span className={`badge ${map[type] || "bg-secondary"}`}>{(type ?? "").replace(/_/g, " ")}</span>;
};

export default function SellQuestions() {
    const [questions, setQuestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // Inline edit state
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ text: "", description: "", input_type: "single_select", sort_index: 1 });

    // Add question form
    const [newQ, setNewQ] = useState({ text: "", description: "", input_type: "yes_no", category_slugs: [] });

    // Options â€” shared add form; keyed by expanded question
    const [newOpt, setNewOpt] = useState({ text: "", price_deduction: 0 });
    const [savingOpt, setSavingOpt] = useState(false);

    // Condition add form
    const [newCond, setNewCond] = useState({ trigger_option_id: "", show_question_id: "" });

    // Category mapping
    const [mapCatSlug, setMapCatSlug] = useState("");

    // ── Filters ────────────────────────────────────────────
    const [filterText, setFilterText] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterConditional, setFilterConditional] = useState(""); // "" | "yes" | "no"

    useEffect(() => {
        fetchQuestions();
        fetchCategories();
    }, []);

    //  Derived data â”€

    /**
     * Set of question IDs that are referenced in at least one option's `show` array.
     * These questions are conditional â€” they don't appear by default in the sell flow.
     */
    const conditionalQIds = useMemo(() => {
        const ids = new Set();
        questions.forEach(q => {
            (q.options ?? []).forEach(o => {
                (o.show ?? []).forEach(id => ids.add(String(id)));
            });
        });
        return ids;
    }, [questions]);

    /** Whether any filter is currently active */
    const hasActiveFilters = filterText !== "" || filterCategory !== "" || filterType !== "" || filterConditional !== "";

    /** Filtered questions based on current filter state */
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            if (filterText) {
                const t = filterText.toLowerCase();
                if (
                    !q.text?.toLowerCase().includes(t) &&
                    !q.description?.toLowerCase().includes(t)
                ) return false;
            }
            if (filterCategory) {
                const matchedCat = categories.find(c => c.slug === filterCategory);
                if (matchedCat && !(q.categories ?? []).some(qc => qc.id === matchedCat.id)) return false;
            }
            if (filterType && q.input_type !== filterType) return false;
            if (filterConditional === "yes" && !conditionalQIds.has(String(q.id))) return false;
            if (filterConditional === "no" && conditionalQIds.has(String(q.id))) return false;
            return true;
        });
    }, [questions, filterText, filterCategory, filterType, filterConditional, conditionalQIds, categories]);

    /** Reset all filters */
    const clearFilters = () => {
        setFilterText("");
        setFilterCategory("");
        setFilterType("");
        setFilterConditional("");
    };

    /**
     * For a given question, find which options (from other questions) trigger its appearance.
     * Returns: [{ fromQuestion, option }]
     */
    const getTriggeredBy = (questionId) => {
        const qId = String(questionId);
        const triggers = [];
        questions.forEach(q => {
            (q.options ?? []).forEach(o => {
                if ((o.show ?? []).includes(qId)) {
                    triggers.push({ fromQuestion: q, option: o });
                }
            });
        });
        return triggers;
    };

    /**
     * Outgoing conditions for a question derived from its options' `show` arrays.
     * Returns: [{ option, shownQuestion }]
     */
    const getOutgoingConditions = (q) => {
        const results = [];
        (q?.options ?? []).forEach(o => {
            (o.show ?? []).forEach(shownId => {
                const shownQ = questions.find(oq => String(oq.id) === String(shownId));
                if (shownQ) results.push({ option: o, shownQuestion: shownQ });
            });
        });
        return results;
    };

    //  Fetch helpers 

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const res = await get_sell_questions();
            const raw = Array.isArray(res.data) ? res.data : [];
            setQuestions(raw.map(normalizeQuestion));
        } catch (e) {
            console.error(e);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await get_categories("true");
            setCategories(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error(e);
        }
    };

    const buildQuestionPayload = (data, sortIndex) => ({
        text: (data.text ?? "").trim(),
        description: (data.description ?? "").trim() || null,
        input_type: data.input_type,
        sort_index: parseInt(sortIndex) || 1,
        category_slugs: Array.isArray(data.category_slugs) ? data.category_slugs : [],
    });

    const handleCreateQuestion = async () => {
        if (!newQ.text?.trim() || !newQ.input_type) return;
        try {
            setSaving(true);
            const nextSortIndex = (questions.length > 0
                ? Math.max(...questions.map(q => q.sort_index))
                : 0) + 1;
            const res = await create_sell_question(buildQuestionPayload(newQ, nextSortIndex));
            // Auto-create readonly Yes / No options so conditions can be wired immediately
            if (newQ.input_type === "yes_no") {
                const newQId = res.data?.id;
                if (newQId) {
                    await Promise.all([
                        create_question_option({ question_id: newQId, text: "Yes", price_deduction: 0, sort_index: 1 }),
                        create_question_option({ question_id: newQId, text: "No", price_deduction: 0, sort_index: 2 }),
                    ]);
                }
            }
            setShowAdd(false);
            setNewQ({ text: "", description: "", input_type: "yes_no", category_slugs: [] });
            fetchQuestions();
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to create question");
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (q) => {
        setEditingId(q.id);
        setEditData({
            text: q.text ?? "",
            description: q.description ?? "",
            input_type: q.input_type ?? "single_select",
            sort_index: q.sort_index ?? 1,
        });
    };

    const handleUpdateQuestion = async () => {
        if (!editData.text?.trim()) return;
        try {
            setSaving(true);
            await update_sell_question(editingId, buildQuestionPayload(editData, editData.sort_index));
            setEditingId(null);
            fetchQuestions();
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to update question");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!confirm("Deactivate this question?")) return;
        try {
            await delete_sell_question(id);
            if (expandedId === id) { setExpandedId(null); }
            fetchQuestions();
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to delete question");
        }
    };

    const toggleExpand = (q) => {
        const qId = String(q.id);
        if (expandedId === qId) {
            setExpandedId(null);
        } else {
            setExpandedId(qId);
            setEditingId(null);
            setNewOpt({ text: "", price_deduction: 0 });
            setNewCond({ trigger_option_id: "", show_question_id: "" });
        }
    };

    //  Option CRUD 

    const handleAddOption = async (questionId) => {
        if (!newOpt.text?.trim()) return;
        try {
            setSavingOpt(true);
            const question = questions.find(q => String(q.id) === String(questionId));
            const nextOptSort = (question?.options?.length ?? 0) + 1;
            const deductionPct = Math.min(100, Math.max(0, parseFloat(newOpt.price_deduction) || 0));
            await create_question_option({
                question_id: questionId,
                text: newOpt.text.trim(),
                price_deduction: deductionPct,
                sort_index: nextOptSort,
            });
            setNewOpt({ text: "", price_deduction: 0 });
            fetchQuestions();
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to add option");
        } finally {
            setSavingOpt(false);
        }
    };

    const handleDeleteOption = async (optId) => {
        if (!optId) return;
        if (!confirm("Delete this option?")) return;
        try {
            await delete_question_option(optId);
            fetchQuestions();
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to delete option");
        }
    };

    //  Condition CRUD â”€

    const handleAddCondition = async () => {
        if (!newCond.trigger_option_id || !newCond.show_question_id) return;
        try {
            await create_question_condition({
                trigger_option_id: parseInt(newCond.trigger_option_id),
                show_question_id: parseInt(newCond.show_question_id),
            });
            setNewCond({ trigger_option_id: "", show_question_id: "" });
            fetchQuestions(); // refresh show[] arrays
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to add condition");
        }
    };

    const handleDeleteCondition = async (triggerOptionId, showQuestionId) => {
        if (!triggerOptionId || !showQuestionId || !expandedId) return;
        try {
            // Fetch condition ID on demand (no need to pre-load conditions)
            const res = await get_question_conditions(expandedId);
            const cond = (Array.isArray(res.data) ? res.data : []).find(c =>
                String(c.trigger_option_id) === String(triggerOptionId) &&
                String(c.show_question_id) === String(showQuestionId)
            );
            if (!cond?.id) return;
            await delete_question_condition(cond.id);
            fetchQuestions(); // refresh show[] arrays
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to delete condition");
        }
    };


    const handleMapCategory = async (questionId) => {
        if (!mapCatSlug) return;
        try {
            await map_question_to_category({ category_slug: mapCatSlug, question_id: questionId });
            setMapCatSlug("");
            fetchQuestions();
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to map category");
        }
    };

    const handleUnmapCategory = async (categoryId, questionId) => {
        try {
            await unmap_question_from_category(categoryId, questionId);
            fetchQuestions();
        } catch (e) {
            console.error(e?.response?.data?.message || "Failed to unmap category");
        }
    };

    const toggleCategory = (catSlug) => {
        setNewQ(prev => ({
            ...prev,
            category_slugs: (prev.category_slugs ?? []).includes(catSlug)
                ? prev.category_slugs.filter(s => s !== catSlug)
                : [...(prev.category_slugs ?? []), catSlug],
        }));
    };



    const nextSortIndex = questions.length > 0
        ? Math.max(...questions.map(q => q.sort_index ?? 0)) + 1
        : 1;

    return (
        <div className="container py-4">
            <ThemedTablePage
                loading={loading}
                actions={{
                    filtersContent: (
                        <div className="d-flex flex-column gap-2">
                            <div>
                                <label className="form-label small fw-semibold mb-1">Search</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Search by question text or description..."
                                    value={filterText}
                                    onChange={e => setFilterText(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label small fw-semibold mb-1">Category</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterCategory}
                                    onChange={e => setFilterCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.slug} value={c.slug}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label small fw-semibold mb-1">Type</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value)}
                                >
                                    <option value="">All Types</option>
                                    {INPUT_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label small fw-semibold mb-1">Visibility</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterConditional}
                                    onChange={e => setFilterConditional(e.target.value)}
                                >
                                    <option value="">All</option>
                                    <option value="no">Default (always shown)</option>
                                    <option value="yes">Conditional only</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                title="Clear filters"
                            >
                                <CIcon icon={cilX} className="me-1" />
                                Reset
                            </button>
                        </div>
                    ),
                    onExport: null,
                }}
                topContent={
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            <div>
                                <h4 className="fw-bold text-uppercase mb-0">Sell Questions</h4>
                                <small className="text-muted">
                                    Manage evaluation questions, options, conditions &amp; category mappings
                                </small>
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={fetchQuestions}
                                    disabled={loading}
                                    title="Refresh"
                                >
                                    <CIcon icon={cilReload} />
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => setShowAdd(v => !v)}
                                >
                                    <CIcon icon={showAdd ? cilX : cilPlus} className="me-1" />
                                    {showAdd ? "Cancel" : "Add Question"}
                                </button>
                            </div>
                        </div>

                        {showAdd && (
                            <div className="border rounded p-3 mt-3 bg-white shadow-sm">
                                <h6 className="fw-semibold mb-3">New Question</h6>
                                <div className="row g-2">
                                    <div className="col-md-4">
                                        <label className="form-label small fw-semibold">Question Text *</label>
                                        <input
                                            type="text" className="form-control form-control-sm"
                                            placeholder="e.g. Is the screen cracked?"
                                            value={newQ.text}
                                            onChange={e => setNewQ(p => ({ ...p, text: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold">Description</label>
                                        <input
                                            type="text" className="form-control form-control-sm"
                                            placeholder="Helper text shown below question"
                                            value={newQ.description}
                                            onChange={e => setNewQ(p => ({ ...p, description: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold">Input Type *</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={newQ.input_type}
                                            onChange={e => setNewQ(p => ({ ...p, input_type: e.target.value }))}
                                        >
                                            {INPUT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label small fw-semibold">Sort Order</label>
                                        <div className="form-control form-control-sm bg-light text-muted" style={{ cursor: "default" }}>
                                            # {nextSortIndex}
                                            <span className="ms-1 text-success small">(auto)</span>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label small fw-semibold">Map to Categories</label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {categories.map(c => (
                                                <button
                                                    key={c.slug}
                                                    type="button"
                                                    className={`btn btn-sm ${(newQ.category_slugs ?? []).includes(c.slug) ? "btn-primary" : "btn-outline-secondary"}`}
                                                    onClick={() => toggleCategory(c.slug)}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2 mt-3 justify-content-end">
                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowAdd(false)}>
                                        <CIcon icon={cilX} className="me-1" /> Cancel
                                    </button>
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={handleCreateQuestion}
                                        disabled={saving || !newQ.text?.trim()}
                                    >
                                        <CIcon icon={cilCheck} className="me-1" />
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                }
                columns={[
                    {
                        key: 'sort_index',
                        label: 'Order',
                        headerStyle: { width: 80 },
                        render: (q) => {
                            const qId = String(q.id)
                            const isEditing = editingId === qId
                            if (!isEditing) {
                                return (
                                    <div className="text-center">
                                        <span className="badge bg-light text-dark border">{q.sort_index}</span>
                                    </div>
                                )
                            }

                            return (
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    style={{ width: 65 }}
                                    value={editData.sort_index}
                                    min="1"
                                    onChange={e => setEditData(p => ({ ...p, sort_index: e.target.value }))}
                                />
                            )
                        },
                    },
                    {
                        key: 'question',
                        label: 'Question',
                        cellClassName: 'text-start',
                        render: (q) => {
                            const qId = String(q.id)
                            const isConditional = conditionalQIds.has(qId)
                            const triggeredBy = isConditional ? getTriggeredBy(qId) : []
                            const isEditing = editingId === qId

                            if (isEditing) {
                                return (
                                    <>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm mb-1"
                                            value={editData.text}
                                            onChange={e => setEditData(p => ({ ...p, text: e.target.value }))}
                                        />
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Description (optional)"
                                            value={editData.description}
                                            onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                                        />
                                    </>
                                )
                            }

                            return (
                                <>
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <span className="fw-semibold">{q.text}</span>
                                        {isConditional && (
                                            <span
                                                className="badge bg-secondary fw-normal"
                                                style={{ fontSize: "0.68rem" }}
                                                title="This question is shown conditionally — only when a specific option is selected"
                                            >
                                                conditional
                                            </span>
                                        )}
                                    </div>
                                    {q.description && <small className="text-muted d-block">{q.description}</small>}
                                    {isConditional && triggeredBy.length > 0 && (
                                        <div className="mt-1 d-flex flex-wrap gap-1">
                                            {triggeredBy.map((t, i) => (
                                                <small key={i} className="text-muted">
                                                    <span className="badge bg-light text-secondary border" style={{ fontSize: "0.65rem" }}>
                                                        Q#{t.fromQuestion.sort_index} &rsaquo; {t.option.text}
                                                    </span>
                                                </small>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )
                        },
                    },
                    {
                        key: 'input_type',
                        label: 'Type',
                        render: (q) => {
                            const qId = String(q.id)
                            const isEditing = editingId === qId
                            if (!isEditing) return inputTypeBadge(q.input_type)

                            return (
                                <select
                                    className="form-select form-select-sm"
                                    value={editData.input_type}
                                    onChange={e => setEditData(p => ({ ...p, input_type: e.target.value }))}
                                >
                                    {INPUT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            )
                        },
                    },
                    {
                        key: 'options',
                        label: 'Options',
                        render: (q) => (
                            <span className="badge bg-secondary rounded-pill">{(q.options ?? []).length}</span>
                        ),
                    },
                    {
                        key: 'categories',
                        label: 'Categories',
                        render: (q) => (
                            <div className="d-flex flex-wrap gap-1">
                                {(q.categories ?? []).length > 0
                                    ? (q.categories).map(c => (
                                        <span key={c.id ?? c.slug} className="badge bg-light text-dark border">
                                            {c.name}
                                        </span>
                                    ))
                                    : <span className="text-muted small">None</span>
                                }
                            </div>
                        ),
                    },
                    {
                        key: 'actions',
                        label: 'Actions',
                        render: (q) => {
                            const qId = String(q.id)
                            const isExpanded = expandedId === qId
                            const isEditing = editingId === qId

                            if (isEditing) {
                                return (
                                    <div className="d-flex gap-1">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-success"
                                            onClick={handleUpdateQuestion}
                                            disabled={saving || !editData.text?.trim()}
                                            title="Save"
                                        >
                                            <CIcon icon={cilCheck} />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setEditingId(null)}
                                            title="Cancel"
                                        >
                                            <CIcon icon={cilX} />
                                        </button>
                                    </div>
                                )
                            }

                            return (
                                <div className="d-flex gap-1">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-warning"
                                        onClick={() => startEditing(q)}
                                        title="Edit question"
                                    >
                                        <CIcon icon={cilPencil} />
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${isExpanded ? "btn-primary" : "btn-outline-info"}`}
                                        onClick={() => toggleExpand(q)}
                                        title="Manage Options & Conditions"
                                    >
                                        <CIcon icon={cilChevronRight} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteQuestion(qId)}
                                        title="Deactivate"
                                    >
                                        <CIcon icon={cilTrash} />
                                    </button>
                                </div>
                            )
                        },
                    },
                ]}
                rows={filteredQuestions}
                rowKey={(q) => q.id}
                getRowClassName={(q) => {
                    const qId = String(q.id)
                    if (editingId === qId) return 'table-warning'
                    if (expandedId === qId) return 'table-active'
                    if (conditionalQIds.has(qId)) return 'table-light'
                    return ''
                }}
                rowExpansion={{
                    isExpanded: (q) => {
                        const qId = String(q.id)
                        if (editingId === qId) return false
                        return expandedId === qId
                    },
                    cellClassName: 'bg-light p-3',
                    rowClassName: '',
                    render: (q) => {
                        const qId = String(q.id)
                        return (
                            <div className="row g-3">
                                {/* Options */}
                                <div className="col-md-5">
                                    <h6 className="fw-bold mb-2">
                                        Options
                                        {q.input_type === "yes_no" && (
                                            <span className="ms-2 badge bg-secondary fw-normal" style={{ fontSize: "0.7rem" }}>
                                                Fixed: Yes / No
                                            </span>
                                        )}
                                    </h6>
                                    {(() => {
                                        const opts = getEffectiveOptions(q);
                                        if (opts.length === 0) return (
                                            <p className="text-muted small mb-2">No options yet.</p>
                                        );
                                        return (
                                            <table className="table table-sm table-bordered mb-2">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ width: 30 }}>#</th>
                                                        <th>Text</th>
                                                        <th>Deduction (&#37;)</th>
                                                        <th>Shows</th>
                                                        {q.input_type !== "yes_no" && <th />}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {opts.map((o, idx) => {
                                                        const showsQs = (o.show ?? []).map(sid =>
                                                            questions.find(oq => String(oq.id) === String(sid))
                                                        ).filter(Boolean);
                                                        return (
                                                            <tr key={o.id ?? `syn-${idx}`} className={o._synthetic ? "table-secondary" : ""}>
                                                                <td className="text-muted small text-center">{o.sort_index}</td>
                                                                <td>
                                                                    {o.text}
                                                                    {o._synthetic && (
                                                                        <span className="ms-1 text-muted" style={{ fontSize: "0.7rem" }}>(auto)</span>
                                                                    )}
                                                                </td>
                                                                <td className="text-danger">
                                                                    {o.price_deduction > 0 ? `${Number(o.price_deduction).toLocaleString()}` : "0"}&#37;
                                                                </td>
                                                                <td>
                                                                    {showsQs.length > 0
                                                                        ? showsQs.map(sq => (
                                                                            <span key={sq.id} className="badge bg-warning text-dark me-1" style={{ fontSize: "0.65rem" }}>
                                                                                Q#{sq.sort_index}
                                                                            </span>
                                                                        ))
                                                                        : <span className="text-muted small">None</span>
                                                                    }
                                                                </td>
                                                                {q.input_type !== "yes_no" && (
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-danger p-0 px-1"
                                                                            onClick={() => handleDeleteOption(o.id)}
                                                                            disabled={!o.id}
                                                                            title="Delete option"
                                                                        >
                                                                            <CIcon icon={cilTrash} style={{ width: 14, height: 14 }} />
                                                                        </button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        );
                                    })()}
                                    {q.input_type === "yes_no" ? (
                                        <p className="text-muted small mb-0">
                                            Yes / No options are system-managed and readonly — use them to wire conditions below.
                                        </p>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <input
                                                type="text" className="form-control form-control-sm"
                                                placeholder="Option text"
                                                value={newOpt.text}
                                                onChange={e => setNewOpt(p => ({ ...p, text: e.target.value }))}
                                            />
                                            <input
                                                type="number" className="form-control form-control-sm" style={{ maxWidth: 90 }}
                                                placeholder="% Deduct"
                                                min="0" max="100" step="0.01"
                                                value={newOpt.price_deduction}
                                                onChange={e => setNewOpt(p => ({ ...p, price_deduction: e.target.value }))}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-success"
                                                onClick={() => handleAddOption(qId)}
                                                disabled={savingOpt || !newOpt.text?.trim()}
                                                title="Add option"
                                            >
                                                <CIcon icon={cilPlus} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Conditions */}
                                <div className="col-md-4">
                                    <h6 className="fw-bold mb-2">Conditions</h6>
                                    <small className="text-muted d-block mb-2">
                                        When an option is selected, show a question that comes <strong>after</strong> this one.
                                    </small>

                                    {(() => {
                                        const outgoing = getOutgoingConditions(q);
                                        if (outgoing.length === 0) return (
                                            <p className="text-muted small mb-2">No conditions yet.</p>
                                        );
                                        return outgoing.map(({ option: o, shownQuestion: sq }, i) => (
                                            <div key={i} className="d-flex align-items-center gap-1 mb-1 small">
                                                <span className="badge bg-info text-dark">{o.text}</span>
                                                <CIcon icon={cilArrowRight} style={{ width: 12 }} />
                                                <span className="badge bg-warning text-dark">
                                                    Q#{sq.sort_index} {sq.text}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm p-0 px-1 btn-outline-danger ms-auto"
                                                    onClick={() => handleDeleteCondition(o.id, sq.id)}
                                                    title="Remove condition"
                                                >
                                                    <CIcon icon={cilX} style={{ width: 12, height: 12 }} />
                                                </button>
                                            </div>
                                        ));
                                    })()}

                                    <div className="d-flex gap-1 mt-2">
                                        <select
                                            className="form-select form-select-sm"
                                            value={newCond.trigger_option_id}
                                            onChange={e => setNewCond(p => ({ ...p, trigger_option_id: e.target.value }))}
                                        >
                                            <option value="">If option...</option>
                                            {getEffectiveOptions(q).map((o, idx) => (
                                                <option
                                                    key={o.id ?? `syn-${idx}`}
                                                    value={o.id ?? ""}
                                                    disabled={!o.id}
                                                >
                                                    {o.text}{o._synthetic ? " (pending...)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-select form-select-sm"
                                            value={newCond.show_question_id}
                                            onChange={e => setNewCond(p => ({ ...p, show_question_id: e.target.value }))}
                                        >
                                            <option value="">Then show...</option>
                                            {questions
                                                .filter(oq => String(oq.id) !== qId && (oq.sort_index ?? 0) > (q.sort_index ?? 0))
                                                .map(oq => (
                                                    <option key={oq.id} value={oq.id}>
                                                        [#{oq.sort_index}] {oq.text}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-success"
                                            onClick={handleAddCondition}
                                            disabled={!newCond.trigger_option_id || !newCond.show_question_id}
                                            title="Add condition"
                                        >
                                            <CIcon icon={cilLink} />
                                        </button>
                                    </div>
                                </div>

                                {/* Category Mapping */}
                                <div className="col-md-3">
                                    <h6 className="fw-bold mb-2">Categories</h6>
                                    <div className="d-flex flex-wrap gap-1 mb-2">
                                        {(q.categories ?? []).length > 0
                                            ? (q.categories).map(c => (
                                                <span key={c.id ?? c.slug} className="badge bg-primary d-flex align-items-center gap-1">
                                                    {c.name}
                                                    <button
                                                        type="button"
                                                        className="btn-close btn-close-white p-0 ms-1"
                                                        style={{ fontSize: "0.5rem" }}
                                                        onClick={() => handleUnmapCategory(c.id, qId)}
                                                        title="Unmap"
                                                    />
                                                </span>
                                            ))
                                            : <span className="text-muted small">No categories mapped.</span>
                                        }
                                    </div>
                                    <div className="d-flex gap-1">
                                        <select
                                            className="form-select form-select-sm"
                                            value={mapCatSlug}
                                            onChange={e => setMapCatSlug(e.target.value)}
                                        >
                                            <option value="">Add category...</option>
                                            {categories
                                                .filter(c => !(q.categories ?? []).find(qc => qc.id === c.id || qc.slug === c.slug))
                                                .map(c => (
                                                    <option key={c.slug} value={c.slug}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleMapCategory(qId)}
                                            disabled={!mapCatSlug}
                                            title="Map"
                                        >
                                            <CIcon icon={cilPlus} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                }}
                emptyText={
                    questions.length === 0
                        ? 'No questions yet. Add one above.'
                        : 'No questions match your filters.'
                }
                footerLeft={
                    <div className="text-muted small d-flex gap-3 flex-wrap align-items-center">
                        <span>Total: <strong>{questions.length}</strong> question{questions.length !== 1 ? "s" : ""}</span>
                        {conditionalQIds.size > 0 && (
                            <span>{conditionalQIds.size} conditional</span>
                        )}
                        {hasActiveFilters && (
                            <span className="text-primary">Filtered: {filteredQuestions.length} shown</span>
                        )}
                        {hasActiveFilters && filteredQuestions.length === 0 && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                }
            />
        </div>
    );
}

