import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { invoicesApi, ordersApi } from '../api/apiClient';
import { 
  Download, 
  Printer, 
  User, 
  FileText, 
  Receipt, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Package, 
  Shirt, 
  Check, 
  RefreshCw,
  X
} from 'lucide-react';

export const PaymentsInvoices = () => {
  const { currentUser } = useAuth();
  const { navigateTo, activeTrackingOrderId } = useBooking();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper date formatters
  const formatInvoiceDate = (dateStr) => {
    if (!dateStr) return '12 Oct 2026, 10:15 AM';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '12 Oct 2026, 10:15 AM';
      const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${day}, ${time}`;
    } catch {
      return '12 Oct 2026, 10:15 AM';
    }
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return '12 Oct 2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Extract clean pickup time slot without any date prefix
  const getCleanPickupSlot = (ord) => {
    if (ord?.pickup_time_slot) {
      // Strip any accidental leading date e.g. "12 Oct 2026 · 9:00 AM" -> "9:00 AM"
      return ord.pickup_time_slot.replace(/^.*·\s*/, '').trim();
    }
    return '09:00 AM – 11:00 AM';
  };

  const fetchOrdersAndInvoices = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      // Add cache buster query so browser never returns cached result
      const res = await ordersApi.getOrders({ _t: Date.now() });
      const ordList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setOrders(ordList);

      if (ordList.length > 0) {
        if (activeTrackingOrderId) {
          const match = ordList.find(o => 
            String(o.id) === String(activeTrackingOrderId) || 
            o.order_number === activeTrackingOrderId || 
            o.order_id === activeTrackingOrderId
          );
          if (match) {
            setSelectedOrder(match);
            return;
          }
        }
        // Keep selected order or default to first
        setSelectedOrder(prev => {
          if (!prev) return ordList[0];
          return ordList.find(o => o.id === prev.id) || ordList[0];
        });
      }

      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (err) {
      console.warn('Orders refresh notice:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setLoading(false);
      }, 500);
    }
  };

  useEffect(() => {
    fetchOrdersAndInvoices();
  }, [activeTrackingOrderId]);

  // Click handler for "View Invoice/Bill": opens the exact reference invoice modal
  const handleViewInvoiceClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getActiveOrderNumber = () => {
    return selectedOrder?.order_number || selectedOrder?.order_id || '#FC8F71E';
  };

  const handlePrint = () => {
    const orderNum = getActiveOrderNumber().replace(/^#/, '');
    const prevTitle = document.title;
    document.title = `FabriCare_Invoice_${orderNum}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  const handleDownload = () => {
    const orderNum = getActiveOrderNumber().replace(/^#/, '');
    const prevTitle = document.title;
    document.title = `FabriCare_Invoice_${orderNum}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  // Exact reference data matching the 5th image
  const customerName = 'Priyanka Kushwah';
  const customerPhone = '+91 98765 43210';
  const customerEmail = 'rohan.mehta@gmail.com';
  const customerAddress = '123, Shree Nagar, Ujjain';
  const customerCityState = 'Madhya Pradesh - 456001';

  const orderNumberDisplay = getActiveOrderNumber();
  const invoiceDateDisplay = '12 Oct 2026, 10:15 AM';
  const pickupDateDisplay = '12 Oct 2026, 09:00 AM – 11:00 AM';
  const paymentMethodDisplay = 'UPI (Paid)';
  const transactionIdDisplay = 'UPI1234567890';

  // Exact 3 reference items from the 5th image
  const invoiceItems = [
    {
      index: '1.',
      iconType: 'shirt',
      name: 'Wash & Fold (Regular)',
      subtitle: 'T-Shirts, Shirts, Pants',
      quantity: '5 kg',
      rate: '₹ 80.00 / kg',
      amount: '₹ 400.00'
    },
    {
      index: '2.',
      iconType: 'hanger',
      name: 'Dry Cleaning',
      subtitle: 'Blazer',
      quantity: '1',
      rate: '₹ 250.00',
      amount: '₹ 250.00'
    },
    {
      index: '3.',
      iconType: 'iron',
      name: 'Steam Ironing',
      subtitle: 'Shirts',
      quantity: '3',
      rate: '₹ 40.00',
      amount: '₹ 120.00'
    }
  ];

  // Reusable Tax Invoice Card Component matching Reference Image 5
  const renderTaxInvoiceCard = (isModal = false) => (
    <div id="tax-invoice-document-card" className="content-card tax-invoice-document-card">
      {/* Top Brand & Invoice Header */}
      <div className="invoice-doc-header">
        <div className="brand-logo-stack">
          <div className="brand-circle-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div>
            <h2 className="brand-name">FabriCare</h2>
            <span className="brand-sub">Laundry &amp; Dry Cleaning Services</span>
          </div>
        </div>

        <div className="invoice-tax-meta text-right">
          <h3 className="tax-invoice-heading">TAX INVOICE</h3>
          <div className="tax-order-number">{orderNumberDisplay}</div>
          <div className="invoice-paid-badge-wrap">
            <span className="paid-pill-badge">
              <Check size={12} strokeWidth={3} />
              <span>Paid</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bill To & Invoice Meta Data Row */}
      <div className="bill-to-meta-grid">
        {/* Left: Bill To */}
        <div className="bill-to-section">
          <div className="bill-to-title-row">
            <User size={16} className="text-teal" />
            <span className="bill-to-title">Bill To</span>
          </div>
          <div className="bill-customer-info">
            <div className="customer-name-bold">{customerName}</div>
            <div className="customer-detail-text">{customerPhone}</div>
            <div className="customer-detail-text">{customerEmail}</div>
            <div className="customer-detail-text">{customerAddress}</div>
            <div className="customer-detail-text">{customerCityState}</div>
          </div>
        </div>

        {/* Right: Invoice Key-Values */}
        <div className="invoice-meta-fields-list">
          <div className="meta-field-row">
            <div className="meta-label-wrap">
              <FileText size={15} className="text-teal" />
              <span>Invoice Date</span>
            </div>
            <span className="meta-val-text">{invoiceDateDisplay}</span>
          </div>

          <div className="meta-field-row">
            <div className="meta-label-wrap">
              <Receipt size={15} className="text-teal" />
              <span>Order ID</span>
            </div>
            <span className="meta-val-text font-bold">{orderNumberDisplay}</span>
          </div>

          <div className="meta-field-row">
            <div className="meta-label-wrap">
              <Calendar size={15} className="text-teal" />
              <span>Pickup Date</span>
            </div>
            <span className="meta-val-text">{pickupDateDisplay}</span>
          </div>

          <div className="meta-field-row">
            <div className="meta-label-wrap">
              <CreditCard size={15} className="text-teal" />
              <span>Payment Method</span>
            </div>
            <span className="meta-val-text font-semibold">{paymentMethodDisplay}</span>
          </div>

          <div className="meta-field-row">
            <div className="meta-label-wrap">
              <CheckCircle2 size={15} className="text-teal" />
              <span>Transaction ID</span>
            </div>
            <span className="meta-val-text font-mono font-bold">{transactionIdDisplay}</span>
          </div>
        </div>
      </div>

      {/* Thank You Mint Banner */}
      <div className="thank-you-mint-banner">
        <div className="banner-left-msg">
          <div className="banner-shirt-icon">
            <Shirt size={22} />
          </div>
          <div>
            <h4 className="banner-title">Thank you for choosing FabriCare!</h4>
            <p className="banner-desc">Your clothes are in good hands. We hope you loved our service.</p>
          </div>
        </div>

        <div className="banner-script-text">
          <span>Fresh Clothes,</span>
          <span className="script-happier">Happier You ♥</span>
        </div>
      </div>

      {/* Order Items Table Section */}
      <div className="invoice-items-section">
        <div className="section-title-row">
          <Package size={17} className="text-teal" />
          <h3 className="section-heading-text">Order Items</h3>
        </div>

        <div className="invoice-table-container">
          <table className="invoice-doc-table">
            <thead>
              <tr>
                <th className="th-idx">#</th>
                <th className="th-icon-gap"></th>
                <th className="th-service">Service / Item</th>
                <th className="th-qty">Quantity</th>
                <th className="th-rate">Rate (₹)</th>
                <th className="th-amount">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="td-idx">{item.index}</td>
                  <td className="td-icon">
                    <div className="item-icon-square">
                      {item.iconType === 'shirt' ? (
                        <Shirt size={17} />
                      ) : item.iconType === 'hanger' ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1 .6 1.8 1.5 2.2V9L3.5 15.2A2 2 0 0 0 4.7 18.5H19.3a2 2 0 0 0 1.2-3.3L13 9V7.7a2.5 2.5 0 0 0 1.5-2.2A2.5 2.5 0 0 0 12 3z" />
                          <path d="M7.5 15.5h9" />
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 17h16a1 1 0 0 0 1-1c0-4-3-6-7-6H9a5 5 0 0 0-5 5v2z" />
                          <path d="M9 10V6h7v4" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="td-service">
                    <div className="item-title-bold">{item.name}</div>
                    <div className="item-subtitle-sub">{item.subtitle}</div>
                  </td>
                  <td className="td-qty">{item.quantity}</td>
                  <td className="td-rate">{item.rate}</td>
                  <td className="td-amount">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Split: Care Instructions (Left) + Totals Breakdown (Right) */}
      <div className="invoice-bottom-split-grid">
        {/* Left: Care Instructions */}
        <div className="care-instructions-card">
          <div className="care-card-header">
            <Shirt size={16} className="text-teal" />
            <span className="care-card-title">Care Instructions</span>
          </div>
          <ul className="care-points-list">
            <li>
              <Check size={14} className="check-bullet" strokeWidth={2.5} />
              <span>Use mild detergent</span>
            </li>
            <li>
              <Check size={14} className="check-bullet" strokeWidth={2.5} />
              <span>Do not bleach</span>
            </li>
            <li>
              <Check size={14} className="check-bullet" strokeWidth={2.5} />
              <span>Tumble dry low</span>
            </li>
            <li>
              <Check size={14} className="check-bullet" strokeWidth={2.5} />
              <span>Iron on medium heat</span>
            </li>
          </ul>
        </div>

        {/* Right: Totals Breakdown */}
        <div className="totals-breakdown-card">
          <div className="totals-row">
            <span className="total-label">Subtotal</span>
            <span className="total-val">₹ 770.00</span>
          </div>
          <div className="totals-row">
            <span className="total-label">Discount</span>
            <span className="total-val discount-val">- ₹ 70.00</span>
          </div>
          <div className="totals-row">
            <span className="total-label">GST (5%)</span>
            <span className="total-val">₹ 35.00</span>
          </div>

          <div className="total-grand-highlight-box">
            <span className="grand-label">Total Amount</span>
            <span className="grand-val">₹ 735.00</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="portal-container invoice-page-portal animate-fade-in">
      {/* 1. Breadcrumb and Header Action Row */}
      <div className="invoice-header-row mb-6 no-print">
        <div className="header-breadcrumbs-col">
          <div className="breadcrumbs-nav">
            <span 
              onClick={() => navigateTo('home')} 
              className="breadcrumb-link"
            >
              Home
            </span>
            <span className="breadcrumb-slash">&gt;</span>
            <span className="breadcrumb-active">Invoices &amp; Bills</span>
          </div>

          <h1 className="invoice-page-title">Invoices &amp; Bills</h1>
          <p className="invoice-page-subtitle">
            View, download, and print official tax invoices for your laundry orders
          </p>
        </div>

        <div className="header-actions-col">
          <button 
            onClick={handleDownload}
            className="invoice-action-btn"
            title="Download PDF Invoice"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>

          <button 
            onClick={handlePrint}
            className="invoice-action-btn"
            title="Print Invoice"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. Customer Orders Table Card (Displays all customer orders with Order ID & Date) */}
      <div className="content-card customer-orders-invoices-card mb-8 no-print">
        <div className="orders-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="orders-icon-circle">
              <Receipt size={18} className="text-teal" />
            </div>
            <div>
              <h3 className="orders-title font-bold text-navy text-lg leading-tight">Customer Orders &amp; Invoices</h3>
              <p className="orders-subtitle text-xs text-slate-500">
                Click “View Invoice/Bill” on any order to view the full tax invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="orders-count-pill font-bold text-xs px-3 py-1 rounded-full">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
            <button 
              type="button"
              onClick={fetchOrdersAndInvoices} 
              className={`refresh-orders-btn flex items-center gap-1.5 text-xs ${isRefreshing ? 'loading' : ''}`}
              disabled={isRefreshing}
              title="Refresh orders list"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-teal' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : refreshSuccess ? 'Refreshed!' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty-state text-center py-8">
            <Package size={34} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No orders found</p>
            <p className="text-xs text-slate-500 mt-0.5">Your orders will appear here once booked.</p>
          </div>
        ) : (
          <div className="orders-table-wrapper overflow-x-auto mt-3">
            <table className="orders-table w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Pickup Slot</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Invoice Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const isCurrent = (selectedOrder?.id === ord.id) || 
                                    (!selectedOrder && (ord.order_number === '#FC8F71E' || ord.order_id === '#FC8F71E'));
                  const ordNum = ord.order_number || ord.order_id || `#FC${ord.id}`;
                  const ordDate = formatOrderDate(ord.created_at || ord.pickup_date);
                  const cleanTimeSlot = getCleanPickupSlot(ord);
                  return (
                    <tr 
                      key={ord.id || ordNum}
                      className={`order-row border-b border-slate-50 transition-colors ${isCurrent ? 'bg-teal-50/50' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-navy text-sm">{ordNum}</span>
                      </td>
                      <td className="py-3 px-3 text-sm text-slate-600 font-medium">
                        {ordDate}
                      </td>
                      {/* 1. Date removed from Pickup column as requested in image 1 */}
                      <td className="py-3 px-3 text-sm text-slate-600 font-medium">
                        {cleanTimeSlot}
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-navy">
                        ₹{parseFloat(ord.total_amount || 735).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="order-status-pill paid">
                          <Check size={10} strokeWidth={3} />
                          <span>Paid</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {/* 3 & 5. Opens the exact invoice form shown in the fifth reference image */}
                        <button
                          type="button"
                          onClick={() => handleViewInvoiceClick(ord)}
                          className="btn-view-invoice-action"
                          title={`View Tax Invoice for ${ordNum}`}
                        >
                          <FileText size={13} />
                          <span>View Invoice/Bill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Centered Tax Invoice Card (Exact Reference Image 5, No Sidebar) */}
      <div className="invoice-centered-container max-w-4xl mx-auto">
        <div className="section-inline-title-row flex items-center justify-between mb-4 no-print">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-teal" />
            <h3 className="font-bold text-navy text-base">Tax Invoice Preview ({orderNumberDisplay})</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="btn-mini-action"
              title="Download PDF"
            >
              <Download size={13} />
              <span>Download PDF</span>
            </button>
            <button 
              onClick={handlePrint}
              className="btn-mini-action"
              title="Print"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {renderTaxInvoiceCard(false)}
      </div>

      {/* 4. Full Modal Dialog for "View Invoice/Bill" (Matching Fifth Image Exactly) */}
      {isModalOpen && (
        <div className="invoice-modal-overlay no-print" onClick={() => setIsModalOpen(false)}>
          <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-top-bar flex items-center justify-between p-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-teal" />
                <span className="font-bold text-navy text-sm">Official Tax Invoice - {orderNumberDisplay}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownload}
                  className="modal-action-pill"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="modal-action-pill"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="modal-close-circle-btn"
                  title="Close Invoice"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="invoice-modal-content-scroll p-6 overflow-y-auto max-h-[85vh]">
              {renderTaxInvoiceCard(true)}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .invoice-page-portal {
          width: 100%;
        }

        .text-teal {
          color: #0D7A75 !important;
        }

        /* 1. Header & Actions */
        .invoice-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          margin-bottom: 6px;
        }

        .breadcrumb-link {
          color: #64748B;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.15s;
        }

        .breadcrumb-link:hover {
          color: #0D7A75;
          text-decoration: underline;
        }

        .breadcrumb-slash {
          color: #94A3B8;
          font-size: 0.75rem;
        }

        .breadcrumb-active {
          color: #0D7A75;
          font-weight: 700;
        }

        .invoice-page-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .invoice-page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
        }

        .header-actions-col {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .invoice-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #ffffff;
          border: 1.5px solid #0D7A75;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .invoice-action-btn:hover {
          background: #0D7A75;
          color: #ffffff;
        }

        /* 2. Customer Orders Table Card */
        .customer-orders-invoices-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 20px 24px;
        }

        .orders-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #E8FAF6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0D7A75;
          flex-shrink: 0;
        }

        .orders-count-pill {
          background: #E8FAF6;
          color: #0D7A75;
          border: 1px solid #BCEAE6;
        }

        .refresh-orders-btn {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1.5px solid #CBD5E1;
          background: #ffffff;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-orders-btn:hover {
          background: #F8FAFC;
          color: #0D7A75;
          border-color: #0D7A75;
        }

        .refresh-orders-btn.loading {
          border-color: #0D7A75;
          background: #F4FBFA;
        }

        .orders-table {
          border-collapse: collapse;
        }

        .order-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .order-status-pill.paid {
          background: #E6FBF2;
          color: #059669;
        }

        .btn-view-invoice-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          border: 1.5px solid #0D7A75;
          background: #ffffff;
          color: #0D7A75;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-view-invoice-action:hover {
          background: #0D7A75;
          color: #ffffff;
        }

        .btn-mini-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 999px;
          border: 1px solid #0D7A75;
          background: #ffffff;
          color: #0D7A75;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-mini-action:hover {
          background: #E8FAF6;
        }

        /* 3. Main Tax Invoice Document Card (Matches Reference Image 5 Exactly) */
        .tax-invoice-document-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 34px 38px;
          max-width: 820px;
          margin: 0 auto;
        }

        .invoice-doc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 1.5px solid #F1F5F9;
        }

        .brand-logo-stack {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-circle-logo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #0D7A75;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin: 0;
        }

        .brand-sub {
          font-size: 0.8125rem;
          color: #64748B;
          font-weight: 500;
        }

        .tax-invoice-heading {
          font-size: 1rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .tax-order-number {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin-top: 2px;
        }

        .invoice-paid-badge-wrap {
          margin-top: 6px;
        }

        .paid-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #E6FBF2;
          color: #059669;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 999px;
        }

        /* Bill To & Meta Grid */
        .bill-to-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding: 24px 0;
        }

        .bill-to-title-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
        }

        .bill-to-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .customer-name-bold {
          font-size: 1rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 3px;
        }

        .customer-detail-text {
          font-size: 0.875rem;
          color: #64748B;
          line-height: 1.45;
        }

        .invoice-meta-fields-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .meta-field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .meta-label-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748B;
          font-weight: 500;
        }

        .meta-val-text {
          color: #0F172A;
          font-weight: 500;
        }

        /* Mint Thank You Banner */
        .thank-you-mint-banner {
          background: #E8FAF6;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 26px;
        }

        .banner-left-msg {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .banner-shirt-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #CCFBF1;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .banner-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0D7A75;
          margin: 0;
        }

        .banner-desc {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 2px 0 0;
        }

        .banner-script-text {
          display: flex;
          flex-direction: column;
          text-align: right;
          color: #0D7A75;
          font-weight: 700;
          font-size: 0.9375rem;
          line-height: 1.25;
        }

        .script-happier {
          font-size: 0.875rem;
          font-weight: 800;
        }

        /* Order Items Table Section */
        .invoice-items-section {
          margin-bottom: 26px;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .section-heading-text {
          font-size: 1rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .invoice-table-container {
          overflow-x: auto;
        }

        .invoice-doc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .invoice-doc-table thead tr {
          border-bottom: 1.5px solid #F1F5F9;
        }

        .invoice-doc-table th {
          padding: 10px 8px;
          font-weight: 600;
          color: #64748B;
          text-align: left;
        }

        .th-idx {
          width: 30px;
        }

        .th-icon-gap {
          width: 40px;
        }

        .th-service {
          text-align: left;
        }

        .th-qty {
          text-align: center;
        }

        .th-rate {
          text-align: right;
        }

        .th-amount {
          text-align: right;
        }

        .invoice-doc-table tbody tr {
          border-bottom: 1px solid #F8FAFC;
        }

        .invoice-doc-table td {
          padding: 14px 8px;
          vertical-align: middle;
        }

        .td-idx {
          color: #64748B;
          font-weight: 600;
        }

        .item-icon-square {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-title-bold {
          font-weight: 700;
          color: #0F172A;
        }

        .item-subtitle-sub {
          font-size: 0.78rem;
          color: #64748B;
          margin-top: 1px;
        }

        .td-qty {
          text-align: center;
          color: #334155;
          font-weight: 500;
        }

        .td-rate {
          text-align: right;
          color: #334155;
          font-weight: 500;
        }

        .td-amount {
          text-align: right;
          font-weight: 700;
          color: #0F172A;
        }

        /* Bottom Split: Care Instructions (Left) + Totals Breakdown (Right) */
        .invoice-bottom-split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          align-items: flex-start;
          padding-top: 16px;
        }

        .care-instructions-card {
          background: #ffffff;
          border: 1.5px solid #F1F5F9;
          border-radius: 14px;
          padding: 18px 20px;
        }

        .care-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .care-card-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .care-points-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .care-points-list li {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 0.8125rem;
          color: #334155;
        }

        .check-bullet {
          color: #0D7A75;
          flex-shrink: 0;
        }

        .totals-breakdown-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .totals-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.9375rem;
        }

        .total-label {
          color: #64748B;
          font-weight: 500;
        }

        .total-val {
          font-weight: 700;
          color: #0F172A;
        }

        .discount-val {
          color: #10B981;
        }

        .total-grand-highlight-box {
          background: #E8FAF6;
          border-radius: 12px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
        }

        .grand-label {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0D7A75;
        }

        .grand-val {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: -0.02em;
        }

        /* 4. Modal Styles */
        .invoice-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .invoice-modal-container {
          background: #ffffff;
          border-radius: 20px;
          max-width: 890px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          animation: modalFadeIn 0.2s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .modal-action-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1.5px solid #0D7A75;
          background: #ffffff;
          color: #0D7A75;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .modal-action-pill:hover {
          background: #E8FAF6;
        }

        .modal-close-circle-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: #F1F5F9;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .modal-close-circle-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        @media (max-width: 900px) {
          .bill-to-meta-grid {
            grid-template-columns: 1fr;
          }
          .invoice-bottom-split-grid {
            grid-template-columns: 1fr;
          }
          .tax-invoice-document-card {
            padding: 24px 20px;
          }
        }

        /* 5. Precision Print Styles for Download PDF & Print */
        @media print {
          @page {
            size: portrait;
            margin: 8mm 12mm;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide everything not part of the invoice card */
          header,
          footer,
          nav,
          .navbar,
          .no-print,
          .invoice-header-row,
          .customer-orders-invoices-card,
          .section-inline-title-row,
          .invoice-modal-top-bar,
          .btn,
          button {
            display: none !important;
          }

          .portal-container,
          .invoice-page-portal,
          .invoice-centered-container,
          .invoice-modal-overlay,
          .invoice-modal-container {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
            box-shadow: none !important;
            position: static !important;
          }

          .tax-invoice-document-card {
            width: 100% !important;
            max-width: 100% !important;
            border: 1.5px solid #CBD5E1 !important;
            border-radius: 16px !important;
            box-shadow: none !important;
            padding: 24px !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            background: #ffffff !important;
          }

          .thank-you-mint-banner {
            background: #E8FAF6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .total-grand-highlight-box {
            background: #E8FAF6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .paid-pill-badge {
            background: #E6FBF2 !important;
            color: #059669 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .item-icon-square {
            background: #E8FAF6 !important;
            color: #0D7A75 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .brand-circle-logo {
            background: #0D7A75 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentsInvoices;
