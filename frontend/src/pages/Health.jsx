import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Heart, Activity, Calendar, AlertCircle, Syringe } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { formatLabel } from '../utils/formatting';
import './Health.css';

const recordTypes = ['treatment', 'vaccination', 'checkup', 'deworming', 'artificial_insemination', 'pregnancy_check', 'hoof_trimming'];

export function Health() {
    const [records, setRecords] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [formData, setFormData] = useState({ animalIds: [], selectAll: false, date: new Date().toISOString().split('T')[0], recordType: 'treatment', description: '', diagnosis: '', treatment: '', medicine: '', dosage: '', vetName: '', cost: '', nextDueDate: '', notes: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const dropdownRef = useRef(null);

    const itemsPerPage = 10;
    
    // Filter records based on search term and record type
    const filteredRecords = records.filter(record => {
        const matchesSearch = searchTerm === '' || 
            record.animalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.medicine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.vetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterType === 'all' || record.recordType === filterType;
        
        return matchesSearch && matchesFilter;
    });
    
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { loadData(); }, []);
    
    // Reset pagination when search/filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isDropdownOpen]);

    const loadData = async () => {
        try {
            const [recs, anims, upcom] = await Promise.all([
                window.go.main.HealthService.GetVetRecords(0),
                window.go.main.LivestockService.GetAllAnimals(),
                window.go.main.HealthService.GetUpcomingVaccinations()
            ]);
            setRecords(recs || []);
            setAnimals(anims || []);
            setUpcoming(upcom || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (editingRecord) {
            // Update existing record
            const loadingToast = toast.loading('Updating health record...');
            try {
                const cost = parseFloat(formData.cost) || 0;
                await window.go.main.HealthService.UpdateVetRecord({
                    id: editingRecord.id,
                    animalId: formData.animalIds[0],
                    date: formData.date,
                    recordType: formData.recordType,
                    description: formData.description,
                    diagnosis: formData.diagnosis,
                    treatment: formData.treatment,
                    medicine: formData.medicine,
                    dosage: formData.dosage,
                    vetName: formData.vetName,
                    cost: cost,
                    nextDueDate: formData.nextDueDate,
                    notes: formData.notes
                });
                
                toast.success('Health record updated', { id: loadingToast });
                setShowModal(false);
                setEditingRecord(null);
                resetForm();
                loadData();
            } catch (err) {
                console.error(err);
                toast.error('Failed to update health record', { id: loadingToast });
            }
        } else {
            // Add new records
            if (formData.animalIds.length === 0) {
                toast.error('Please select at least one animal');
                return;
            }
            
            const loadingToast = toast.loading(
                `Saving health record for ${formData.animalIds.length} animal${formData.animalIds.length !== 1 ? 's' : ''}...`
            );
            
            try {
                const cost = parseFloat(formData.cost) || 0;
                
                // Create a record for each selected animal
                const promises = formData.animalIds.map((animalId, index) => 
                    window.go.main.HealthService.AddVetRecord({
                        animalId: animalId,
                        date: formData.date,
                        recordType: formData.recordType,
                        description: formData.description,
                        diagnosis: formData.diagnosis,
                        treatment: formData.treatment,
                        medicine: formData.medicine,
                        dosage: formData.dosage,
                        vetName: formData.vetName,
                        cost: index === 0 ? cost : 0,  // Only first animal gets the cost
                        nextDueDate: formData.nextDueDate,
                        notes: formData.notes
                    })
                );
                
                await Promise.all(promises);
                
                const financialMsg = cost > 0 ? ' & added to Finances' : '';
                toast.success(
                    `${formData.animalIds.length} health record${formData.animalIds.length !== 1 ? 's' : ''} saved${financialMsg}`, 
                    { id: loadingToast }
                );
                
                setShowModal(false);
                resetForm();
                loadData();
            } catch (err) {
                console.error(err);
                toast.error('Failed to save health records', { id: loadingToast });
            }
        }
    };

    const handleDelete = async (id) => {
        setConfirmDelete({ show: true, id });
    };

    const confirmDeleteRecord = async () => {
        try {
            await window.go.main.HealthService.DeleteVetRecord(confirmDelete.id);
            setConfirmDelete({ show: false, id: null });
            loadData();
        } catch (err) { console.error(err); }
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        setFormData({
            animalIds: [record.animalId],
            selectAll: false,
            date: record.date,
            recordType: record.recordType,
            description: record.description || '',
            diagnosis: record.diagnosis || '',
            treatment: record.treatment || '',
            medicine: record.medicine || '',
            dosage: record.dosage || '',
            vetName: record.vetName || '',
            cost: record.cost ? record.cost.toString() : '',
            nextDueDate: record.nextDueDate || '',
            notes: record.notes || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ animalIds: [], selectAll: false, date: new Date().toISOString().split('T')[0], recordType: 'treatment', description: '', diagnosis: '', treatment: '', medicine: '', dosage: '', vetName: '', cost: '', nextDueDate: '', notes: '' });
        setEditingRecord(null);
        setIsDropdownOpen(false);
    };

    const getTypeIcon = (type) => {
        if (type === 'vaccination' || type === 'deworming') return '💉';
        if (type === 'checkup') return '🩺';
        if (type === 'pregnancy_check') return '🐄';
        return '💊';
    };

    return (
        <div className="health-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Health & Vet Records</h1>
                    <p>Track treatments, vaccinations, and veterinary visits</p>
                </div>
                <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>Add Record</Button>
            </header>

            {upcoming.length > 0 && (
                <Card className="upcoming-card">
                    <div className="upcoming-header"><Syringe size={20} /> Upcoming Vaccinations / Follow-ups</div>
                    <div className="upcoming-list">
                        {upcoming.slice(0, 5).map(item => (
                            <div key={item.id} className="upcoming-item">
                                <span className="upcoming-animal">{item.animalName}</span>
                                <span className="upcoming-type">{formatLabel(item.recordType)}</span>
                                <span className="upcoming-date">{new Date(item.nextDueDate).toLocaleDateString('en-KE')}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text"
                        placeholder="Search by animal, medicine, vet, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        minWidth: '180px'
                    }}
                >
                    <option value="all">All Types</option>
                    {recordTypes.map(type => (
                        <option key={type} value={type}>{formatLabel(type)}</option>
                    ))}
                </select>
            </div>

            <Card padding="none">
                {loading ? (
                    <div className="loading-container"><div className="loading-spinner"></div></div>
                ) : records.length === 0 ? (
                    <EmptyState icon={Heart} title="No health records" description="Add treatments, vaccinations, and vet visits" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add Record</Button>} />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Animal</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Medicine</TableHead>
                                <TableHead>Vet</TableHead>
                                <TableHead>Next Due</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRecords.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-mono">{new Date(record.date).toLocaleDateString('en-KE')}</TableCell>
                                    <TableCell className="font-medium">{record.animalName}</TableCell>
                                    <TableCell>
                                        <span className={`type-badge type-${record.recordType}`}>
                                            {getTypeIcon(record.recordType)} {formatLabel(record.recordType)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span style={{ 
                                            display: 'block', 
                                            maxWidth: '200px', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap' 
                                        }} title={record.description || '-'}>
                                            {record.description || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{record.medicine || '-'}</TableCell>
                                    <TableCell>{record.vetName || '-'}</TableCell>
                                    <TableCell className="font-mono">
                                        {record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString('en-KE') : '-'}
                                    </TableCell>
                                    <TableCell className="font-mono">KES {record.cost || 0}</TableCell>
                                    <TableCell>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="action-btn" onClick={() => openEditModal(record)}><Edit2 size={16} /></button>
                                            <button className="action-btn delete" onClick={() => handleDelete(record.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {!loading && filteredRecords.length > 0 && (
                    <Pagination
                        totalItems={filteredRecords.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); if (editingRecord) { setEditingRecord(null); resetForm(); } }} title={editingRecord ? "Edit Health Record" : "Add Health Record"} size="lg">
                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label htmlFor="animals" required>Animals</Label>
                        {editingRecord && <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Animal cannot be changed when editing a record</p>}
                        <div className="multi-select-dropdown" ref={dropdownRef}>
                            <button
                                type="button"
                                className="multi-select-trigger"
                                onClick={() => !editingRecord && setIsDropdownOpen(!isDropdownOpen)}
                                disabled={editingRecord}
                                style={editingRecord ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                            >
                                <div className="multi-select-value">
                                    {formData.animalIds.length === 0 ? (
                                        <span className="placeholder-text">Select animals...</span>
                                    ) : (
                                        <div className="selected-animals-chips">
                                            {formData.animalIds.map(animalId => {
                                                const animal = animals.find(a => a.id === animalId);
                                                return animal ? (
                                                    <span key={animalId} className="animal-chip">
                                                        <span className="animal-chip-name">{animal.name}</span>
                                                        <button
                                                            type="button"
                                                            className="animal-chip-remove"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newAnimalIds = formData.animalIds.filter(id => id !== animalId);
                                                                setFormData({
                                                                    ...formData,
                                                                    animalIds: newAnimalIds,
                                                                    selectAll: newAnimalIds.length === animals.length
                                                                });
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                                <svg className={`multi-select-arrow ${isDropdownOpen ? 'open' : ''}`} width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            
                            {isDropdownOpen && (
                                <div className="multi-select-options">
                                    <div className="select-all-option">
                                        <label className="checkbox-label">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.selectAll}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFormData({ 
                                                        ...formData, 
                                                        selectAll: checked,
                                                        animalIds: checked ? animals.map(a => a.id) : []
                                                    });
                                                }}
                                            />
                                            <span className="select-all-text">Select All Animals</span>
                                        </label>
                                    </div>
                                    <div className="animals-checkbox-list">
                                        {animals.map(a => (
                                            <label key={a.id} className="animal-checkbox-item">
                                                <input 
                                                    type="checkbox"
                                                    checked={formData.animalIds.includes(a.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        let newAnimalIds;
                                                        if (checked) {
                                                            newAnimalIds = [...formData.animalIds, a.id];
                                                        } else {
                                                            newAnimalIds = formData.animalIds.filter(id => id !== a.id);
                                                        }
                                                        setFormData({ 
                                                            ...formData, 
                                                            animalIds: newAnimalIds,
                                                            selectAll: newAnimalIds.length === animals.length
                                                        });
                                                    }}
                                                />
                                                <span className="animal-name">{a.name}</span>
                                                {a.tagNumber && <span className="animal-tag">#{a.tagNumber}</span>}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormGroup>
                    <FormGroup><Label htmlFor="recDate" required>Date</Label><Input id="recDate" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="recType">Record Type</Label><Select id="recType" value={formData.recordType} onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}>{recordTypes.map(t => <option key={t} value={t}>{formatLabel(t)}</option>)}</Select></FormGroup>
                        <FormGroup><Label htmlFor="vetName">Vet Name</Label><Input id="vetName" value={formData.vetName} onChange={(e) => setFormData({ ...formData, vetName: e.target.value })} placeholder="Dr. Name" /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="description">Description / Symptoms</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="diagnosis">Diagnosis</Label><Input id="diagnosis" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="treatment">Treatment</Label><Input id="treatment" value={formData.treatment} onChange={(e) => setFormData({ ...formData, treatment: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="medicine">Medicine</Label><Input id="medicine" value={formData.medicine} onChange={(e) => setFormData({ ...formData, medicine: e.target.value })} placeholder="e.g., Oxytetracycline" /></FormGroup>
                        <FormGroup><Label htmlFor="dosage">Dosage</Label><Input id="dosage" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} placeholder="e.g., 5ml" /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="cost">Cost (KES)</Label><Input id="cost" type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="nextDue">Next Due Date</Label><Input id="nextDue" type="date" value={formData.nextDueDate} onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="healthNotes">Notes</Label><Textarea id="healthNotes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editingRecord ? 'Update Record' : 'Save Record'}</Button></div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={confirmDeleteRecord}
                title="Delete Health Record"
                message="Are you sure you want to delete this veterinary record? This action cannot be undone."
                type="danger"
                confirmText="Delete Record"
            />
        </div>
    );
}
