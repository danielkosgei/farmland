import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Wheat, Sprout, Camera } from 'lucide-react';
import { PhotoGallery } from '../components/PhotoGallery';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import './Crops.css';

const cropTypes = ['Maize', 'Beans', 'Sukuma Wiki (Kale)', 'Spinach', 'Cabbage', 'Tomatoes', 'Onions', 'Potatoes', 'Sweet Potatoes', 'Sorghum', 'Millet', 'Groundnuts', 'Cowpeas', 'Green Grams', 'Napier Grass'];
const fieldStatuses = ['fallow', 'planted', 'growing', 'ready_harvest'];
const soilTypes = ['Loam', 'Clay', 'Sandy', 'Silty', 'Black Cotton'];

export function Crops() {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [showCropModal, setShowCropModal] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [selectedField, setSelectedField] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [tempPhotoId, setTempPhotoId] = useState(null);
    const [fieldForm, setFieldForm] = useState({ name: '', sizeAcres: '', location: '', soilType: '', status: 'fallow', notes: '' });
    const [cropForm, setCropForm] = useState({ cropType: '', variety: '', plantingDate: new Date().toISOString().split('T')[0], expectedHarvest: '', seedCost: '', fertilizerCost: '', notes: '' });

    useEffect(() => { loadFields(); }, []);

    const loadFields = async () => {
        try {
            const data = await window.go.main.CropsService.GetAllFields();
            setFields(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFieldSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...fieldForm, sizeAcres: parseFloat(fieldForm.sizeAcres) || 0 };
            if (editingField) {
                await window.go.main.CropsService.UpdateField({ ...data, id: editingField.id });
            } else {
                const newField = await window.go.main.CropsService.AddField(data);
                if (newField && tempPhotoId) {
                    await window.go.main.PhotoService.BindPhotos("field", tempPhotoId, newField.id);
                }
            }
            setShowFieldModal(false);
            setEditingField(null);
            setTempPhotoId(null);
            setFieldForm({ name: '', sizeAcres: '', location: '', soilType: '', status: 'fallow', notes: '' });
            loadFields();
        } catch (err) { console.error(err); }
    };

    const handleCropSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.CropsService.AddCropRecord({
                fieldId: selectedField.id,
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
            loadFields();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        setConfirmDelete({ show: true, id });
    };

    const confirmDeleteField = async () => {
        try {
            await window.go.main.CropsService.DeleteField(confirmDelete.id);
            setConfirmDelete({ show: false, id: null });
            loadFields();
        } catch (err) { console.error(err); }
    };

    const openEditField = (field) => {
        setEditingField(field);
        setFieldForm({ name: field.name, sizeAcres: field.sizeAcres.toString(), location: field.location, soilType: field.soilType, status: field.status, notes: field.notes });
        setShowFieldModal(true);
    };

    const openPlantCrop = (field) => {
        setSelectedField(field);
        setShowCropModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'planted': return 'status-planted';
            case 'growing': return 'status-growing';
            case 'ready_harvest': return 'status-harvest';
            default: return 'status-fallow';
        }
    };

    return (
        <div className="crops-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Crops & Fields</h1>
                    <p>Manage your farm fields and crop cycles</p>
                </div>
                <Button icon={Plus} onClick={() => {
                    setEditingField(null);
                    setFieldForm({ name: '', sizeAcres: '', location: '', soilType: '', status: 'fallow', notes: '' });
                    setTempPhotoId(Date.now() * -1);
                    setShowFieldModal(true);
                }}>Add Field</Button>
            </header>

            {loading ? (
                <div className="loading-container"><div className="loading-spinner"></div></div>
            ) : fields.length === 0 ? (
                <Card><EmptyState icon={Wheat} title="No fields registered" description="Add your farm fields to start tracking crops" action={<Button icon={Plus} onClick={() => setShowFieldModal(true)}>Add Field</Button>} /></Card>
            ) : (
                <div className="fields-grid">
                    {fields.map(field => (
                        <Card key={field.id} className="field-card" hover>
                            <div className="field-header">
                                <div className="field-icon"><Sprout size={24} /></div>
                                <div className="field-actions">
                                    <button className="action-btn" title="View/Edit Photos" onClick={() => openEditField(field)}><Camera size={16} /></button>
                                    <button className="action-btn" onClick={() => openEditField(field)}><Edit2 size={16} /></button>
                                    <button className="action-btn delete" onClick={() => handleDelete(field.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <h3 className="field-name">{field.name}</h3>
                            <p className="field-location">{field.location || 'No location set'}</p>
                            <div className="field-meta">
                                <span className="field-size">{field.sizeAcres} acres</span>
                                <span className={`field-status ${getStatusColor(field.status)}`}>{field.status?.replace('_', ' ') || '-'}</span>
                            </div>
                            {field.currentCrop && <div className="current-crop"><Wheat size={14} /> {field.currentCrop}</div>}
                            <div className="field-footer">
                                <Button variant="outline" size="sm" icon={Sprout} onClick={() => openPlantCrop(field)} fullWidth>Plant Crop</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={showFieldModal} onClose={() => setShowFieldModal(false)} title={editingField ? 'Edit Field' : 'Add New Field'} size="md">
                <form onSubmit={handleFieldSubmit}>
                    <FormRow>
                        <FormGroup><Label htmlFor="fieldName" required>Field Name</Label><Input id="fieldName" value={fieldForm.name} onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })} placeholder="e.g., North Plot" required /></FormGroup>
                        <FormGroup><Label htmlFor="size">Size (Acres)</Label><Input id="size" type="number" step="0.1" value={fieldForm.sizeAcres} onChange={(e) => setFieldForm({ ...fieldForm, sizeAcres: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="location">Location</Label><Input id="location" value={fieldForm.location} onChange={(e) => setFieldForm({ ...fieldForm, location: e.target.value })} placeholder="e.g., Near the river" /></FormGroup>
                        <FormGroup><Label htmlFor="soil">Soil Type</Label><Select id="soil" value={fieldForm.soilType} onChange={(e) => setFieldForm({ ...fieldForm, soilType: e.target.value })}><option value="">Select soil type</option>{soilTypes.map(s => <option key={s} value={s}>{s}</option>)}</Select></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="fieldStatus">Status</Label><Select id="fieldStatus" value={fieldForm.status} onChange={(e) => setFieldForm({ ...fieldForm, status: e.target.value })}>{fieldStatuses.map(s => <option key={s} value={s}>{s?.replace('_', ' ').charAt(0).toUpperCase() + s?.replace('_', ' ').slice(1)}</option>)}</Select></FormGroup>
                    <FormGroup><Label htmlFor="fieldNotes">Notes</Label><Textarea id="fieldNotes" value={fieldForm.notes} onChange={(e) => setFieldForm({ ...fieldForm, notes: e.target.value })} rows={2} /></FormGroup>

                    <PhotoGallery
                        entityType="field"
                        entityId={editingField ? editingField.id : tempPhotoId}
                    />

                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowFieldModal(false)}>Cancel</Button><Button type="submit">{editingField ? 'Update' : 'Add'} Field</Button></div>
                </form>
            </Modal>

            <Modal isOpen={showCropModal} onClose={() => setShowCropModal(false)} title={`Plant Crop - ${selectedField?.name}`} size="md">
                <form onSubmit={handleCropSubmit}>
                    <FormRow>
                        <FormGroup><Label htmlFor="cropType" required>Crop Type</Label><Select id="cropType" value={cropForm.cropType} onChange={(e) => setCropForm({ ...cropForm, cropType: e.target.value })} required><option value="">Select crop</option>{cropTypes.map(c => <option key={c} value={c}>{c}</option>)}</Select></FormGroup>
                        <FormGroup><Label htmlFor="variety">Variety</Label><Input id="variety" value={cropForm.variety} onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })} placeholder="e.g., H614D" /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="plantDate" required>Planting Date</Label><Input id="plantDate" type="date" value={cropForm.plantingDate} onChange={(e) => setCropForm({ ...cropForm, plantingDate: e.target.value })} required /></FormGroup>
                        <FormGroup><Label htmlFor="harvestDate">Expected Harvest</Label><Input id="harvestDate" type="date" value={cropForm.expectedHarvest} onChange={(e) => setCropForm({ ...cropForm, expectedHarvest: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="seedCost">Seed Cost (KES)</Label><Input id="seedCost" type="number" value={cropForm.seedCost} onChange={(e) => setCropForm({ ...cropForm, seedCost: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="fertCost">Fertilizer Cost (KES)</Label><Input id="fertCost" type="number" value={cropForm.fertilizerCost} onChange={(e) => setCropForm({ ...cropForm, fertilizerCost: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="cropNotes">Notes</Label><Textarea id="cropNotes" value={cropForm.notes} onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowCropModal(false)}>Cancel</Button><Button type="submit">Plant Crop</Button></div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={confirmDeleteField}
                title="Delete Field"
                message="Are you sure you want to delete this field? This will also remove all associated crop cycles and history."
                type="danger"
                confirmText="Delete Field"
            />
        </div>
    );
}
