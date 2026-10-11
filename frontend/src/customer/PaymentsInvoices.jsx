import React, { useState, useEffect } from 'react';
import { invoicesApi } from '../api/apiClient';
import { 
  FileText, 
  Download, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const PaymentsInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoicesApi.getInvoices();
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setInvoices(list);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="portal-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Billing & Invoices</div>
          <h1 className="text-2xl font-bold text-navy">Payments & Invoices</h1>
          <p className="text-sm text-muted">View official GST invoices, receipts, and payment transactions</p>
        </div>
        <button 
          onClick={fetchInvoices} 
          className="btn btn-outline-secondary btn-sm flex items-center gap-1 self-start md:self-auto"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <RefreshCw size={36} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-navy">Loading billing records...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <FileText size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">No Invoices Available</h3>
          <p className="text-sm text-muted max-w-sm mx-auto mt-1">
            Invoices are generated automatically when your laundry bookings are processed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoices List */}
          <div className="lg:col-span-2 space-y-4">
            {invoices.map((inv) => (
              <div 
                key={inv.id} 
                className={`content-card cursor-pointer transition-all hover:border-blue-300 ${selectedInvoice?.id === inv.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedInvoice(inv)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-navy">{inv.invoice_number}</span>
                      <span className="text-xs text-muted block">
                        Order #{inv.order_number || inv.order} • {inv.issued_date ? new Date(inv.issued_date).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-lg text-navy block">₹{inv.total_amount}</span>
                    <span className={`text-xs font-bold ${inv.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {inv.status || 'UNPAID'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Invoice Preview Card */}
          <div className="content-card sticky top-24 h-fit">
            {selectedInvoice ? (
              <div>
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <h3 className="font-bold text-navy text-base">Invoice Preview</h3>
                  <button 
                    onClick={handlePrint}
                    className="btn btn-outline-primary btn-sm flex items-center gap-1"
                  >
                    <Download size={14} />
                    <span>Print / Save</span>
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="text-center py-2 border-b">
                    <h4 className="font-black text-primary text-lg">FabriCare Laundry Services</h4>
                    <p className="text-xs text-muted">GST Registered • Express Fabric Care</p>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-muted">Invoice No:</span>
                    <span className="font-mono font-bold">{selectedInvoice.invoice_number}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-muted">Order Ref:</span>
                    <span className="font-semibold">{selectedInvoice.order_number || selectedInvoice.order}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-muted">Payment Mode:</span>
                    <span className="font-semibold">{selectedInvoice.payment_method || 'Online / UPI'}</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between font-bold text-base text-navy">
                    <span>Total Paid:</span>
                    <span className="text-primary">₹{selectedInvoice.total_amount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted">
                <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs">Select an invoice from the list to preview details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsInvoices;
