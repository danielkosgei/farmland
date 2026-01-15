import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Edit2, Milk, Users, Info, Calendar,
    ChevronRight, Tag, Activity, Heart, Trash2,
    Database, Beef, TrendingUp, ImageIcon,
    Clipboard, Fingerprint, Save, CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { PhotoGallery } from '../components/PhotoGallery';
import { Input, Label, FormGroup, Select, Textarea, FormRow } from '../components/ui/Form';
import './Livestock.css';
import '../components/EntityDetails.css';

export function AnimalDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMilkModal, setShowMilkModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Inline Notes State
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [showSaveIndicator, setShowSaveIndicator] = useState(false);
    const saveTimeoutRef = useRef(null);

    const [milkForm, setMilkForm] = useState({
        date: new Date().toISOString().split('T')[0], morningLiters: '', eveningLiters: '', notes: ''
    });

    const [editForm, setEditForm] = useState({
        id: id, tagNumber: '', name: '', type: '', breed: '', dateOfBirth: '',
        gender: '', motherId: null, fatherId: null, status: '', notes: ''
    });

    useEffect(() => { loadAnimal(); }, [id]);

    const loadAnimal = async () => {
        try {
            setLoading(true);
            const data = await window.go.main.LivestockService.GetAnimal(parseInt(id));
            if (data) {
                setAnimal(data);
                setNotes(data.notes || '');
                setEditForm({ ...data, motherId: data.motherId || null, fatherId: data.fatherId || null });
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const formatAge = (dob) => {
        if (!dob) return 'Unknown Age';
        const birthDate = new Date(dob);
        const now = new Date();
        const diffTime = Math.abs(now - birthDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`;
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} Week${weeks !== 1 ? 's' : ''}`;
        }
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30.44);
            return `${months} Month${months !== 1 ? 's' : ''}`;
        }
        const years = Math.floor(diffDays / 365.25);
        return `${years} Year${years !== 1 ? 's' : ''}`;
    };

    const handleNotesChange = (e) => {
        setNotes(e.target.value);
    };

    const persistNotes = async () => {
        if (!animal || notes === animal.notes) return;

        setIsSavingNotes(true);
        try {
            await window.go.main.LivestockService.UpdateAnimal({
                ...animal,
                notes: notes
            });
            setAnimal({ ...animal, notes: notes });
            setShowSaveIndicator(true);

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                setShowSaveIndicator(false);
            }, 3000);
        } catch (err) {
            console.error("Failed to save notes:", err);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleMilkSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.LivestockService.AddMilkRecord({
                animalId: parseInt(id),
                date: milkForm.date,
                morningLiters: parseFloat(milkForm.morningLiters) || 0,
                eveningLiters: parseFloat(milkForm.eveningLiters) || 0,
                notes: milkForm.notes
            });
            setShowMilkModal(false);
            setMilkForm({ date: new Date().toISOString().split('T')[0], morningLiters: '', eveningLiters: '', notes: '' });
        } catch (err) { console.error(err); }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.LivestockService.UpdateAnimal({
                ...editForm,
                id: parseInt(id),
                motherId: editForm.motherId ? parseInt(editForm.motherId) : null,
                fatherId: editForm.fatherId ? parseInt(editForm.fatherId) : null
            });
            setShowEditModal(false);
            loadAnimal();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading-container">Loading animal details...</div>;
    if (!animal) return <div className="error-container">Animal not found.</div>;

    return (
        <div className="animal-details-page">
            <header className="page-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/livestock')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="header-title-row">
                            <h1>{animal.name}</h1>
                            <div className="header-badges">
                                <span className="badge badge-primary">#{animal.tagNumber || 'N/A'}</span>
                                <span className="badge badge-neutral">{animal.gender}</span>
                                <span className="badge badge-neutral">{formatAge(animal.dateOfBirth)}</span>
                            </div>
                        </div>
                        <p className="breadcrumb">
                            Livestock <ChevronRight size={14} /> {animal.type} <ChevronRight size={14} /> <span className="text-primary">{animal.name}</span>
                        </p>
                    </div>
                </div>
                <div className="page-actions">
                    {(animal.gender === 'female' && animal.status === 'active') && (
                        <Button icon={Milk} variant="outline" onClick={() => setShowMilkModal(true)}>Record Milk</Button>
                    )}
                    <Button icon={Edit2} onClick={() => setShowEditModal(true)}>Edit Details</Button>
                </div>
            </header>

            <div className="details-layout">
                <div className="details-main-grid">
                    <div className="details-content-column">
                        <div className="details-section-card">
                            <div className="section-header">
                                <Beef size={20} className="text-primary" />
                                <h3 className="section-title">Animal Profile</h3>
                            </div>
                            <div className="section-content">
                                <div className="profile-content-inner">
                                    <div className="info-grid">
                                        <div className="data-field">
                                            <span className="data-label">Breed</span>
                                            <span className="data-value">{animal.breed || 'Mixed'}</span>
                                        </div>
                                        <div className="data-field">
                                            <span className="data-label">Status</span>
                                            <span className="data-value capitalize">{animal.status}</span>
                                        </div>
                                        <div className="data-field">
                                            <span className="data-label">Registration Date</span>
                                            <span className="data-value">{new Date(animal.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="data-field">
                                            <span className="data-label">Animal Type</span>
                                            <span className="data-value capitalize">{animal.type}</span>
                                        </div>
                                    </div>

                                    <div className="details-divider"></div>

                                    <section>
                                        <h4 className="data-label mb-6"><Users size={12} className="inline mr-1" /> Heritage & Descent</h4>
                                        <div className="parents-row">
                                            <div className="parent-mini-card">
                                                <div className="parent-avatar">♀</div>
                                                <div className="parent-info">
                                                    <span className="data-label">Dam (Mother)</span>
                                                    <span className="parent-name">{animal.motherName || 'Unknown'}</span>
                                                </div>
                                            </div>
                                            <div className="parent-mini-card">
                                                <div className="parent-avatar">♂</div>
                                                <div className="parent-info">
                                                    <span className="data-label">Sire (Father)</span>
                                                    <span className="parent-name">{animal.fatherName || 'Unknown'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="details-divider"></div>

                                    <section>
                                        <h4 className="data-label mb-6"><Info size={12} className="inline mr-1" /> Management Notes</h4>
                                        <div className="details-notes-box">
                                            <textarea
                                                className="editable-notes"
                                                value={notes}
                                                onChange={handleNotesChange}
                                                onBlur={persistNotes}
                                                placeholder="Click here to add management notes for this animal..."
                                            />
                                            <div className={`notes-save-indicator ${showSaveIndicator ? 'visible' : ''}`}>
                                                <CheckCircle size={14} className="icon" />
                                                <span>Changes saved</span>
                                            </div>
                                            {isSavingNotes && (
                                                <div className="notes-save-indicator visible">
                                                    <Save size={14} className="animate-pulse" />
                                                    <span>Saving...</span>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="details-info-column">
                        <div className="details-section-card">
                            <div className="section-header">
                                <Fingerprint size={20} className="text-info" />
                                <h3 className="section-title">Registry Specs</h3>
                            </div>
                            <div className="section-content">
                                <div className="flex flex-col gap-8">
                                    <div className="data-field">
                                        <span className="data-label">System Record ID</span>
                                        <span className="data-value font-mono">#{animal.id}</span>
                                    </div>
                                    <div className="data-field">
                                        <span className="data-label">Identity Status</span>
                                        <span className="data-value text-xs text-primary">Unique & Verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="gallery-container">
                    <h2 className="gallery-title">
                        <ImageIcon size={28} className="text-primary" />
                        Visual History
                    </h2>
                    <PhotoGallery entityType="animal" entityId={animal.id} />
                </div>
            </div>

            {/* Modals remain same */}
            <Modal isOpen={showMilkModal} onClose={() => setShowMilkModal(false)} title={`Record Milk - ${animal.name}`} size="sm">
                <form onSubmit={handleMilkSubmit}>
                    <FormGroup><Label htmlFor="milkDate" required>Date</Label><Input id="milkDate" type="date" value={milkForm.date} onChange={(e) => setMilkForm({ ...milkForm, date: e.target.value })} required /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="morning">Morning (L)</Label><Input id="morning" type="number" step="0.1" value={milkForm.morningLiters} onChange={(e) => setMilkForm({ ...milkForm, morningLiters: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="evening">Evening (L)</Label><Input id="evening" type="number" step="0.1" value={milkForm.eveningLiters} onChange={(e) => setMilkForm({ ...milkForm, eveningLiters: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={milkForm.notes} onChange={(e) => setMilkForm({ ...milkForm, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowMilkModal(false)}>Cancel</Button><Button type="submit">Save Record</Button></div>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Animal Details" size="md">
                <form onSubmit={handleEditSubmit}>
                    <FormRow>
                        <FormGroup><Label htmlFor="tagNumber">Tag Number</Label><Input id="tagNumber" value={editForm.tagNumber} onChange={(e) => setEditForm({ ...editForm, tagNumber: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="name" required>Name</Label><Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="type">Type</Label><Select id="type" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}><option value="cow">Cow</option><option value="bull">Bull</option><option value="heifer">Heifer</option><option value="calf">Calf</option></Select></FormGroup>
                        <FormGroup><Label htmlFor="breed">Breed</Label><Input id="breed" value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="dob">Date of Birth</Label><Input id="dob" type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="status">Status</Label><Select id="status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Active</option><option value="sold">Sold</option><option value="deceased">Deceased</option></Select></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button><Button type="submit">Update Animal</Button></div>
                </form>
            </Modal>
        </div>
    );
}
