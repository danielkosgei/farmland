import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, Milk } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Textarea, Checkbox } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import './MilkSales.css';

export function MilkSales() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], buyerName: '', liters: '', pricePerLiter: '60', isPaid: false, notes: '' });

    useEffect(() => { loadSales(); }, []);

    const loadSales = async () => {
        try {
            const data = await window.go.main.LivestockService.GetMilkSales('', '');
            setSales(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const saleData = {
                date: formData.date,
                buyerName: formData.buyerName,
                liters: parseFloat(formData.liters),
                pricePerLiter: parseFloat(formData.pricePerLiter),
                isPaid: formData.isPaid,
                notes: formData.notes
            };
            if (editingSale) {
                await window.go.main.LivestockService.UpdateMilkSale({ ...saleData, id: editingSale.id });
            } else {
                await window.go.main.LivestockService.AddMilkSale(saleData);
            }
            setShowModal(false);
            setEditingSale(null);
            resetForm();
            loadSales();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this sale record?')) {
            try {
                await window.go.main.LivestockService.DeleteMilkSale(id);
                loadSales();
            } catch (err) { console.error(err); }
        }
    };

    const openEdit = (sale) => {
        setEditingSale(sale);
        setFormData({ date: sale.date, buyerName: sale.buyerName, liters: sale.liters.toString(), pricePerLiter: sale.pricePerLiter.toString(), isPaid: sale.isPaid, notes: sale.notes });
        setShowModal(true);
    };

    const resetForm = () => setFormData({ date: new Date().toISOString().split('T')[0], buyerName: '', liters: '', pricePerLiter: '60', isPaid: false, notes: '' });

    const formatCurrency = (amt) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amt);

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalLiters = sales.reduce((sum, s) => sum + s.liters, 0);

    return (
        <div className="milk-sales-page">
            <header className="page-header">
                <div className="page-header-content">
                    <h1>Milk Sales</h1>
                    <p>Track your milk sales and revenue</p>
                </div>
                <Button icon={Plus} onClick={() => { resetForm(); setEditingSale(null); setShowModal(true); }}>Record Sale</Button>
            </header>

            <div className="sales-summary">
                <div className="summary-card"><span className="summary-value">{totalLiters.toFixed(1)} L</span><span className="summary-label">Total Liters Sold</span></div>
                <div className="summary-card"><span className="summary-value">{formatCurrency(totalRevenue)}</span><span className="summary-label">Total Revenue</span></div>
                <div className="summary-card"><span className="summary-value">{sales.length}</span><span className="summary-label">Total Sales</span></div>
            </div>

            <Card padding="none">
                {loading ? (
                    <div className="loading-container"><div className="loading-spinner"></div></div>
                ) : sales.length === 0 ? (
                    <EmptyState icon={Milk} title="No sales recorded" description="Start recording your milk sales" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Record Sale</Button>} />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Buyer</TableHead>
                                <TableHead>Liters</TableHead>
                                <TableHead>Price/L</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.map(sale => (
                                <TableRow key={sale.id}>
                                    <TableCell>{new Date(sale.date).toLocaleDateString('en-KE')}</TableCell>
                                    <TableCell>{sale.buyerName || 'Walk-in'}</TableCell>
                                    <TableCell>{sale.liters.toFixed(1)} L</TableCell>
                                    <TableCell>{formatCurrency(sale.pricePerLiter)}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(sale.totalAmount)}</TableCell>
                                    <TableCell>
                                        <span className={`payment-badge ${sale.isPaid ? 'paid' : 'pending'}`}>
                                            {sale.isPaid ? <><CheckCircle size={14} /> Paid</> : 'Pending'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="action-buttons">
                                            <button className="action-btn edit" onClick={() => openEdit(sale)}><Edit2 size={16} /></button>
                                            <button className="action-btn delete" onClick={() => handleDelete(sale.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSale ? 'Edit Sale' : 'Record New Sale'} size="sm">
                <form onSubmit={handleSubmit}>
                    <FormGroup><Label htmlFor="saleDate" required>Date</Label><Input id="saleDate" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></FormGroup>
                    <FormGroup><Label htmlFor="buyer">Buyer Name</Label><Input id="buyer" value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} placeholder="e.g., John Kamau" /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="liters" required>Liters</Label><Input id="liters" type="number" step="0.1" value={formData.liters} onChange={(e) => setFormData({ ...formData, liters: e.target.value })} required /></FormGroup>
                        <FormGroup><Label htmlFor="price" required>Price/Liter (KES)</Label><Input id="price" type="number" value={formData.pricePerLiter} onChange={(e) => setFormData({ ...formData, pricePerLiter: e.target.value })} required /></FormGroup>
                    </FormRow>
                    {formData.liters && formData.pricePerLiter && (
                        <div className="total-preview">Total: {formatCurrency(parseFloat(formData.liters || 0) * parseFloat(formData.pricePerLiter || 0))}</div>
                    )}
                    <FormGroup><Checkbox label="Payment received" checked={formData.isPaid} onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })} /></FormGroup>
                    <FormGroup><Label htmlFor="saleNotes">Notes</Label><Textarea id="saleNotes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editingSale ? 'Update' : 'Record'} Sale</Button></div>
                </form>
            </Modal>
        </div>
    );
}
