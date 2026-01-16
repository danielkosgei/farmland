import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import './Inventory.css';

const categories = ['feed', 'equipment', 'supplies', 'seeds', 'fertilizer', 'medicine', 'tools', 'fuel'];
const units = ['kg', 'liters', 'bags', 'pieces', 'bottles', 'packets'];

export function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [formData, setFormData] = useState({ name: '', category: 'supplies', quantity: '', unit: 'kg', minimumStock: '', costPerUnit: '', supplier: '', notes: '' });

    useEffect(() => { loadItems(); }, []);

    const loadItems = async () => {
        try {
            const data = await window.go.main.InventoryService.GetAllInventory();
            setItems(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData, quantity: parseFloat(formData.quantity) || 0, minimumStock: parseFloat(formData.minimumStock) || 0, costPerUnit: parseFloat(formData.costPerUnit) || 0 };
            if (editingItem) {
                await window.go.main.InventoryService.UpdateInventoryItem({ ...data, id: editingItem.id });
            } else {
                await window.go.main.InventoryService.AddInventoryItem(data);
            }
            setShowModal(false);
            setEditingItem(null);
            resetForm();
            loadItems();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        setConfirmDelete({ show: true, id });
    };

    const confirmDeleteItem = async () => {
        try {
            await window.go.main.InventoryService.DeleteInventoryItem(confirmDelete.id);
            setConfirmDelete({ show: false, id: null });
            loadItems();
        } catch (err) { console.error(err); }
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name, category: item.category, quantity: item.quantity.toString(), unit: item.unit, minimumStock: item.minimumStock.toString(), costPerUnit: item.costPerUnit.toString(), supplier: item.supplier, notes: item.notes });
        setShowModal(true);
    };

    const resetForm = () => setFormData({ name: '', category: 'supplies', quantity: '', unit: 'kg', minimumStock: '', costPerUnit: '', supplier: '', notes: '' });

    const filteredItems = filterCategory === 'all' ? items : items.filter(i => i.category === filterCategory);
    const itemsPerPage = 10;
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory]);

    const lowStockCount = items.filter(i => i.quantity < i.minimumStock).length;

    return (
        <div className="inventory-page">
            <header className="page-header">
                <div className="page-header-content">
                    <div className="flex items-center gap-3">
                        <h1>Inventory</h1>
                        <span className="item-count-badge">{filteredItems.length} items</span>
                    </div>
                    <p>Track farm supplies, equipment, and stock levels</p>
                </div>
                <Button icon={Plus} onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }}>Add Item</Button>
            </header>

            {lowStockCount > 0 && (
                <div className="low-stock-alert">
                    <AlertTriangle size={20} />
                    <span>{lowStockCount} item(s) below minimum stock level</span>
                </div>
            )}

            <Card padding="none">
                <div className="inventory-toolbar">
                    <div className="category-filters">
                        <button className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`} onClick={() => setFilterCategory('all')}>All</button>
                        {categories.map(cat => (
                            <button key={cat} className={`filter-btn ${filterCategory === cat ? 'active' : ''}`} onClick={() => setFilterCategory(cat)}>{cat}</button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container"><div className="loading-spinner"></div></div>
                ) : items.length === 0 ? (
                    <EmptyState icon={Package} title="No inventory items" description="Add items to track your farm supplies" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add Item</Button>} />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Cost/Unit</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedItems.map(item => (
                                <TableRow key={item.id} className={item.quantity < item.minimumStock ? 'low-stock-row' : ''}>
                                    <TableCell>
                                        <div className="item-info">
                                            <span className="item-name">{item.name}</span>
                                            {item.supplier && <span className="item-supplier">{item.supplier}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell><span className={`category-badge cat-${item.category}`}>{item.category}</span></TableCell>
                                    <TableCell className="font-mono">{item.quantity} {item.unit}</TableCell>
                                    <TableCell className="font-mono">KES {item.costPerUnit}</TableCell>
                                    <TableCell>
                                        <div className="action-buttons">
                                            <button className="action-btn edit" onClick={() => openEdit(item)}><Edit2 size={16} /></button>
                                            <button className="action-btn delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                {!loading && filteredItems.length > 0 && (
                    <Pagination
                        totalItems={filteredItems.length}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </Card>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Edit Item' : 'Add Inventory Item'} size="md">
                <form onSubmit={handleSubmit}>
                    <FormGroup><Label htmlFor="itemName" required>Item Name</Label><Input id="itemName" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g., Dairy Meal" /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="itemCat">Category</Label><Select id="itemCat" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</Select></FormGroup>
                        <FormGroup><Label htmlFor="itemUnit">Unit</Label><Select id="itemUnit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>{units.map(u => <option key={u} value={u}>{u}</option>)}</Select></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="qty">Current Quantity</Label><Input id="qty" type="number" step="0.1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="minStock">Minimum Stock</Label><Input id="minStock" type="number" step="0.1" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })} /></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="cost">Cost per Unit (KES)</Label><Input id="cost" type="number" step="0.01" value={formData.costPerUnit} onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })} /></FormGroup>
                        <FormGroup><Label htmlFor="supplier">Supplier</Label><Input id="supplier" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} placeholder="e.g., Unga Feeds" /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="itemNotes">Notes</Label><Textarea id="itemNotes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editingItem ? 'Update' : 'Add'} Item</Button></div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={confirmDeleteItem}
                title="Delete Inventory Item"
                message="Are you sure you want to delete this inventory item? This will remove it from all stock tracking."
                type="danger"
                confirmText="Delete Item"
            />
        </div>
    );
}
