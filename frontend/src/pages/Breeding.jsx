import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Baby, Calendar, Heart, AlertCircle } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import './Breeding.css';

export function Breeding() {
    const [records, setRecords] = useState([]);
    const [pregnantAnimals, setPregnantAnimals] = useState([]);
    const [femaleAnimals, setFemaleAnimals] = useState([]);
    const [maleAnimals, setMaleAnimals] = useState([]);
    const [allAnimals, setAllAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBirthModal, setShowBirthModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [selectedBreeding, setSelectedBreeding] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [formData, setFormData] = useState({
        femaleId: '',
        maleId: '',
        breedingDate: new Date().toISOString().split('T')[0],
        breedingMethod: 'natural',
        sireSource: '',
        expectedDueDate: '',
        pregnancyStatus: 'pending',
        notes: ''
    });
    const [birthData, setBirthData] = useState({
        offspringId: '',
        actualBirthDate: new Date().toISOString().split('T')[0]
    });
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;
    const paginatedRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [breedingRecords, pregnant, females, males, animals] = await Promise.all([
                window.go.main.BreedingService.GetAllBreedingRecords(),
                window.go.main.BreedingService.GetPregnantAnimals(),
                window.go.main.LivestockService.GetFemaleAnimals(),
                window.go.main.LivestockService.GetMaleAnimals(),
                window.go.main.LivestockService.GetAllAnimals()
            ]);
            setRecords(breedingRecords || []);
            setPregnantAnimals(pregnant || []);
            setFemaleAnimals(females || []);
            setMaleAnimals(males || []);
            setAllAnimals(animals || []);
        } catch (err) {
            console.error('Failed to load breeding data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const record = {
                femaleId: parseInt(formData.femaleId),
                maleId: formData.maleId ? parseInt(formData.maleId) : null,
                breedingDate: formData.breedingDate,
                breedingMethod: formData.breedingMethod,
                sireSource: formData.sireSource,
                expectedDueDate: formData.expectedDueDate,
                pregnancyStatus: formData.pregnancyStatus,
                notes: formData.notes
            };

            if (editingRecord) {
                await window.go.main.BreedingService.UpdateBreedingRecord({ ...record, id: editingRecord.id });
            } else {
                await window.go.main.BreedingService.AddBreedingRecord(record);
            }
            setShowAddModal(false);
            setEditingRecord(null);
            resetForm();
            loadData();
        } catch (err) {
            console.error('Failed to save breeding record:', err);
        }
    };

    const handleRecordBirth = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.BreedingService.RecordBirth(
                selectedBreeding.id,
                parseInt(birthData.offspringId),
                birthData.actualBirthDate
            );
            setShowBirthModal(false);
            setSelectedBreeding(null);
            setBirthData({ offspringId: '', actualBirthDate: new Date().toISOString().split('T')[0] });
            loadData();
        } catch (err) {
            console.error('Failed to record birth:', err);
        }
    };

    const handleDelete = async (id) => {
        setConfirmDelete({ show: true, id });
    };

    const confirmDeleteBreeding = async () => {
        try {
            await window.go.main.BreedingService.DeleteBreedingRecord(confirmDelete.id);
            setConfirmDelete({ show: false, id: null });
            loadData();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await window.go.main.BreedingService.UpdatePregnancyStatus(id, status);
            loadData();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        setFormData({
            femaleId: record.femaleId?.toString() || '',
            maleId: record.maleId?.toString() || '',
            breedingDate: record.breedingDate || '',
            breedingMethod: record.breedingMethod || 'natural',
            sireSource: record.sireSource || '',
            expectedDueDate: record.expectedDueDate || '',
            pregnancyStatus: record.pregnancyStatus || 'pending',
            notes: record.notes || ''
        });
        setShowAddModal(true);
    };

    const openBirthModal = (record) => {
        setSelectedBreeding(record);
        setBirthData({ offspringId: '', actualBirthDate: new Date().toISOString().split('T')[0] });
        setShowBirthModal(true);
    };

    const resetForm = () => {
        setFormData({
            femaleId: '',
            maleId: '',
            breedingDate: new Date().toISOString().split('T')[0],
            breedingMethod: 'natural',
            sireSource: '',
            expectedDueDate: '',
            pregnancyStatus: 'pending',
            notes: ''
        });
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            pending: 'status-pending',
            confirmed: 'status-confirmed',
            failed: 'status-failed',
            delivered: 'status-delivered'
        };
        return <span className={`status-badge ${statusColors[status] || ''}`}>{status}</span>;
    };

    const getDaysUntilDue = (dueDate) => {
        if (!dueDate) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) return <span className="overdue">Overdue by {Math.abs(diff)} days</span>;
        if (diff <= 7) return <span className="due-soon">{diff} days</span>;
        return <span>{diff} days</span>;
    };

    // Filter calves for birth recording
    const calves = allAnimals.filter(a => a.type === 'calf' && !a.motherId);

    if (loading) return <div className="page-loading">Loading...</div>;

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Breeding & Pregnancy</h1>
                    <p>Track breeding events and monitor pregnancies</p>
                </div>
                <Button icon={Plus} onClick={() => { resetForm(); setEditingRecord(null); setShowAddModal(true); }}>
                    Record Breeding
                </Button>
            </div>

            {/* Pregnant Animals Alert */}
            {pregnantAnimals.length > 0 && (
                <Card className="pregnant-alert">
                    <CardHeader>
                        <CardTitle><AlertCircle size={20} /> Active Pregnancies ({pregnantAnimals.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="pregnant-list">
                            {pregnantAnimals.map(p => (
                                <div key={p.id} className="pregnant-item">
                                    <div className="pregnant-info">
                                        <strong>{p.femaleName}</strong>
                                        <span className="breeding-method">{p.breedingMethod === 'artificial_insemination' ? 'AI' : 'Natural'}</span>
                                        {getStatusBadge(p.pregnancyStatus)}
                                    </div>
                                    <div className="pregnant-due">
                                        <Calendar size={14} />
                                        Due: {p.expectedDueDate || 'Not set'} {getDaysUntilDue(p.expectedDueDate)}
                                    </div>
                                    <div className="pregnant-actions">
                                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(p.id, 'confirmed')}>
                                            Confirm
                                        </Button>
                                        <Button size="sm" variant="primary" icon={Baby} onClick={() => openBirthModal(p)}>
                                            Record Birth
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Breeding History */}
            <Card>
                <CardHeader>
                    <CardTitle>Breeding History</CardTitle>
                </CardHeader>
                <CardContent>
                    {records.length === 0 ? (
                        <EmptyState
                            icon={Heart}
                            title="No breeding records"
                            description="Start tracking breeding events for your livestock"
                            action={<Button icon={Plus} onClick={() => setShowAddModal(true)}>Record First Breeding</Button>}
                        />
                    ) : (
                        <div className="table-wrapper">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Female</TableHead>
                                        <TableHead>Male/Sire</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Offspring</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedRecords.map(record => (
                                        <TableRow key={record.id}>
                                            <TableCell><span className="font-bold text-neutral-900">{record.femaleName}</span></TableCell>
                                            <TableCell>{record.maleName || record.sireSource || '-'}</TableCell>
                                            <TableCell className="font-mono">{record.breedingDate}</TableCell>
                                            <TableCell>{record.breedingMethod === 'artificial_insemination' ? 'AI' : 'Natural'}</TableCell>
                                            <TableCell>{getStatusBadge(record.pregnancyStatus)}</TableCell>
                                            <TableCell className="font-mono">{record.expectedDueDate || '-'}</TableCell>
                                            <TableCell>{record.offspringName || '-'}</TableCell>
                                            <TableCell>
                                                <div className="action-buttons">
                                                    <button className="icon-btn" onClick={() => openEditModal(record)} title="Edit">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="icon-btn danger" onClick={() => handleDelete(record.id)} title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                totalItems={records.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingRecord(null); }} title={editingRecord ? 'Edit Breeding Record' : 'Record Breeding'}>
                <form onSubmit={handleSubmit}>
                    <FormRow>
                        <FormGroup>
                            <Label required>Female</Label>
                            <Select value={formData.femaleId} onChange={e => setFormData({ ...formData, femaleId: e.target.value })} required>
                                <option value="">Select female</option>
                                {femaleAnimals.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.tagNumber || a.type})</option>
                                ))}
                            </Select>
                        </FormGroup>
                        <FormGroup>
                            <Label>Breeding Method</Label>
                            <Select value={formData.breedingMethod} onChange={e => setFormData({ ...formData, breedingMethod: e.target.value })}>
                                <option value="natural">Natural</option>
                                <option value="artificial_insemination">Artificial Insemination (AI)</option>
                            </Select>
                        </FormGroup>
                    </FormRow>

                    {formData.breedingMethod === 'natural' ? (
                        <FormGroup>
                            <Label>Male (Bull)</Label>
                            <Select value={formData.maleId} onChange={e => setFormData({ ...formData, maleId: e.target.value })}>
                                <option value="">Select male</option>
                                {maleAnimals.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.tagNumber || a.type})</option>
                                ))}
                            </Select>
                        </FormGroup>
                    ) : (
                        <FormGroup>
                            <Label>Sire Source / Bull Name</Label>
                            <Input value={formData.sireSource} onChange={e => setFormData({ ...formData, sireSource: e.target.value })} placeholder="e.g., KARI Bull #123" />
                        </FormGroup>
                    )}

                    <FormRow>
                        <FormGroup>
                            <Label required>Breeding Date</Label>
                            <Input type="date" value={formData.breedingDate} onChange={e => setFormData({ ...formData, breedingDate: e.target.value })} required />
                        </FormGroup>
                        <FormGroup>
                            <Label>Expected Due Date</Label>
                            <Input type="date" value={formData.expectedDueDate} onChange={e => setFormData({ ...formData, expectedDueDate: e.target.value })} />
                        </FormGroup>
                    </FormRow>

                    <FormGroup>
                        <Label>Status</Label>
                        <Select value={formData.pregnancyStatus} onChange={e => setFormData({ ...formData, pregnancyStatus: e.target.value })}>
                            <option value="pending">Pending Confirmation</option>
                            <option value="confirmed">Confirmed Pregnant</option>
                            <option value="failed">Failed/Not Pregnant</option>
                            <option value="delivered">Delivered</option>
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <Label>Notes</Label>
                        <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                    </FormGroup>

                    <div className="modal-actions">
                        <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); setEditingRecord(null); }}>Cancel</Button>
                        <Button type="submit">{editingRecord ? 'Save Changes' : 'Record Breeding'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Birth Recording Modal */}
            <Modal isOpen={showBirthModal} onClose={() => setShowBirthModal(false)} title="Record Birth">
                <form onSubmit={handleRecordBirth}>
                    <p className="birth-info">Recording birth for <strong>{selectedBreeding?.femaleName}</strong></p>

                    <FormGroup>
                        <Label required>Select Calf</Label>
                        <Select value={birthData.offspringId} onChange={e => setBirthData({ ...birthData, offspringId: e.target.value })} required>
                            <option value="">Select the newborn calf</option>
                            {calves.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.tagNumber || 'No tag'})</option>
                            ))}
                        </Select>
                        <small>Select an existing calf record, or add a new calf first in Livestock.</small>
                    </FormGroup>

                    <FormGroup>
                        <Label required>Birth Date</Label>
                        <Input type="date" value={birthData.actualBirthDate} onChange={e => setBirthData({ ...birthData, actualBirthDate: e.target.value })} required />
                    </FormGroup>

                    <div className="modal-actions">
                        <Button type="button" variant="outline" onClick={() => setShowBirthModal(false)}>Cancel</Button>
                        <Button type="submit" icon={Baby}>Record Birth</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={confirmDeleteBreeding}
                title="Delete Breeding Record"
                message="Are you sure you want to delete this breeding record? This will also remove any associated pregnancy monitoring history."
                type="danger"
                confirmText="Delete Record"
            />
        </div>
    );
}
