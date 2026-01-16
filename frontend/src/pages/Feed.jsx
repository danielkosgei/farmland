import React, { useState, useEffect } from 'react';
import { Plus, Coffee, Edit2, Trash2, Calendar, ClipboardList, Utensils } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import './Feed.css';

const feedingTimes = ['morning', 'afternoon', 'evening'];

export function Feed() {
    const [feedTypes, setFeedTypes] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], feedTypeId: '', quantityKg: '', animalCount: '', feedingTime: 'morning', notes: '' });

    const resetForm = () => setFormData({ date: new Date().toISOString().split('T')[0], feedTypeId: '', quantityKg: '', animalCount: '', feedingTime: 'morning', notes: '' });

    const itemsPerPage = 10;
    const paginatedRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [inventory, feeds] = await Promise.all([
                window.go.main.InventoryService.GetAllInventory(),
                window.go.main.FeedService.GetFeedRecords('', '')
            ]);
            // Filter inventory for items in the 'feed' category
            const feedInventory = (inventory || []).filter(item => item.category === 'feed');
            setFeedTypes(feedInventory);
            setRecords(feeds || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFeedSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.FeedService.AddFeedRecord({
                date: formData.date,
                feedTypeId: parseInt(formData.feedTypeId),
                quantityKg: parseFloat(formData.quantityKg) || 0,
                animalCount: parseInt(formData.animalCount) || 0,
                feedingTime: formData.feedingTime,
                notes: formData.notes
            });
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) { console.error(err); }
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRecords.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-mono">{new Date(record.date).toLocaleDateString('en-KE')}</TableCell>
                                    <TableCell>{record.feedTypeName}</TableCell>
                                    <TableCell className="font-mono">{record.quantityKg} kg</TableCell>
                                    <TableCell className="font-mono">{record.animalCount}</TableCell>
                                    <TableCell className="capitalize">{record.feedingTime}</TableCell>
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Feeding" size="sm">
                <form onSubmit={handleFeedSubmit}>
                    <FormGroup><Label htmlFor="feedDate" required>Date</Label><Input id="feedDate" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></FormGroup>
                    <FormGroup><Label htmlFor="feedType" required>Feed Type</Label><Select id="feedType" value={formData.feedTypeId} onChange={(e) => setFormData({ ...formData, feedTypeId: e.target.value })} required><option value="">Select feed</option>{feedTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}</Select></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="feedQty">Quantity (kg)</Label><Input id="feedQty" type="number" step="0.1" value={formData.quantityKg} onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="animalCnt">Animals Fed</Label><Input id="animalCnt" type="number" value={formData.animalCount} onChange={(e) => setFormData({ ...formData, animalCount: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="feedTime">Feeding Time</Label><Select id="feedTime" value={formData.feedingTime} onChange={(e) => setFormData({ ...formData, feedingTime: e.target.value })}>{feedingTimes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</Select></FormGroup>
                    <FormGroup><Label htmlFor="feedNotes">Notes</Label><Textarea id="feedNotes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save Record</Button></div>
                </form>
            </Modal>
        </div>
    );
}
