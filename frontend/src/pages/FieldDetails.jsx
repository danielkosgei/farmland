import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Sprout, MapPin, Wheat, Info,
    Droplets, Layers, Maximize, Edit2,
    ChevronRight, Calendar, ImageIcon, Ruler,
    Activity, Database, Map, Clipboard, CheckCircle, Save
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { PhotoGallery } from '../components/PhotoGallery';
import { Input, Label, FormGroup, Select, Textarea, FormRow } from '../components/ui/Form';
import { formatLabel } from '../utils/formatting';
import './Crops.css';
import '../components/EntityDetails.css';

export function FieldDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [field, setField] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCropModal, setShowCropModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Inline Notes State
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [showSaveIndicator, setShowSaveIndicator] = useState(false);
    const saveTimeoutRef = useRef(null);

    const [fieldForm, setFieldForm] = useState({
        name: '', sizeAcres: '', location: '', soilType: '', status: '', notes: ''
    });

    const [cropForm, setCropForm] = useState({
        cropType: '', variety: '', plantingDate: new Date().toISOString().split('T')[0],
        expectedHarvest: '', seedCost: '', fertilizerCost: '', notes: ''
    });

    useEffect(() => { loadField(); }, [id]);

    const loadField = async () => {
        try {
            setLoading(true);
            const data = await window.go.main.CropsService.GetField(parseInt(id));
            if (data) {
                setField(data);
                setNotes(data.notes || '');
                setFieldForm({ ...data, sizeAcres: data.sizeAcres.toString() });
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleNotesChange = (e) => {
        setNotes(e.target.value);
    };

    const persistNotes = async () => {
        if (!field || notes === field.notes) return;

        setIsSavingNotes(true);
        try {
            await window.go.main.CropsService.UpdateField({
                ...field,
                notes: notes
            });
            setField({ ...field, notes: notes });
            setShowSaveIndicator(true);

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                setShowSaveIndicator(false);
            }, 3000);
        } catch (err) {
            console.error("Failed to save field notes:", err);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleFieldSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.CropsService.UpdateField({
                ...fieldForm,
                id: parseInt(id),
                sizeAcres: parseFloat(fieldForm.sizeAcres) || 0
            });
            setShowEditModal(false);
            loadField();
        } catch (err) { console.error(err); }
    };

    const handleCropSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.CropsService.AddCropRecord({
                fieldId: parseInt(id),
                cropType: cropForm.cropType,
                variety: cropForm.variety,
                plantingDate: cropForm.plantingDate,
                expectedHarvest: cropForm.expectedHarvest,
                seedCost: parseFloat(cropForm.seedCost) || 0,
                fertilizerCost: parseFloat(cropForm.fertilizerCost) || 0,
                status: 'planted',
                notes: cropForm.notes
            });
            setShowCropModal(false);
            setCropForm({ cropType: '', variety: '', plantingDate: new Date().toISOString().split('T')[0], expectedHarvest: '', seedCost: '', fertilizerCost: '', notes: '' });
            loadField();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading-container">Loading field details...</div>;
    if (!field) return <div className="error-container">Field not found.</div>;

    return (
        <div className="field-details-page">
            <header className="page-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/crops')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="header-title-row">
                            <h1>{field.name}</h1>
                            <div className="header-badges">
                                <span className="badge badge-primary">FLD-{field.id.toString().padStart(3, '0')}</span>
                                <span className={`badge badge-status-${field.status}`}>{formatLabel(field.status)}</span>
                                <span className="badge badge-neutral">{field.sizeAcres} Acres</span>
                                <span className="badge badge-neutral">{field.soilType || 'Loam'}</span>
                            </div>
                        </div>
                        <p className="breadcrumb">
                            Crops <ChevronRight size={14} /> Fields <ChevronRight size={14} /> <span className="text-primary">{field.name}</span>
                        </p>
                    </div>
                </div>
                <div className="page-actions">
                    <Button icon={Sprout} variant="outline" onClick={() => setShowCropModal(true)}>Plant Crop</Button>
                    <Button icon={Edit2} onClick={() => setShowEditModal(true)}>Edit Field</Button>
                </div>
            </header>

            <div className="details-layout">
                <div className="details-main-grid">
                    <div className="details-content-column">
                        <div className="details-section-card">
                            <div className="section-header">
                                <Database size={20} className="text-primary" />
                                <h3 className="section-title">Plot Registry & Management</h3>
                            </div>
                            <div className="section-content">
                                <div className="profile-content-inner">
                                    <div className="info-grid">
                                        <div className="data-field">
                                            <span className="data-label">Current Crop</span>
                                            <span className="data-value">{field.currentCrop || 'Available (Fallow)'}</span>
                                        </div>
                                        <div className="data-field">
                                            <span className="data-label">Land Size</span>
                                            <span className="data-value">{field.sizeAcres} Total Acres</span>
                                        </div>
                                        <div className="data-field">
                                            <span className="data-label">General Area</span>
                                            <span className="data-value">{field.location || 'Not Specified'}</span>
                                        </div>
                                        <div className="data-field">
                                            <span className="data-label">Soil Quality</span>
                                            <span className="data-value">{field.soilType || 'Loam'}</span>
                                        </div>
                                    </div>

                                    <div className="details-divider"></div>

                                    <section>
                                        <h4 className="data-label mb-6"><Info size={12} className="inline mr-1" /> Field Notes & Observations</h4>
                                        <div className="details-notes-box">
                                            <textarea
                                                className="editable-notes"
                                                value={notes}
                                                onChange={handleNotesChange}
                                                onBlur={persistNotes}
                                                placeholder="Click here to add field management notes..."
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
                                <Map size={20} className="text-info" />
                                <h3 className="section-title">Geographic Data</h3>
                            </div>
                            <div className="section-content">
                                <div className="flex flex-col gap-8">
                                    <div className="data-field">
                                        <span className="data-label">Registration ID</span>
                                        <span className="data-value font-mono">FLD-{field.id.toString().padStart(4, '0')}</span>
                                    </div>
                                    <div className="data-field">
                                        <span className="data-label">Identity Status</span>
                                        <span className="data-value text-xs text-primary">Certified Plot</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="gallery-container">
                    <h2 className="gallery-title">
                        <ImageIcon size={28} className="text-primary" />
                        Plot History & Visuals
                    </h2>
                    <PhotoGallery entityType="field" entityId={field.id} hideHeader={true} />
                </div>
            </div>

            {/* Modals for Interactivity */}
            <Modal isOpen={showCropModal} onClose={() => setShowCropModal(false)} title={`Plant New Crop - ${field.name}`} size="md">
                <form onSubmit={handleCropSubmit}>
                    <FormRow>
                        <FormGroup><Label htmlFor="cropType" required>Crop Type</Label><Input id="cropType" value={cropForm.cropType} onChange={(e) => setCropForm({ ...cropForm, cropType: e.target.value })} required placeholder="e.g. Maize" /></FormGroup>
                        <FormGroup><Label htmlFor="variety">Variety</Label><Input id="variety" value={cropForm.variety} onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })} placeholder="e.g. H614" /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="pDate" required>Planting Date</Label><Input id="pDate" type="date" value={cropForm.plantingDate} onChange={(e) => setCropForm({ ...cropForm, plantingDate: e.target.value })} required /></FormGroup>
                        <FormGroup><Label htmlFor="hDate">Expected Harvest</Label><Input id="hDate" type="date" value={cropForm.expectedHarvest} onChange={(e) => setCropForm({ ...cropForm, expectedHarvest: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={cropForm.notes} onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowCropModal(false)}>Cancel</Button><Button type="submit">Plant Crop</Button></div>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Field Details" size="md">
                <form onSubmit={handleFieldSubmit}>
                    <FormGroup><Label htmlFor="editName" required>Field Name</Label><Input id="editName" value={fieldForm.name} onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })} required /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="editSize" required>Size (Acres)</Label><Input id="editSize" type="number" step="0.1" value={fieldForm.sizeAcres} onChange={(e) => setFieldForm({ ...fieldForm, sizeAcres: e.target.value })} required /></FormGroup>
                        <FormGroup><Label htmlFor="editLocation">Location</Label><Input id="editLocation" value={fieldForm.location} onChange={(e) => setFieldForm({ ...fieldForm, location: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="editSoil">Soil Type</Label><Select id="editSoil" value={fieldForm.soilType} onChange={(e) => setFieldForm({ ...fieldForm, soilType: e.target.value })}><option value="Loam">Loam</option><option value="Clay">Clay</option><option value="Sandy">Sandy</option><option value="Silty">Silty</option><option value="Black Cotton">Black Cotton</option></Select></FormGroup>
                        <FormGroup><Label htmlFor="editStatus">Status</Label><Select id="editStatus" value={fieldForm.status} onChange={(e) => setFieldForm({ ...fieldForm, status: e.target.value })}><option value="fallow">Fallow</option><option value="planted">Planted</option><option value="growing">Growing</option><option value="ready_harvest">Ready for Harvest</option></Select></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="editNotes">Notes</Label><Textarea id="editNotes" value={fieldForm.notes} onChange={(e) => setFieldForm({ ...fieldForm, notes: e.target.value })} rows={3} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button><Button type="submit">Update Field</Button></div>
                </form>
            </Modal>
        </div>
    );
}
