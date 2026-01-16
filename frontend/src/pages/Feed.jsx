import React, { useState, useEffect } from 'react';
import { Plus, Utensils } from 'lucide-react';
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
    const [feedRecords, setFeedRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [feedForm, setFeedForm] = useState({ date: new Date().toISOString().split('T')[0], feedTypeId: '', quantityKg: '', animalCount: '', feedingTime: 'morning', notes: '' });

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
            setFeedRecords(feeds || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFeedSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.FeedService.AddFeedRecord({
                date: feedForm.date,
                feedTypeId: parseInt(feedForm.feedTypeId),
                quantityKg: parseFloat(feedForm.quantityKg) || 0,
                animalCount: parseInt(feedForm.animalCount) || 0,
                feedingTime: feedForm.feedingTime,
                notes: feedForm.notes
            });
            setShowFeedModal(false);
            setFeedForm({ date: new Date().toISOString().split('T')[0], feedTypeId: '', quantityKg: '', animalCount: '', feedingTime: 'morning', notes: '' });
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
                    <Button icon={Plus} onClick={() => setShowFeedModal(true)}>Record Feeding</Button>
                </div>
            </header>

            <Card padding="none" className="records-card">
                <div className="card-header-bar">
                    <h3>Feeding Records</h3>
                </div>
                {feedRecords.length === 0 ? (
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
                            {feedRecords.slice(0, 10).map(record => (
                                <TableRow key={record.id}>
                                    <TableCell>{new Date(record.date).toLocaleDateString('en-KE')}</TableCell>
                                    <TableCell>{record.feedTypeName}</TableCell>
                                    <TableCell>{record.quantityKg} kg</TableCell>
                                    <TableCell>{record.animalCount}</TableCell>
                                    <TableCell className="capitalize">{record.feedingTime}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <Modal isOpen={showFeedModal} onClose={() => setShowFeedModal(false)} title="Record Feeding" size="sm">
                <form onSubmit={handleFeedSubmit}>
                    <FormGroup><Label htmlFor="feedDate" required>Date</Label><Input id="feedDate" type="date" value={feedForm.date} onChange={(e) => setFeedForm({ ...feedForm, date: e.target.value })} required /></FormGroup>
                    <FormGroup><Label htmlFor="feedType" required>Feed Type</Label><Select id="feedType" value={feedForm.feedTypeId} onChange={(e) => setFeedForm({ ...feedForm, feedTypeId: e.target.value })} required><option value="">Select feed</option>{feedTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}</Select></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="feedQty">Quantity (kg)</Label><Input id="feedQty" type="number" step="0.1" value={feedForm.quantityKg} onChange={(e) => setFeedForm({ ...feedForm, quantityKg: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="animalCnt">Animals Fed</Label><Input id="animalCnt" type="number" value={feedForm.animalCount} onChange={(e) => setFeedForm({ ...feedForm, animalCount: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="feedTime">Feeding Time</Label><Select id="feedTime" value={feedForm.feedingTime} onChange={(e) => setFeedForm({ ...feedForm, feedingTime: e.target.value })}>{feedingTimes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</Select></FormGroup>
                    <FormGroup><Label htmlFor="feedNotes">Notes</Label><Textarea id="feedNotes" value={feedForm.notes} onChange={(e) => setFeedForm({ ...feedForm, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowFeedModal(false)}>Cancel</Button><Button type="submit">Save Record</Button></div>
                </form>
            </Modal>
        </div>
    );
}
