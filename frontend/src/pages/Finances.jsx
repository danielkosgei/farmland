import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, Edit2, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { FormGroup, FormRow, Label, Input, Select, Textarea } from '../components/ui/Form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import './Finances.css';

const incomeCategories = ['milk_sales', 'crop_sales', 'livestock_sales', 'other_income'];
const expenseCategories = ['feed', 'veterinary', 'labor', 'equipment', 'seeds', 'fertilizer', 'fuel', 'maintenance', 'transport', 'utilities', 'other_expense'];
const paymentMethods = ['cash', 'mpesa', 'bank'];

export function Finances() {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], type: 'income', category: 'milk_sales', description: '', amount: '', paymentMethod: 'cash', relatedEntity: '', notes: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDate, setSelectedDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

    useEffect(() => { loadData(); }, [selectedDate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const startOfMonth = selectedDate.toISOString().split('T')[0];
            const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString().split('T')[0];

            const [trans, sum] = await Promise.all([
                window.go.main.FinancialService.GetTransactions(startOfMonth, endOfMonth, '', ''),
                window.go.main.FinancialService.GetFinancialSummary(startOfMonth, endOfMonth)
            ]);
            setTransactions(trans || []);
            setSummary(sum);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handlePrevMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
    };

    const getMonthName = () => {
        return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await window.go.main.FinancialService.AddTransaction({
                date: formData.date,
                type: formData.type,
                category: formData.category,
                description: formData.description,
                amount: parseFloat(formData.amount) || 0,
                paymentMethod: formData.paymentMethod,
                relatedEntity: formData.relatedEntity,
                notes: formData.notes
            });
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        setConfirmDelete({ show: true, id });
    };

    const confirmDeleteTransaction = async () => {
        try {
            await window.go.main.FinancialService.DeleteTransaction(confirmDelete.id);
            setConfirmDelete({ show: false, id: null });
            loadData();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => setFormData({ date: new Date().toISOString().split('T')[0], type: 'income', category: 'milk_sales', description: '', amount: '', paymentMethod: 'cash', relatedEntity: '', notes: '' });

    const formatCurrency = (amt) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amt || 0);

    const filteredTransactions = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

    const itemsPerPage = 10;
    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterType]);

    const chartData = [
        { name: 'Income', value: summary?.totalIncome || 0, fill: '#22c55e' },
        { name: 'Expenses', value: summary?.totalExpenses || 0, fill: '#ef4444' }
    ];

    return (
        <div className="finances-page">
            <header className="page-header">
                <div className="page-header-content">
                    <div className="title-with-badge">
                        <h1>Finances</h1>
                        {summary?.netProfit !== undefined && (
                            <div className={`profit-badge ${summary.netProfit >= 0 ? 'positive' : 'negative'}`}>
                                <DollarSign size={14} />
                                <span>{selectedDate.toLocaleString('default', { month: 'short' })} Profit: {formatCurrency(summary.netProfit)}</span>
                            </div>
                        )}
                    </div>
                    <div className="month-selector">
                        <button className="month-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
                        <div className="current-month-display">
                            <Calendar size={14} />
                            <span>{getMonthName()}</span>
                        </div>
                        <button className="month-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
                    </div>
                </div>
                <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>Add Transaction</Button>
            </header>


            <div className="finance-grid">
                <Card className="chart-card">
                    <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
                    <CardContent>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
                                        tick={{ fontSize: 10, fill: 'var(--color-neutral-500)', fontFamily: 'var(--font-family-mono)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={80}
                                        tick={{ fontSize: 12, fontWeight: 'var(--font-weight-bold)', fill: 'var(--color-neutral-700)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--color-neutral-50)', opacity: 0.4 }}
                                        contentStyle={{
                                            borderRadius: 'var(--radius-lg)',
                                            border: 'var(--border-thin)',
                                            boxShadow: 'var(--shadow-lg)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(4px)',
                                            padding: 'var(--space-2) var(--space-3)'
                                        }}
                                        itemStyle={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Bar
                                        dataKey="value"
                                        radius={[0, 4, 4, 0]}
                                        barSize={32}
                                        animationDuration={1000}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card padding="none" className="transactions-card">
                    <div className="transactions-toolbar">
                        <div className="type-filters">
                            <button className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All</button>
                            <button className={`filter-btn income ${filterType === 'income' ? 'active' : ''}`} onClick={() => setFilterType('income')}>Income</button>
                            <button className={`filter-btn expense ${filterType === 'expense' ? 'active' : ''}`} onClick={() => setFilterType('expense')}>Expenses</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container"><div className="loading-spinner"></div></div>
                    ) : filteredTransactions.length === 0 ? (
                        <EmptyState icon={DollarSign} title="No transactions" description="Start recording your income and expenses" action={<Button icon={Plus} onClick={() => setShowModal(true)}>Add Transaction</Button>} />
                    ) : (
                        <div className="table-wrapper">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedTransactions.map(trans => (
                                        <TableRow key={trans.id}>
                                            <TableCell className="font-mono">{new Date(trans.date).toLocaleDateString('en-KE')}</TableCell>
                                            <TableCell><span className="font-bold text-neutral-900">{trans.description || '-'}</span></TableCell>
                                            <TableCell><span className={`cat-badge cat-${trans.type}`}>{trans.category?.replace('_', ' ') || '-'}</span></TableCell>
                                            <TableCell className={`amount font-mono font-bold ${trans.type}`}>
                                                {trans.type === 'income' ? '+' : '-'}{formatCurrency(trans.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <button className="action-btn delete" onClick={() => handleDelete(trans.id)}><Trash2 size={16} /></button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Pagination
                                totalItems={filteredTransactions.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </Card>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Transaction" size="md">
                <form onSubmit={handleSubmit}>
                    <FormRow>
                        <FormGroup><Label htmlFor="transDate" required>Date</Label><Input id="transDate" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></FormGroup>
                        <FormGroup><Label htmlFor="transType">Type</Label><Select id="transType" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value, category: e.target.value === 'income' ? 'milk_sales' : 'feed' })}><option value="income">Income</option><option value="expense">Expense</option></Select></FormGroup>
                    </FormRow>
                    <FormRow>
                        <FormGroup><Label htmlFor="transCat">Category</Label><Select id="transCat" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>{(formData.type === 'income' ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}</Select></FormGroup>
                        <FormGroup><Label htmlFor="transAmt" required>Amount (KES)</Label><Input id="transAmt" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="transDesc">Description</Label><Input id="transDesc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Sold 50 liters milk" /></FormGroup>
                    <FormRow>
                        <FormGroup><Label htmlFor="payMethod">Payment Method</Label><Select id="payMethod" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>{paymentMethods.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}</Select></FormGroup>
                        <FormGroup><Label htmlFor="relEntity">Related To</Label><Input id="relEntity" value={formData.relatedEntity} onChange={(e) => setFormData({ ...formData, relatedEntity: e.target.value })} placeholder="e.g., Cow: Daisy" /></FormGroup>
                    </FormRow>
                    <FormGroup><Label htmlFor="transNotes">Notes</Label><Textarea id="transNotes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></FormGroup>
                    <div className="modal-actions"><Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save Transaction</Button></div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDelete.show}
                onClose={() => setConfirmDelete({ show: false, id: null })}
                onConfirm={confirmDeleteTransaction}
                title="Delete Transaction"
                message="Are you sure you want to delete this financial transaction? This action cannot be undone."
                type="danger"
                confirmText="Delete Transaction"
            />
        </div>
    );
}
