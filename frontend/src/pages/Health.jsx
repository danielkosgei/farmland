import React, { useState, useEffect } from 'react';
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
import './Health.css';

const recordTypes = ['treatment', 'vaccination', 'checkup', 'deworming', 'artificial_insemination', 'pregnancy_check', 'hoof_trimming'];

export function Health() {
    const [records, setRecords] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [formData, setFormData] = useState({ animalId: '', date: new Date().toISOString().split('T')[0], recordType: 'treatment', description: '', diagnosis: '', treatment: '', medicine: '', dosage: '', vetName: '', cost: '', nextDueDate: '', notes: '' });
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;
    const paginatedRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { loadData(); }, []);

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
        const loadingToast = toast.loading('Saving health record...');
        try {
            const cost = parseFloat(formData.cost) || 0;
            await window.go.main.HealthService.AddVetRecord({
                animalId: parseInt(formData.animalId),
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

            const financialMsg = cost > 0 ? ' & added to Finances' : '';
            toast.success(`Health record saved${financialMsg}`, { id: loadingToast });

            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save health record', { id: loadingToast });
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

    const resetForm = () => setFormData({ animalId: '', date: new Date().toISOString().split('T')[0], recordType: 'treatment', description: '', diagnosis: '', treatment: '', medicine: '', dosage: '', vetName: '', cost: '', nextDueDate: '', notes: '' });

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
                                <span className="upcoming-type">{item.recordType?.replace('_', ' ') || '-'}</span>
                                <span className="upcoming-date">{new Date(item.nextDueDate).toLocaleDateString('en-KE')}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

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
                                <TableHead>Medicine</TableHead>
                                <TableHead>Vet</TableHead>
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
                                            {getTypeIcon(record.recordType)} {record.recordType?.replace('_', ' ') || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{record.medicine || '-'}</TableCell>
                                    <TableCell>{record.vetName || '-'}</TableCell>
                                    <TableCell className="font-mono">KES {record.cost || 0}</TableCell>
                                    <TableCell>
                                        <button className="action-btn delete" onClick={() => handleDelete(record.id)}><Trash2 size={16} /></button>
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Health Record" size="lg">
                <form onSubmit={handleSubmit}>
                    <FormRow>
                        <FormGroup><Label htmlFor="animal" required>Animal</Label><Select id="animal" value={formData.animalId} onChange={(e) => setFormData({ ...formData, animalId: e.target.value })} required><option value="">Select animal</option>{animals.map(a => <option key={a.id} value={a.id}>{a.name} {a.tagNumber ? `(#${a.tagNumber})` : ''}</option>)}</Select></FormGroup>
                        <FormGroup><Label htmlFor="recDate" required>Date</Label><Input id="recDate" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="recType">Record Type</Label><Select id="recType" value={formData.recordType} onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}>{recordTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ').charAt(0).toUpperCase() + t.replace('_', ' ').slice(1)}</option>)}</Select></FormGroup>
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
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save Record</Button></div>
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
