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
    cilLowVision,
} from "@coreui/icons";

const eyeIcon = [
    '512 512',
    "<path fill='var(--ci-primary-color, currentColor)' d='M256 144C156 144 82 200 48 256c34 56 108 112 208 112s174-56 208-112c-34-56-108-112-208-112zm0 176a64 64 0 1 1 64-64 64 64 0 0 1-64 64z' class='ci-primary'/>",
];

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

    const [attemptedSteps, setAttemptedSteps] = useState({});

    // Step 1 - Basic Info
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        if (result.status == 200) {
            const roleList = Array.isArray(result.data) ? result.data : [];
            setRoles(roleList);

            // Roles are mandatory: default to "User" if present.
            setSelectedRoles((prev) => {
                if (Array.isArray(prev) && prev.length > 0) return prev;
                const userRole = roleList.find((r) => String(r?.name || '').toLowerCase() === 'user');
                return userRole?.id ? [userRole.id] : prev;
            });
        }
    }
    const setPhoneNumber = (val) => {
        if (/^[0-9+\s-]*$/.test(val)) {
            setPhone(val.slice(0, 10));
        }
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
        setSelectedRoles((prev) => {
            const prevArr = Array.isArray(prev) ? prev : [];
            if (prevArr.includes(roleId)) {
                const next = prevArr.filter((id) => id !== roleId);
                // Roles are mandatory; don't allow clearing the last role.
                return next.length === 0 ? prevArr : next;
            }
            return [...prevArr, roleId];
        });


    // ── Validation ───────────────────────────────────────────
    const buildStepErrors = (stepToValidate) => {
        const errors = {};

        if (stepToValidate === 1) {
            const trimmedEmail = (email || "").trim();
            if (!trimmedEmail) errors.email = "Email is required.";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errors.email = "Invalid email.";

            const trimmedPhone = (phone || "").trim();
            if (trimmedPhone && !/^[+0-9\s-]{7,15}$/.test(trimmedPhone)) errors.phone = "Invalid phone number.";

            if (!password) errors.password = "Password is required.";
            else if (password.length < 8) errors.password = "Password must be at least 8 characters.";

            if (!confirmPassword) errors.confirmPassword = "Confirm Password is required.";
            else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
        }

        if (stepToValidate === 2) {
            if (!(firstName || "").trim()) errors.firstName = "First Name is required.";
            if (!(lastName || "").trim()) errors.lastName = "Last Name is required.";

            if (avatarFile) {
                if (!avatarFile.type?.startsWith("image/")) errors.avatar = "Avatar must be an image file.";
                const maxBytes = 5 * 1024 * 1024;
                if (avatarFile.size > maxBytes) errors.avatar = "Avatar image must be 5MB or smaller.";
            }
        }

        if (stepToValidate === 3) {
            const addrErrors = addresses.map((addr) => {
                const addrErr = {};
                const hasAny = Boolean(
                    (addr?.name || "").trim() ||
                    (addr?.phone || "").trim() ||
                    (addr?.line1 || "").trim() ||
                    (addr?.line2 || "").trim() ||
                    (addr?.city || "").trim() ||
                    (addr?.state || "").trim() ||
                    (addr?.pincode || "").trim() ||
                    (addr?.country || "").trim(),
                );

                if (!hasAny) return addrErr; // optional address

                if (!(addr?.line1 || "").trim()) addrErr.line1 = "Line 1 is required.";
                if (!(addr?.city || "").trim()) addrErr.city = "City is required.";
                if (!(addr?.state || "").trim()) addrErr.state = "State is required.";
                if (!(addr?.country || "").trim()) addrErr.country = "Country is required.";

                const pin = (addr?.pincode || "").trim();
                if (!pin) addrErr.pincode = "Pincode is required.";
                else if (!/^[0-9]{4,10}$/.test(pin)) addrErr.pincode = "Invalid pincode.";

                const addrPhone = (addr?.phone || "").trim();
                if (addrPhone && !/^[+0-9\s-]{7,15}$/.test(addrPhone)) addrErr.phone = "Invalid contact phone.";

                return addrErr;
            });

            if (addrErrors.some((e) => Object.keys(e).length > 0)) {
                errors.addresses = addrErrors;
            }
        }

        if (stepToValidate === 4) {
            if (!Array.isArray(selectedRoles) || selectedRoles.length === 0) {
                errors.roles = "At least one role is required.";
            }
        }

        return errors;
    };

    const firstErrorMessage = (errors, currentStep) => {
        if (!errors || typeof errors !== 'object') return null;
        if (currentStep === 3 && Array.isArray(errors.addresses)) {
            for (let i = 0; i < errors.addresses.length; i++) {
                const e = errors.addresses[i] || {};
                const firstKey = Object.keys(e)[0];
                if (firstKey) return `Address ${i + 1}: ${e[firstKey]}`;
            }
            return null;
        }
        const firstKey = Object.keys(errors)[0];
        return firstKey ? errors[firstKey] : null;
    };

    const goNext = () => {
        setAttemptedSteps((p) => ({ ...p, [step]: true }));
        const stepErrors = buildStepErrors(step);
        const err = firstErrorMessage(stepErrors, step);
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
        setAttemptedSteps((p) => ({ ...p, [step]: true }));
        const stepErrors = buildStepErrors(step);
        const err = firstErrorMessage(stepErrors, step);
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
        setAttemptedSteps({});
        // setStatus("active");
    };
    const setFirstNameFilter = (val) => {
        if (/^[a-zA-Z\s]*$/.test(val)) {
            setFirstName(val.replace(/\s+/g, " ").slice(0, 50));
        }
    };
    const setLastNameFilter = (val) => {
        if (/^[a-zA-Z\s]*$/.test(val)) {
            setLastName(val.replace(/\s+/g, " ").slice(0, 50));
        }
    };
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const step1Errors = attemptedSteps[1] ? buildStepErrors(1) : {};
    const step2Errors = attemptedSteps[2] ? buildStepErrors(2) : {};
    const step4Errors = attemptedSteps[4] ? buildStepErrors(4) : {};

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
                                        className={`form-control ${step1Errors.email ? 'is-invalid' : ''}`}
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <div className="invalid-feedback">{step1Errors.email}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Phone</label>
                                    <input
                                        type="tel"
                                        className={`form-control ${step1Errors.phone ? 'is-invalid' : ''}`}
                                        placeholder="9876543210"
                                        value={phone}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        maxLength={15}
                                    />
                                    <div className="invalid-feedback">{step1Errors.phone}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Password <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group has-validation">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={`form-control ${step1Errors.password ? 'is-invalid' : ''}`}
                                            placeholder="Min. 8 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span
                                            className="input-group-text"
                                            role="button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            title={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((v) => !v)}
                                            style={{ cursor: "pointer", userSelect: "none" }}
                                        >
                                            <CIcon icon={showPassword ? cilLowVision : eyeIcon} />
                                        </span>
                                    </div>
                                    <div className="invalid-feedback d-block">{step1Errors.password}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Confirm Password <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group has-validation">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className={`form-control ${step1Errors.confirmPassword ? 'is-invalid' : ''}`}
                                            placeholder="Repeat password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <span
                                            className="input-group-text"
                                            role="button"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            title={showConfirmPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            style={{ cursor: "pointer", userSelect: "none" }}
                                        >
                                            <CIcon icon={showConfirmPassword ? cilLowVision : eyeIcon} />
                                        </span>
                                    </div>
                                    <div className="invalid-feedback d-block">{step1Errors.confirmPassword}</div>
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
                                        className={`form-control ${step2Errors.firstName ? 'is-invalid' : ''}`}
                                        placeholder="FName"
                                        value={firstName}
                                        onChange={(e) => setFirstNameFilter(e.target.value)}
                                        maxLength={50}
                                    />
                                    <div className="invalid-feedback">{step2Errors.firstName}</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Last Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control ${step2Errors.lastName ? 'is-invalid' : ''}`}
                                        placeholder="LName"
                                        value={lastName}
                                        onChange={(e) => setLastNameFilter(e.target.value)}
                                        maxLength={50}
                                    />
                                    <div className="invalid-feedback">{step2Errors.lastName}</div>
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-semibold">Avatar</label>
                                    <input
                                        type="file"
                                        className={`form-control ${step2Errors.avatar ? 'is-invalid' : ''}`}
                                        accept="image/*"
                                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="invalid-feedback">{step2Errors.avatar}</div>
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

                            {addresses.map((addr, i) => {
                                const stepErrors = attemptedSteps[3] ? buildStepErrors(3) : {};
                                const addrErr = Array.isArray(stepErrors.addresses) ? (stepErrors.addresses[i] || {}) : {};
                                return (
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
                                                className={`form-control form-control-sm ${addrErr.phone ? 'is-invalid' : ''}`}
                                                placeholder="+91 9876543210"
                                                value={addr.phone}
                                                onChange={(e) => updateAddress(i, "phone", e.target.value)}
                                                maxLength={15}
                                            />
                                            <div className="invalid-feedback">{addrErr.phone}</div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label small fw-semibold">
                                                Line 1 <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-sm ${addrErr.line1 ? 'is-invalid' : ''}`}
                                                placeholder="House no., Street, Area"
                                                value={addr.line1}
                                                onChange={(e) => updateAddress(i, "line1", e.target.value)}
                                            />
                                            <div className="invalid-feedback">{addrErr.line1}</div>
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
                                                className={`form-control form-control-sm ${addrErr.city ? 'is-invalid' : ''}`}
                                                placeholder="Mumbai"
                                                value={addr.city}
                                                onChange={(e) => updateAddress(i, "city", e.target.value)}
                                                maxLength={50}
                                            />
                                            <div className="invalid-feedback">{addrErr.city}</div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-semibold">State</label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-sm ${addrErr.state ? 'is-invalid' : ''}`}
                                                placeholder="Maharashtra"
                                                value={addr.state}
                                                onChange={(e) => updateAddress(i, "state", e.target.value)}
                                                maxLength={50}
                                            />
                                            <div className="invalid-feedback">{addrErr.state}</div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small fw-semibold">Pincode</label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-sm ${addrErr.pincode ? 'is-invalid' : ''}`}
                                                placeholder="400001"
                                                value={addr.pincode}
                                                onChange={(e) => updateAddress(i, "pincode", e.target.value)}
                                                maxLength={10}
                                            />
                                            <div className="invalid-feedback">{addrErr.pincode}</div>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-semibold">Country</label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-sm ${addrErr.country ? 'is-invalid' : ''}`}
                                                placeholder="India"
                                                value={addr.country}
                                                onChange={(e) => updateAddress(i, "country", e.target.value)}
                                                maxLength={50}
                                            />
                                            <div className="invalid-feedback">{addrErr.country}</div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}

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
                                    <span className="text-danger"> *</span>
                                </label>
                                <div className={`d-flex flex-wrap gap-2 ${step4Errors.roles ? 'border border-danger rounded p-2' : ''}`}>
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
                                {step4Errors.roles ? (
                                    <div className="text-danger small mt-1">{step4Errors.roles}</div>
                                ) : null}
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