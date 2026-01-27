import React, { useState, useEffect, useRef } from 'react';
import { Plus, Coffee, Edit2, Trash2, Calendar, ClipboardList, Utensils } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from 'sonner';
import './Feed.css';

const feedingTimes = ['morning', 'afternoon', 'evening'];

export function Feed() {
    const [feedTypes, setFeedTypes] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], feedTypeId: '', quantityKg: '', animalIds: [], selectAll: false, animalCount: '', feedingTime: 'morning', notes: '' });
    const [selectedFeedUnit, setSelectedFeedUnit] = useState('kg');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const getSelectedFeedUnit = (feedTypeId) => {
        if (!feedTypeId) return 'kg';
        const selectedFeed = feedTypes.find(ft => ft.id === parseInt(feedTypeId));
        return selectedFeed?.unit || 'kg';
    };

    const resetForm = () => {
        setFormData({ date: new Date().toISOString().split('T')[0], feedTypeId: '', quantityKg: '', animalIds: [], selectAll: false, animalCount: '', feedingTime: 'morning', notes: '' });
        setSelectedFeedUnit('kg');
        setEditingRecord(null);
        setIsDropdownOpen(false);
    };

    const itemsPerPage = 10;
    const paginatedRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { loadData(); }, []);
    
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
            const [inventory, feeds, animalsList] = await Promise.all([
                window.go.main.InventoryService.GetAllInventory(),
                window.go.main.FeedService.GetFeedRecords('', ''),
                window.go.main.LivestockService.GetAllAnimals()
            ]);
            // Filter inventory for items in the 'feed' category
            const feedInventory = (inventory || []).filter(item => item.category === 'feed');
            setFeedTypes(feedInventory);
            setRecords(feeds || []);
            setAnimals(animalsList || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFeedSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading(editingRecord ? 'Updating feed record...' : 'Adding feed record...');
        try {
            // Use animal IDs length as count if animals are selected, otherwise use manual count
            const animalCount = formData.animalIds.length > 0 ? formData.animalIds.length : (parseInt(formData.animalCount) || 0);
            
            const recordData = {
                date: formData.date,
                feedTypeId: parseInt(formData.feedTypeId),
                quantityKg: parseFloat(formData.quantityKg) || 0,
                unit: selectedFeedUnit,
                animalCount: animalCount,
                feedingTime: formData.feedingTime,
                notes: formData.notes
            };
            
            if (editingRecord) {
                await window.go.main.FeedService.UpdateFeedRecord({ ...recordData, id: editingRecord.id });
                toast.success('Feed record updated', { id: loadingToast });
            } else {
                await window.go.main.FeedService.AddFeedRecord(recordData);
                toast.success('Feed record added', { id: loadingToast });
            }
            
            setShowModal(false);
            setEditingRecord(null);
            resetForm();
            loadData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save feed record', { id: loadingToast });
        }
    };

    const handleDelete = (id) => {
        setConfirmDelete({ show: true, id });
    };

    const confirmDeleteRecord = async () => {
        const loadingToast = toast.loading('Deleting feed record...');
        try {
            await window.go.main.FeedService.DeleteFeedRecord(confirmDelete.id);
            toast.success('Feed record deleted', { id: loadingToast });
            setConfirmDelete({ show: false, id: null });
            loadData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete feed record', { id: loadingToast });
        }
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        const unit = getSelectedFeedUnit(record.feedTypeId);
        setSelectedFeedUnit(unit);
        setFormData({
            date: record.date,
            feedTypeId: record.feedTypeId.toString(),
            quantityKg: record.quantityKg.toString(),
            animalIds: [],  // Reset animal selection for editing
            selectAll: false,
            animalCount: record.animalCount.toString(),
            feedingTime: record.feedingTime,
            notes: record.notes || ''
        });
        setShowModal(true);
    };


    return (
        <div className="feed-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Feed Management</h1>
                    <p>Track daily feeding records and monitor stock levels</p>
                </div>
                <div className="page-actions">
                    <Button icon={Plus} onClick={() => setShowModal(true)}>Record Feeding</Button>
                </div>
            </header>

            <Card padding="none" className="records-card">
                <div className="card-header-bar">
                    <h3>Feeding Records</h3>
                </div>
                {records.length === 0 ? (
                    <EmptyState icon={Utensils} title="No feeding records" description="Start recording daily feeding" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Feed Type</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Animals</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRecords.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-mono">{new Date(record.date).toLocaleDateString('en-KE')}</TableCell>
                                    <TableCell>{record.feedTypeName}</TableCell>
                                    <TableCell className="font-mono">{record.quantityKg} {record.unit || 'kg'}</TableCell>
                                    <TableCell className="font-mono">{record.animalCount}</TableCell>
                                    <TableCell className="capitalize">{record.feedingTime}</TableCell>
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
                {!loading && records.length > 0 && (
                    <Pagination
                        totalItems={records.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); if (editingRecord) { setEditingRecord(null); resetForm(); } }} title={editingRecord ? "Edit Feed Record" : "Record Feeding"} size="sm">
                <form onSubmit={handleFeedSubmit}>
                    <FormGroup><Label htmlFor="feedDate" required>Date</Label><Input id="feedDate" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></FormGroup>
                    <FormGroup><Label htmlFor="feedType" required>Feed Type</Label><Select id="feedType" value={formData.feedTypeId} onChange={(e) => { const newFeedTypeId = e.target.value; const unit = getSelectedFeedUnit(newFeedTypeId); setFormData({ ...formData, feedTypeId: newFeedTypeId }); setSelectedFeedUnit(unit); }} required><option value="">Select feed</option>{feedTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}</Select></FormGroup>
                    <FormGroup><Label htmlFor="feedQty">Quantity ({selectedFeedUnit})</Label><Input id="feedQty" type="number" step="0.1" value={formData.quantityKg} onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })} /></FormGroup>
                    <FormGroup>
                        <Label htmlFor="animals">Animals Fed</Label>
                        <div className="multi-select-dropdown" ref={dropdownRef}>
                            <button
                                type="button"
                                className="multi-select-trigger"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="multi-select-value">
                                    {formData.animalIds.length === 0 ? (
                                        <span className="placeholder-text">Select animals... (or leave empty)</span>
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
                        {formData.animalIds.length > 0 && (
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                {formData.animalIds.length} animal{formData.animalIds.length !== 1 ? 's' : ''} selected
                            </p>
                        )}
                    </FormGroup>
                    <FormGroup><Label htmlFor="feedTime">Feeding Time</Label><Select id="feedTime" value={formData.feedingTime} onChange={(e) => setFormData({ ...formData, feedingTime: e.target.value })}>{feedingTimes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</Select></FormGroup>
                    <FormGroup><Label htmlFor="feedNotes">Notes</Label><Textarea id="feedNotes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editingRecord ? 'Update Record' : 'Save Record'}</Button></div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={confirmDeleteRecord}
                title="Delete Feed Record"
                message="Are you sure you want to delete this feeding record? This action cannot be undone."
                type="danger"
                confirmText="Delete Record"
            />
        </div>
    );
}
