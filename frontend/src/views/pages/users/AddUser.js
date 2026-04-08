import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get_roles, create_user } from "src/api/system_service"

import {
    CIcon
} from "@coreui/icons-react";
import {
    cilUser,
    cilLockLocked,
    cilEnvelopeClosed,
    cilPhone,
    cilLocationPin,
    cilPlus,
    cilTrash,
    cilCheck,
    cilX,
    cilShieldAlt,
    cilPeople,
} from "@coreui/icons";

const steps = ["Basic Info", "Profile", "Address", "Roles & Status"];

// const ROLES = ["admin", "manager", "customer", "support", "vendor"];

const initialAddress = {
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    is_default: false,
};

export default function AddUser() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null); // { type, msg }

    // Step 1 - Basic Info
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isVerified, setIsVerified] = useState(false);

    // Step 2 - Profile
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    // Step 3 - Addresses
    const [addresses, setAddresses] = useState([{ ...initialAddress }]);

    // Step 4 - Roles & Status
    const [roles, setRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    // const [status, setStatus] = useState("active"); // active | suspended | deleted

    useEffect(() => {
        loadRoles();
    }, [])

    const loadRoles = async () => {
        const result = await get_roles();
        if (result.status == 200) setRoles(result.data);
    }
    // ── Address helpers ──────────────────────────────────────
    const addAddress = () => setAddresses([...addresses, { ...initialAddress }]);
    const removeAddress = (i) => setAddresses(addresses.filter((_, idx) => idx !== i));
    const updateAddress = (i, field, val) => {
        const updated = [...addresses];
        if (field === "is_default") {
            updated.forEach((a, idx) => (updated[idx].is_default = idx === i));
        } else {
            updated[i][field] = val;
        }
        setAddresses(updated);
    };

    // ── Roles helpers ────────────────────────────────────────
    const toggleRole = (roleId) =>
        setSelectedRoles((prev) =>
            prev.includes(roleId)
                ? prev.filter((id) => id !== roleId)
                : [...prev, roleId]
        );


    // ── Validation ───────────────────────────────────────────
    const validateStep = () => {
        if (step === 1) {
            if (!email) return "Email is required.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email.";
            if (!password) return "Password is required.";
            if (password !== confirmPassword) return "Passwords do not match.";
        }
        if (step === 3) {
            for (let i = 0; i < addresses.length; i++) {
                if (!addresses[i].line1) return `Address ${i + 1}: Line 1 is required.`;
            }
        }
        return null;
    };

    const goNext = () => {
        const err = validateStep();
        if (err) { showToast("danger", err); return; }
        setStep((s) => s + 1);
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        const err = validateStep();
        if (err) { showToast("danger", err); return; }

        const payload = {
            email,
            phone: phone || null,
            password,
            is_verified: isVerified,
            profile: {
                first_name: firstName || null,
                last_name: lastName || null,
                avatar_url: avatarUrl || null,
            },
            addresses: addresses.filter((a) => a.line1),
            roles: selectedRoles,
        };

        try {
            setLoading(true);
            await create_user(payload);
            showToast("success", "User created successfully!");
            setTimeout(() => navigate('/users'), 1200);
        } catch (e) {
            showToast("danger", e.response?.data?.message || e.message || "Failed to create user.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setEmail(""); setPhone(""); setPassword(""); setConfirmPassword(""); setIsVerified(false);
        setFirstName(""); setLastName(""); setAvatarUrl("");
        setAddresses([{ ...initialAddress }]);
        setSelectedRoles([]);
        // setStatus("active");
    };

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    return (
        <div className="container py-4">
            {/* Toast */}
            {toast && (
                <div
                    className={`alert alert-${toast.type} alert-dismissible d-flex align-items-center gap-2 position-fixed top-0 end-0 m-3 shadow`}
                    style={{ zIndex: 9999, minWidth: 280 }}
                >
                    <CIcon icon={toast.type === "success" ? cilCheck : cilX} />
                    <span>{toast.msg}</span>
                    <button className="btn-close" onClick={() => setToast(null)} />
                </div>
            )}

            <div className="card shadow-sm border-0">
                {/* Header */}
                <div className="card-header bg-body d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h4 className="fw-bold text-uppercase mb-0">
                        <CIcon icon={cilUser} className="me-2 text-primary" />
                        Add User
                    </h4>
                    <div className="d-flex gap-2 flex-wrap">
                        {steps.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i + 1)}
                                className={`btn btn-sm ${step === i + 1 ? "btn-primary" : "btn-outline-secondary"}`}
                            >
                                {i + 1}. {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card-body">

                    {/* ── STEP 1 — Basic Info ──────────────────────────── */}
                    {step === 1 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">
                                <CIcon icon={cilEnvelopeClosed} className="me-1" /> Account Credentials
                            </h6>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Email <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        placeholder="+91 9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        maxLength={15}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Password <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Min. 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Confirm Password <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Repeat password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    {confirmPassword && password !== confirmPassword && (
                                        <div className="form-text text-danger">Passwords do not match.</div>
                                    )}
                                </div>
                                <div className="col-12">
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="isVerified"
                                            checked={isVerified}
                                            onChange={(e) => setIsVerified(e.target.checked)}
                                        />
                                        <label className="form-check-label fw-semibold" htmlFor="isVerified">
                                            Mark Email as Verified
                                        </label>
                                    </div>
                                    <small className="text-muted">
                                        If unchecked, user will need to verify their email.
                                    </small>
                                </div>
                            </div>
                            <div className="mt-4 text-end">
                                <button className="btn btn-primary" onClick={goNext}>
                                    Next: Profile →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2 — Profile ────────────────────────────── */}
                    {step === 2 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">
                                <CIcon icon={cilUser} className="me-1" /> User Profile
                            </h6>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">First Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="FName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        maxLength={50}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Last Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="LName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        maxLength={50}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-semibold">Avatar URL</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        placeholder="https://cdn.example.com/avatars/user.png"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                    />
                                </div>
                                {avatarUrl && (
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">Preview</label>
                                        <br />
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar Preview"
                                            className="rounded-circle border"
                                            style={{ width: 80, height: 80, objectFit: "cover" }}
                                            onError={(e) => (e.target.style.display = "none")}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary" onClick={() => setStep(1)}>
                                    ← Back
                                </button>
                                <button className="btn btn-primary" onClick={() => setStep(3)}>
                                    Next: Address →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3 — Addresses ──────────────────────────── */}
                    {step === 3 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">
                                <CIcon icon={cilLocationPin} className="me-1" /> Addresses{" "}
                                <small className="text-muted fw-normal">(optional)</small>
                            </h6>

                            {addresses.map((addr, i) => (
                                <div key={i} className="border rounded p-3 mb-3 bg-light position-relative">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="fw-semibold text-secondary small text-uppercase">
                                            Address {i + 1}
                                            {addr.is_default && (
                                                <span className="badge bg-success ms-2">Default</span>
                                            )}
                                        </span>
                                        <div className="d-flex gap-2 align-items-center">
                                            <div className="form-check mb-0">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="defaultAddress"
                                                    id={`default_${i}`}
                                                    checked={addr.is_default}
                                                    onChange={() => updateAddress(i, "is_default", true)}
                                                />
                                                <label className="form-check-label small" htmlFor={`default_${i}`}>
                                                    Set Default
                                                </label>
                                            </div>
                                            {addresses.length > 1 && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => removeAddress(i)}
                                                >
                                                    <CIcon icon={cilTrash} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Contact Name</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Receiver name"
                                                value={addr.name}
                                                onChange={(e) => updateAddress(i, "name", e.target.value)}
                                                maxLength={50}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Contact Phone</label>
                                            <input
                                                type="tel"
                                                className="form-control form-control-sm"
                                                placeholder="+91 9876543210"
                                                value={addr.phone}
                                                onChange={(e) => updateAddress(i, "phone", e.target.value)}
                                                maxLength={15}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">
                                                Line 1 <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="House no., Street, Area"
                                                value={addr.line1}
                                                onChange={(e) => updateAddress(i, "line1", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">Line 2</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Landmark, Locality (optional)"
                                                value={addr.line2}
                                                onChange={(e) => updateAddress(i, "line2", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-semibold">City</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Mumbai"
                                                value={addr.city}
                                                onChange={(e) => updateAddress(i, "city", e.target.value)}
                                                maxLength={50}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-semibold">State</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Maharashtra"
                                                value={addr.state}
                                                onChange={(e) => updateAddress(i, "state", e.target.value)}
                                                maxLength={50}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-semibold">Pincode</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="400001"
                                                value={addr.pincode}
                                                onChange={(e) => updateAddress(i, "pincode", e.target.value)}
                                                maxLength={10}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Country</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="India"
                                                value={addr.country}
                                                onChange={(e) => updateAddress(i, "country", e.target.value)}
                                                maxLength={50}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button className="btn btn-outline-primary btn-sm" onClick={addAddress}>
                                <CIcon icon={cilPlus} className="me-1" /> Add Another Address
                            </button>

                            <div className="mt-4 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary" onClick={() => setStep(2)}>
                                    ← Back
                                </button>
                                <button className="btn btn-primary" onClick={goNext}>
                                    Next: Roles & Status →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4 — Roles & Status ──────────────────────── */}
                    {step === 4 && (
                        <div>
                            <h6 className="text-muted text-uppercase fw-semibold mb-3">
                                <CIcon icon={cilShieldAlt} className="me-1" /> Roles & Status
                            </h6>

                            {/* Status
                            <div className="mb-4">
                                <label className="form-label fw-semibold">User Status</label>
                                <div className="d-flex gap-3 flex-wrap">
                                    {["active", "suspended", "deleted"].map((s) => (
                                        <div key={s} className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="userStatus"
                                                id={`status_${s}`}
                                                value={s}
                                                checked={status === s}
                                                onChange={() => setStatus(s)}
                                            />
                                            <label className="form-check-label" htmlFor={`status_${s}`}>
                                                <span
                                                    className={`badge ${s === "active"
                                                        ? "bg-success"
                                                        : s === "suspended"
                                                            ? "bg-warning text-dark"
                                                            : "bg-danger"
                                                        }`}
                                                >
                                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div> */}

                            {/* Roles */}
                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    <CIcon icon={cilPeople} className="me-1" /> Assign Roles
                                </label>
                                <div className="d-flex flex-wrap gap-2">
                                    {roles.map((role) => {
                                        const active = selectedRoles.includes(role.id);

                                        return (
                                            <button
                                                key={role.id}
                                                type="button"
                                                className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"
                                                    }`}
                                                onClick={() => toggleRole(role.id)}
                                            >
                                                {active && <CIcon icon={cilCheck} className="me-1" />}
                                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                            </button>
                                        );
                                    })}

                                </div>
                                {selectedRoles.length === 0 && (
                                    <small className="text-muted d-block mt-1">
                                        No roles assigned — user will have default access only.
                                    </small>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="border rounded p-3 bg-light mt-4">
                                <h6 className="fw-semibold mb-2">Summary</h6>
                                <div className="row g-1 small">
                                    <div className="col-md-6">
                                        <span className="text-muted">Email:</span> {email || "—"}
                                    </div>
                                    <div className="col-md-6">
                                        <span className="text-muted">Phone:</span> {phone || "—"}
                                    </div>
                                    <div className="col-md-6">
                                        <span className="text-muted">Name:</span>{" "}
                                        {[firstName, lastName].filter(Boolean).join(" ") || "—"}
                                    </div>
                                    <div className="col-md-6">
                                        <span className="text-muted">Verified:</span>{" "}
                                        {isVerified ? "Yes" : "No"}
                                    </div>
                                    <div className="col-md-6">
                                        <span className="text-muted">Addresses:</span>{" "}
                                        {addresses.filter((a) => a.line1).length}
                                    </div>
                                    <div className="col-md-6">
                                        <span className="text-muted">Roles:</span>{" "}
                                        {selectedRoles.length > 0 ? selectedRoles.join(", ") : "None"}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary" onClick={() => setStep(3)}>
                                    ← Back
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    <CIcon icon={cilUser} className="me-1" />
                                    {loading ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}