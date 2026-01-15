import React, { useState, useEffect } from 'react';
import { Plus, Utensils, Cog } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import './Feed.css';

const feedingTimes = ['morning', 'afternoon', 'evening'];
const grindingMaterials = ['Maize', 'Wheat', 'Sorghum', 'Millet', 'Maize + Wheat Mix'];

export function Feed() {
    const [feedTypes, setFeedTypes] = useState([]);
    const [feedRecords, setFeedRecords] = useState([]);
    const [grindingRecords, setGrindingRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [showGrindModal, setShowGrindModal] = useState(false);
    const [feedForm, setFeedForm] = useState({ date: new Date().toISOString().split('T')[0], feedTypeId: '', quantityKg: '', animalCount: '', feedingTime: 'morning', notes: '' });
    const [grindForm, setGrindForm] = useState({ date: new Date().toISOString().split('T')[0], inputMaterial: '', inputQuantityKg: '', outputQuantityKg: '', grindingCost: '', outputType: '', notes: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [types, feeds, grinds] = await Promise.all([
                window.go.main.FeedService.GetAllFeedTypes(),
                window.go.main.FeedService.GetFeedRecords('', ''),
                window.go.main.FeedService.GetGrindingRecords('', '')
            ]);
            setFeedTypes(types || []);
            setFeedRecords(feeds || []);
            setGrindingRecords(grinds || []);
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

    const handleGrindSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.FeedService.AddGrindingRecord({
                date: grindForm.date,
                inputMaterial: grindForm.inputMaterial,
                inputQuantityKg: parseFloat(grindForm.inputQuantityKg) || 0,
                outputQuantityKg: parseFloat(grindForm.outputQuantityKg) || 0,
                grindingCost: parseFloat(grindForm.grindingCost) || 0,
                outputType: grindForm.outputType,
                notes: grindForm.notes
            });
            setShowGrindModal(false);
            setGrindForm({ date: new Date().toISOString().split('T')[0], inputMaterial: '', inputQuantityKg: '', outputQuantityKg: '', grindingCost: '', outputType: '', notes: '' });
            loadData();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="feed-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Feed Management</h1>
                    <p>Track feeding records and feed grinding</p>
                </div>
                <div className="page-actions">
                    <Button variant="outline" icon={Cog} onClick={() => setShowGrindModal(true)}>Record Grinding</Button>
                    <Button icon={Plus} onClick={() => setShowFeedModal(true)}>Record Feeding</Button>
                </div>
            </header>

            <div className="feed-grid">
                <Card className="feed-types-card">
                    <CardHeader><CardTitle>Feed Types</CardTitle></CardHeader>
                    <CardContent>
                        <div className="feed-types-list">
                            {feedTypes.map(ft => (
                                <div key={ft.id} className="feed-type-item">
                                    <div className="feed-type-info">
                                        <span className="feed-type-name">{ft.name}</span>
                                        <span className="feed-type-category">{ft.category}</span>
                                    </div>
                                    <span className="feed-type-cost">KES {ft.costPerKg}/kg</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

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
            </div>

            <Card padding="none" className="grinding-card">
                <div className="card-header-bar">
                    <h3>Feed Grinding Records</h3>
                </div>
                {grindingRecords.length === 0 ? (
                    <EmptyState icon={Cog} title="No grinding records" description="Record when you grind feed" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Input Material</TableHead>
                                <TableHead>Input (kg)</TableHead>
                                <TableHead>Output (kg)</TableHead>
                                <TableHead>Cost (KES)</TableHead>
                                <TableHead>Output Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grindingRecords.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell>{new Date(record.date).toLocaleDateString('en-KE')}</TableCell>
                                    <TableCell>{record.inputMaterial}</TableCell>
                                    <TableCell>{record.inputQuantityKg}</TableCell>
                                    <TableCell>{record.outputQuantityKg}</TableCell>
                                    <TableCell>KES {record.grindingCost}</TableCell>
                                    <TableCell>{record.outputType || '-'}</TableCell>
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

            <Modal isOpen={showGrindModal} onClose={() => setShowGrindModal(false)} title="Record Feed Grinding" size="md">
                <form onSubmit={handleGrindSubmit}>
                    <FormGroup><Label htmlFor="grindDate" required>Date</Label><Input id="grindDate" type="date" value={grindForm.date} onChange={(e) => setGrindForm({ ...grindForm, date: e.target.value })} required /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="inputMat" required>Input Material</Label><Select id="inputMat" value={grindForm.inputMaterial} onChange={(e) => setGrindForm({ ...grindForm, inputMaterial: e.target.value })} required><option value="">Select material</option>{grindingMaterials.map(m => <option key={m} value={m}>{m}</option>)}</Select></FormGroup>
                        <FormGroup><Label htmlFor="inputQty">Input Quantity (kg)</Label><Input id="inputQty" type="number" step="0.1" value={grindForm.inputQuantityKg} onChange={(e) => setGrindForm({ ...grindForm, inputQuantityKg: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="outputQty">Output Quantity (kg)</Label><Input id="outputQty" type="number" step="0.1" value={grindForm.outputQuantityKg} onChange={(e) => setGrindForm({ ...grindForm, outputQuantityKg: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="grindCost">Grinding Cost (KES)</Label><Input id="grindCost" type="number" value={grindForm.grindingCost} onChange={(e) => setGrindForm({ ...grindForm, grindingCost: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="outputType">Output Type</Label><Input id="outputType" value={grindForm.outputType} onChange={(e) => setGrindForm({ ...grindForm, outputType: e.target.value })} placeholder="e.g., Dairy meal mix" /></FormGroup>
                    <FormGroup><Label htmlFor="grindNotes">Notes</Label><Textarea id="grindNotes" value={grindForm.notes} onChange={(e) => setGrindForm({ ...grindForm, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowGrindModal(false)}>Cancel</Button><Button type="submit">Save Record</Button></div>
                </form>
            </Modal>
        </div>
    );
}
