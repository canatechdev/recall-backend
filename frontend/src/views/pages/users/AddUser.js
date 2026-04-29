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
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");

    // Step 3 - Addresses
    const [addresses, setAddresses] = useState([{ ...initialAddress }]);

    // Step 4 - Roles & Status
    const [roles, setRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);

    useEffect(() => {
        loadRoles();
    }, [])

    useEffect(() => {
        if (!avatarFile) {
            setAvatarPreviewUrl("");
            return;
        }
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

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
    const validateStep = (stepToValidate) => {
        if (stepToValidate === 1) {
            const trimmedEmail = (email || "").trim();
            if (!trimmedEmail) return "Email is required.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return "Invalid email.";

            const trimmedPhone = (phone || "").trim();
            if (trimmedPhone && !/^[+0-9\s-]{7,15}$/.test(trimmedPhone)) return "Invalid phone number.";

            if (!password) return "Password is required.";
            if (password.length < 8) return "Password must be at least 8 characters.";
            if (!confirmPassword) return "Confirm Password is required.";
            if (password !== confirmPassword) return "Passwords do not match.";
        }

        if (stepToValidate === 2) {
            if (!(firstName || "").trim()) return "First Name is required.";
            if (!(lastName || "").trim()) return "Last Name is required.";

            if (avatarFile) {
                if (!avatarFile.type?.startsWith("image/")) return "Avatar must be an image file.";
                const maxBytes = 5 * 1024 * 1024;
                if (avatarFile.size > maxBytes) return "Avatar image must be 5MB or smaller.";
            }
        }

        if (stepToValidate === 3) {
            for (let i = 0; i < addresses.length; i++) {
                const addr = addresses[i];
                const hasAny = Boolean(
                    (addr.name || "").trim() ||
                    (addr.phone || "").trim() ||
                    (addr.line1 || "").trim() ||
                    (addr.line2 || "").trim() ||
                    (addr.city || "").trim() ||
                    (addr.state || "").trim() ||
                    (addr.pincode || "").trim() ||
                    (addr.country || "").trim(),
                );

                if (!hasAny) continue; // optional addresses

                if (!(addr.line1 || "").trim()) return `Address ${i + 1}: Line 1 is required.`;
                if (!(addr.city || "").trim()) return `Address ${i + 1}: City is required.`;
                if (!(addr.state || "").trim()) return `Address ${i + 1}: State is required.`;
                if (!(addr.country || "").trim()) return `Address ${i + 1}: Country is required.`;

                const pin = (addr.pincode || "").trim();
                if (!pin) return `Address ${i + 1}: Pincode is required.`;
                if (!/^[0-9]{4,10}$/.test(pin)) return `Address ${i + 1}: Invalid pincode.`;

                const addrPhone = (addr.phone || "").trim();
                if (addrPhone && !/^[+0-9\s-]{7,15}$/.test(addrPhone)) return `Address ${i + 1}: Invalid contact phone.`;
            }
        }

        return null;
    };

    const goNext = () => {
        const err = validateStep(step);
        if (err) { showToast("danger", err); return; }
        setStep((s) => s + 1);
    };

    const goToStep = (targetStep) => {
        if (targetStep < 1 || targetStep > steps.length) return;
        // Only allow moving backwards via step buttons; forward must go through validations.
        if (targetStep > step) return;
        setStep(targetStep);
    };

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async () => {
        const err = validateStep(step);
        if (err) { showToast("danger", err); return; }

        const addressList = addresses
            .map((a) => ({ ...a, pincode: (a.pincode || "").trim() || null }))
            .filter((a) => (a.line1 || "").trim());
        if (addressList.length > 0 && !addressList.some((a) => a.is_default)) {
            addressList[0].is_default = true;
        }

        const formData = new FormData();
        formData.append("email", (email || "").trim());
        if ((phone || "").trim()) formData.append("phone", (phone || "").trim());
        formData.append("password", password);
        formData.append("is_verified", String(Boolean(isVerified)));
        formData.append(
            "profile",
            JSON.stringify({
                first_name: (firstName || "").trim(),
                last_name: (lastName || "").trim(),
            }),
        );
        formData.append("addresses", JSON.stringify(addressList));
        formData.append("roles", JSON.stringify(selectedRoles));
        if (avatarFile) {
            formData.append("avatar", avatarFile);
        }

        try {
            setLoading(true);
            await create_user(formData);
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
        setFirstName(""); setLastName(""); setAvatarFile(null); setAvatarPreviewUrl("");
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
                                onClick={() => goToStep(i + 1)}
                                disabled={i + 1 > step}
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
                                    <label className="form-label fw-semibold">
                                        First Name <span className="text-danger">*</span>
                                    </label>
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
                                    <label className="form-label fw-semibold">
                                        Last Name <span className="text-danger">*</span>
                                    </label>
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
                                    <label className="form-label fw-semibold">Avatar</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                                    />
                                    <small className="text-muted">Optional. Image files only, up to 5MB.</small>
                                </div>
                                {avatarPreviewUrl && (
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">Preview</label>
                                        <br />
                                        <img
                                            src={avatarPreviewUrl}
                                            alt="Avatar Preview"
                                            className="rounded-circle border"
                                            style={{ width: 80, height: 80, objectFit: "cover" }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 d-flex justify-content-between">
                                <button className="btn btn-outline-secondary" onClick={() => setStep(1)}>
                                    ← Back
                                </button>
                                <button className="btn btn-primary" onClick={goNext}>
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