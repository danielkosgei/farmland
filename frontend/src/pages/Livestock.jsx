import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Milk, Beef, FileSpreadsheet, Calendar, Info, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { PhotoGallery } from '../components/PhotoGallery';
import { ConfirmDialog, AlertDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';
import './Livestock.css';
import '../components/EntityDetails.css';

const animalTypes = ['cow', 'bull', 'heifer', 'calf'];
const breeds = ['Friesian', 'Ayrshire', 'Jersey', 'Guernsey', 'Sahiwal', 'Boran', 'Mixed'];
const statuses = ['active', 'sold', 'deceased'];

export function Livestock() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMilkModal, setShowMilkModal] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [alert, setAlert] = useState({ show: false, title: '', message: '', type: 'info' });
    const [tempPhotoId, setTempPhotoId] = useState(null);
    const [formData, setFormData] = useState({
        tagNumber: '', name: '', type: 'cow', breed: '', dateOfBirth: '',
        gender: 'female', motherId: null, fatherId: null, status: 'active', notes: ''
    });
    const [milkForm, setMilkForm] = useState({ date: new Date().toISOString().split('T')[0], morningLiters: '', eveningLiters: '', notes: '' });

    useEffect(() => { loadAnimals(); }, []);

    const loadAnimals = async () => {
        try {
            const data = await window.go.main.LivestockService.GetAllAnimals();
            setAnimals(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading(editingAnimal ? 'Updating animal...' : 'Adding animal...');
        try {
            const animalData = {
                ...formData,
                motherId: formData.motherId ? parseInt(formData.motherId) : null,
                fatherId: formData.fatherId ? parseInt(formData.fatherId) : null
            };
            if (editingAnimal) {
                await window.go.main.LivestockService.UpdateAnimal({ ...animalData, id: editingAnimal.id });
                toast.success('Animal record updated', { id: loadingToast });
            } else {
                const newAnimal = await window.go.main.LivestockService.AddAnimal(animalData);
                if (newAnimal && tempPhotoId) {
                    await window.go.main.PhotoService.BindPhotos("animal", tempPhotoId, newAnimal.id);
                }
                toast.success('New animal added', { id: loadingToast });
            }
            setShowModal(false);
            setEditingAnimal(null);
            setTempPhotoId(null);
            resetForm();
            loadAnimals();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save animal record', { id: loadingToast });
        }
    };

    const handleMilkSubmit = async (e) => {
        e.preventDefault();
        const loadingToast = toast.loading('Saving milk record...');
        try {
            await window.go.main.LivestockService.AddMilkRecord({
                animalId: selectedAnimal.id,
                date: milkForm.date,
                morningLiters: parseFloat(milkForm.morningLiters) || 0,
                eveningLiters: parseFloat(milkForm.eveningLiters) || 0,
                notes: milkForm.notes
            });
            toast.success('Milk record saved', { id: loadingToast });
            setShowMilkModal(false);
            setMilkForm({ date: new Date().toISOString().split('T')[0], morningLiters: '', eveningLiters: '', notes: '' });
        } catch (err) {
            console.error(err);
            toast.error('Failed to save milk record', { id: loadingToast });
        }
    };

    const handleDelete = async (id) => {
        setConfirmDelete({ show: true, id });
    };

    const confirmDeleteAnimal = async () => {
        const loadingToast = toast.loading('Removing record...');
        try {
            await window.go.main.LivestockService.DeleteAnimal(confirmDelete.id);
            setConfirmDelete({ show: false, id: null });
            toast.success('Animal record removed', { id: loadingToast });
            loadAnimals();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete animal record', { id: loadingToast });
        }
    };

    const openEdit = (animal) => {
        setEditingAnimal(animal);
        setFormData({
            tagNumber: animal.tagNumber, name: animal.name, type: animal.type,
            breed: animal.breed, dateOfBirth: animal.dateOfBirth, gender: animal.gender,
            motherId: animal.motherId || '', fatherId: animal.fatherId || '',
            status: animal.status, notes: animal.notes
        });
        setShowModal(true);
    };

    const openMilkRecord = (animal, e) => {
        if (e) e.stopPropagation();
        setSelectedAnimal(animal);
        setShowMilkModal(true);
    };

    const handleRowClick = (animal) => {
        navigate(`/livestock/${animal.id}`);
    };

    const resetForm = () => {
        setFormData({
            tagNumber: '', name: '', type: 'cow', breed: '', dateOfBirth: '',
            gender: 'female', motherId: null, fatherId: null, status: 'active', notes: ''
        });
    };

    const filteredAnimals = animals.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tagNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const potentialMothers = animals.filter(a => a.gender === 'female' && a.id !== editingAnimal?.id);
    const potentialFathers = animals.filter(a => a.gender === 'male' && a.id !== editingAnimal?.id);

    const handleExportCSV = async () => {
        const loadingToast = toast.loading('Generating rich inventory CSV...');
        try {
            const res = await window.go.main.ExportService.ExportAnimalsCSV();
            if (res) {
                toast.success(`Exported ${res.records} animals to CSV`, {
                    id: loadingToast,
                    description: `File saved to ${res.path}`
                });
            }
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Failed to export CSV', { id: loadingToast });
        }
    };

    return (
        <div className="livestock-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Livestock</h1>
                    <p>Manage your farm animals and track their records</p>
                </div>
                <div className="page-actions">
                    <Button variant="outline" icon={FileSpreadsheet} onClick={handleExportCSV} title="Generate comprehensive livestock CSV report">Export CSV</Button>
                    <Button icon={Plus} onClick={() => {
                        resetForm();
                        setEditingAnimal(null);
                        setTempPhotoId(Date.now() * -1);
                        setShowModal(true);
                    }}>Add Animal</Button>
                </div>
            </header>

            <Card padding="none" className="livestock-card">
                <div className="livestock-toolbar">
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Search by name or tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="livestock-count">{filteredAnimals.length} animals</div>
                </div>

                {loading ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tag / Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Breed</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map(i => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton variant="text" width="120px" /></TableCell>
                                    <TableCell><Skeleton variant="rounded" width="60px" height="20px" /></TableCell>
                                    <TableCell><Skeleton variant="text" width="80px" /></TableCell>
                                    <TableCell><Skeleton variant="rounded" width="70px" height="20px" /></TableCell>
                                    <TableCell><div className="flex gap-2"><Skeleton variant="circular" width="24px" height="24px" /><Skeleton variant="circular" width="24px" height="24px" /></div></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : filteredAnimals.length === 0 ? (
                    <EmptyState icon={Beef} title="No animals yet" description="Start by adding your first animal to the farm" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add Animal</Button>} />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tag / Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Breed</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAnimals.map(animal => (
                                <TableRow key={animal.id} onClick={() => handleRowClick(animal)} className="clickable-row">
                                    <TableCell>
                                        <div className="animal-info">
                                            <span className="animal-name">{animal.name}</span>
                                            {animal.tagNumber && <span className="animal-tag">#{animal.tagNumber}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell><span className={`type-badge type-${animal.type}`}>{animal.type}</span></TableCell>
                                    <TableCell>{animal.breed || '-'}</TableCell>
                                    <TableCell><span className={`status-badge status-${animal.status}`}>{animal.status}</span></TableCell>
                                    <TableCell>
                                        <div className="action-buttons">
                                            {(animal.gender === 'female' && animal.status === 'active') && (
                                                <button className="action-btn milk" onClick={(e) => openMilkRecord(animal, e)} title="Record milk production"><Milk size={16} /></button>
                                            )}
                                            <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); openEdit(animal); }} title="Edit animal profile"><Edit2 size={16} /></button>
                                            <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(animal.id); }} title="Remove record"><Trash2 size={16} /></button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAnimal ? 'Edit Animal' : 'Add New Animal'} size="md">
                <form onSubmit={handleSubmit}>
                    <FormRow>
                        <FormGroup><Label htmlFor="tagNumber">Tag Number</Label><Input id="tagNumber" value={formData.tagNumber} onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })} placeholder="e.g., A001" /></FormGroup>
                        <FormGroup><Label htmlFor="name" required>Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter name" required /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="type">Type</Label><Select id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>{animalTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</Select></FormGroup>
                        <FormGroup><Label htmlFor="breed">Breed</Label><Select id="breed" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })}><option value="">Select breed</option>{breeds.map(b => <option key={b} value={b}>{b}</option>)}</Select></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="gender">Gender</Label><Select id="gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}><option value="female">Female</option><option value="male">Male</option></Select></FormGroup>
                        <FormGroup><Label htmlFor="dateOfBirth">Date of Birth</Label><Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup>
                            <Label htmlFor="motherId">Mother</Label>
                            <Select id="motherId" value={formData.motherId || ''} onChange={(e) => setFormData({ ...formData, motherId: e.target.value || null })}>
                                <option value="">Unknown / Not specified</option>
                                {potentialMothers.map(a => <option key={a.id} value={a.id}>{a.name} {a.tagNumber ? `(#${a.tagNumber})` : ''}</option>)}
                            </Select>
                        </FormGroup>
                        <FormGroup>
                            <Label htmlFor="fatherId">Father</Label>
                            <Select id="fatherId" value={formData.fatherId || ''} onChange={(e) => setFormData({ ...formData, fatherId: e.target.value || null })}>
                                <option value="">Unknown / Not specified</option>
                                {potentialFathers.map(a => <option key={a.id} value={a.id}>{a.name} {a.tagNumber ? `(#${a.tagNumber})` : ''}</option>)}
                            </Select>
                        </FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="status">Status</Label><Select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>{statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</Select></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional notes..." rows={3} /></FormGroup>

                    <PhotoGallery
                        entityType="animal"
                        entityId={editingAnimal ? editingAnimal.id : tempPhotoId}
                    />

                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editingAnimal ? 'Update' : 'Add'} Animal</Button></div>
                </form>
            </Modal>

            <Modal isOpen={showMilkModal} onClose={() => setShowMilkModal(false)} title={`Record Milk - ${selectedAnimal?.name}`} size="sm">
                <form onSubmit={handleMilkSubmit}>
                    <FormGroup><Label htmlFor="milkDate" required>Date</Label><Input id="milkDate" type="date" value={milkForm.date} onChange={(e) => setMilkForm({ ...milkForm, date: e.target.value })} required /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="morning">Morning (L)</Label><Input id="morning" type="number" step="0.1" value={milkForm.morningLiters} onChange={(e) => setMilkForm({ ...milkForm, morningLiters: e.target.value })} placeholder="0.0" /></FormGroup>
                        <FormGroup><Label htmlFor="evening">Evening (L)</Label><Input id="evening" type="number" step="0.1" value={milkForm.eveningLiters} onChange={(e) => setMilkForm({ ...milkForm, eveningLiters: e.target.value })} placeholder="0.0" /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="milkNotes">Notes</Label><Textarea id="milkNotes" value={milkForm.notes} onChange={(e) => setMilkForm({ ...milkForm, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowMilkModal(false)}>Cancel</Button><Button type="submit">Save Record</Button></div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={confirmDeleteAnimal}
                title="Delete Animal"
                message="Are you sure you want to delete this animal? This action cannot be undone and all associated records (milk, breeding, health) will be removed."
                type="danger"
                confirmText="Delete Animal"
            />

            <AlertDialog
                isOpen={alert.show}
                onClose={() => setAlert({ ...alert, show: false })}
                title={alert.title}
                message={alert.message}
                type={alert.type}
            />
        </div>
    );
}
