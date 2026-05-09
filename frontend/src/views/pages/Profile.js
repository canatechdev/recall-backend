import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from 'src/context/AuthContext'
import { get_my_profile, update_my_profile } from 'src/api/system_service'
import CIcon from '@coreui/icons-react'
import { cilCheck, cilCloudUpload, cilUser } from '@coreui/icons'

const Profile = () => {
    const { user, setUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        avatar: null,
    })

    const createdPreviewUrlRef = useRef(null)

    const avatarPreview = useMemo(() => {
        if (form.avatar instanceof File) {
            if (createdPreviewUrlRef.current) {
                try { URL.revokeObjectURL(createdPreviewUrlRef.current) } catch { /* ignore */ }
            }
            const url = URL.createObjectURL(form.avatar)
            createdPreviewUrlRef.current = url
            return url
        }
        const fileName = user?.avatar_url
        if (!fileName) return null
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:5500/').replace(/\/+$/, '')
        return `${base}/uploads/${fileName}`
    }, [form.avatar, user])

    const showToast = (type, msg) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3000)
    }

    const load = async () => {
        try {
            setLoading(true)
            const res = await get_my_profile()
            const data = res?.data
            setForm((p) => ({
                ...p,
                first_name: data?.first_name || '',
                last_name: data?.last_name || '',
                phone: data?.phone || '',
                avatar: null,
            }))
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        return () => {
            if (createdPreviewUrlRef.current) {
                try { URL.revokeObjectURL(createdPreviewUrlRef.current) } catch { /* ignore */ }
                createdPreviewUrlRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onSave = async () => {
        try {
            setSaving(true)
            const fd = new FormData()
            fd.append('phone', form.phone)
            fd.append('profile', JSON.stringify({ first_name: form.first_name, last_name: form.last_name }))
            if (form.avatar) fd.append('avatar', form.avatar)

            const res = await update_my_profile(fd)
            const updated = res?.data

            // keep header avatar/name in sync
            setUser((prev) => ({
                ...(prev || {}),
                first_name: updated?.first_name ?? prev?.first_name,
                last_name: updated?.last_name ?? prev?.last_name,
                phone: updated?.phone ?? prev?.phone,
                avatar_url: updated?.avatar_url ?? prev?.avatar_url,
            }))

            showToast('success', 'Profile updated')
        } catch (e) {
            showToast('danger', e.response?.data?.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="container py-4">
            {toast && (
                <div
                    className={`alert alert-${toast.type} alert-dismissible position-fixed top-0 end-0 m-3 shadow`}
                    style={{ zIndex: 9999, minWidth: 260 }}
                >
                    <span>{toast.msg}</span>
                    <button className="btn-close" onClick={() => setToast(null)} />
                </div>
            )}

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-body d-flex align-items-center justify-content-between">
                    <div>
                        <h4 className="fw-bold mb-0 text-uppercase">
                            <CIcon icon={cilUser} className="me-2 text-primary" />
                            Profile
                        </h4>
                        <small className="text-muted">Manage your account details</small>
                    </div>
                </div>

                <div className="card-body">
                    {loading ? (
                        <div className="d-flex justify-content-center py-5">
                            <div className="spinner-border spinner-border-sm text-primary" />
                        </div>
                    ) : (
                        <div className="row g-4">
                            <div className="col-12 col-md-4">
                                <div className="border rounded p-3 bg-body-tertiary h-100">
                                    <div className="fw-semibold mb-2">Avatar</div>
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            className="border rounded bg-body d-flex align-items-center justify-content-center"
                                            style={{ width: 72, height: 72, overflow: 'hidden' }}
                                        >
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="text-muted small">N/A</div>
                                            )}
                                        </div>
                                        <div className="flex-grow-1">
                                            <input
                                                type="file"
                                                className="form-control form-control-sm"
                                                accept="image/*"
                                                onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.files?.[0] || null }))}
                                            />
                                            <div className="small text-muted mt-1">JPG/PNG/AVIF supported</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 col-md-8">
                                <div className="border rounded p-3">
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">First Name</label>
                                            <input
                                                className="form-control"
                                                value={form.first_name}
                                                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Last Name</label>
                                            <input
                                                className="form-control"
                                                value={form.last_name}
                                                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Phone</label>
                                            <input
                                                className="form-control"
                                                value={form.phone}
                                                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-semibold">Email</label>
                                            <input className="form-control" value={user?.email || ''} disabled />
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end mt-3">
                                        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                                            <CIcon icon={saving ? cilCloudUpload : cilCheck} className="me-2" />
                                            {saving ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile
