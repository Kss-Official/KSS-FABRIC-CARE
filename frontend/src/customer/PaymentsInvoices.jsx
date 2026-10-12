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
  Truck, 
  ShoppingBag, 
  WashingMachine, 
  Headphones, 
  MessageSquare, 
  MapPin, 
  RefreshCw 
} from 'lucide-react';

export const PaymentsInvoices = () => {
  const { currentUser } = useAuth();
  const { navigateTo } = useBooking();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoicesApi.getInvoices();
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setInvoices(list);
    } catch (err) {
      console.warn('Invoices loading notice:', err);
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

  const handleDownload = () => {
    window.print();
  };

  // User details fallback matching reference
  const customerName = currentUser?.full_name || currentUser?.first_name || 'Priyanka Kushwah';
  const customerPhone = currentUser?.phone || '+91 98765 43210';
  const customerEmail = currentUser?.email || 'priyanka@gmail.com';
  const customerAddress = currentUser?.address || '123, Shree Nagar, Ujjain';
  const customerCityState = `${currentUser?.city || 'Madhya Pradesh'} - ${currentUser?.pincode || '456001'}`;

  return (
    <div className="portal-container invoice-page-portal animate-fade-in">
      {/* 1. Breadcrumb and Header Action Row */}
      <div className="invoice-header-row mb-6">
        <div className="header-breadcrumbs-col">
          <div className="breadcrumbs-nav">
            <span 
              onClick={() => navigateTo('home')} 
              className="breadcrumb-link"
            >
              Home
            </span>
            <span className="breadcrumb-slash">&gt;</span>
            <span 
              onClick={() => navigateTo('customer-invoices')} 
              className="breadcrumb-link"
            >
              Invoices &amp; Bills
            </span>
            <span className="breadcrumb-slash">&gt;</span>
            <span className="breadcrumb-active">Invoice</span>
          </div>

          <h1 className="invoice-page-title">Invoice Details</h1>
          <p className="invoice-page-subtitle">
            Here's your detailed invoice for order <span className="font-semibold text-navy">#FC8F71E</span>
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

      {/* 2. Main 2-Column Grid Layout: Tax Invoice Card (Left) + Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Tax Invoice Document Card */}
        <div className="lg:col-span-2 content-card tax-invoice-document-card">
          {/* Top Brand & Invoice Header */}
          <div className="invoice-doc-header">
            <div className="brand-logo-stack">
              <div className="brand-circle-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              <div className="tax-order-number">#FC8F71E</div>
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
                <span className="meta-val-text">12 Oct 2026, 10:15 AM</span>
              </div>

              <div className="meta-field-row">
                <div className="meta-label-wrap">
                  <Receipt size={15} className="text-teal" />
                  <span>Order ID</span>
                </div>
                <span className="meta-val-text font-bold">#FC8F71E</span>
              </div>

              <div className="meta-field-row">
                <div className="meta-label-wrap">
                  <Calendar size={15} className="text-teal" />
                  <span>Pickup Date</span>
                </div>
                <span className="meta-val-text">12 Oct 2026, 09:00 AM – 11:00 AM</span>
              </div>

              <div className="meta-field-row">
                <div className="meta-label-wrap">
                  <CreditCard size={15} className="text-teal" />
                  <span>Payment Method</span>
                </div>
                <span className="meta-val-text font-semibold">UPI (Paid)</span>
              </div>

              <div className="meta-field-row">
                <div className="meta-label-wrap">
                  <CheckCircle2 size={15} className="text-teal" />
                  <span>Transaction ID</span>
                </div>
                <span className="meta-val-text font-mono font-bold">UPI1234567890</span>
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
                  {/* Item 1 */}
                  <tr>
                    <td className="td-idx">1.</td>
                    <td className="td-icon">
                      <div className="item-icon-square">
                        <Shirt size={17} />
                      </div>
                    </td>
                    <td className="td-service">
                      <div className="item-title-bold">Wash &amp; Fold (Regular)</div>
                      <div className="item-subtitle-sub">T-Shirts, Shirts, Pants</div>
                    </td>
                    <td className="td-qty">5 kg</td>
                    <td className="td-rate">₹ 80.00 / kg</td>
                    <td className="td-amount">₹ 400.00</td>
                  </tr>

                  {/* Item 2 */}
                  <tr>
                    <td className="td-idx">2.</td>
                    <td className="td-icon">
                      <div className="item-icon-square">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1 .6 1.8 1.5 2.2V9L3.5 15.2A2 2 0 0 0 4.7 18.5H19.3a2 2 0 0 0 1.2-3.3L13 9V7.7a2.5 2.5 0 0 0 1.5-2.2A2.5 2.5 0 0 0 12 3z" />
                          <path d="M7.5 15.5h9" />
                        </svg>
                      </div>
                    </td>
                    <td className="td-service">
                      <div className="item-title-bold">Dry Cleaning</div>
                      <div className="item-subtitle-sub">Blazer</div>
                    </td>
                    <td className="td-qty">1</td>
                    <td className="td-rate">₹ 250.00</td>
                    <td className="td-amount">₹ 250.00</td>
                  </tr>

                  {/* Item 3 */}
                  <tr>
                    <td className="td-idx">3.</td>
                    <td className="td-icon">
                      <div className="item-icon-square">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 17h16a1 1 0 0 0 1-1c0-4-3-6-7-6H9a5 5 0 0 0-5 5v2z" />
                          <path d="M9 10V6h7v4" />
                        </svg>
                      </div>
                    </td>
                    <td className="td-service">
                      <div className="item-title-bold">Steam Ironing</div>
                      <div className="item-subtitle-sub">Shirts</div>
                    </td>
                    <td className="td-qty">3</td>
                    <td className="td-rate">₹ 40.00</td>
                    <td className="td-amount">₹ 120.00</td>
                  </tr>
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

        {/* Right 1 Col: Sidebar with 4 Information Cards */}
        <div className="invoice-sidebar-col space-y-6">
          {/* Card 1: Order Status */}
          <div className="content-card sidebar-widget-card">
            <div className="widget-header">
              <ShoppingBag size={17} className="text-teal" />
              <h3 className="widget-title">Order Status</h3>
            </div>

            {/* Horizontal mini-stepper */}
            <div className="widget-stepper-wrap">
              <div className="stepper-dots-flow">
                {/* 1. Order Placed */}
                <div className="step-node-col completed">
                  <div className="step-check-circle">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span className="node-title">Order Placed</span>
                  <span className="node-time">12 Oct, 08:45 AM</span>
                </div>

                <div className="stepper-bar-line completed"></div>

                {/* 2. Picked Up */}
                <div className="step-node-col completed">
                  <div className="step-check-circle">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span className="node-title">Picked Up</span>
                  <span className="node-time">12 Oct, 10:15 AM</span>
                </div>

                <div className="stepper-bar-line completed"></div>

                {/* 3. Cleaning & Care (Active) */}
                <div className="step-node-col active">
                  <div className="step-active-circle">
                    <WashingMachine size={15} />
                  </div>
                  <span className="node-title active-text">Cleaning &amp; Care</span>
                  <span className="node-status-tag">In Progress</span>
                </div>

                <div className="stepper-bar-line pending"></div>

                {/* 4. Ready for Delivery */}
                <div className="step-node-col pending">
                  <div className="step-pending-circle"></div>
                  <span className="node-title pending-text">Ready for Delivery</span>
                </div>

                <div className="stepper-bar-line pending"></div>

                {/* 5. Delivered */}
                <div className="step-node-col pending">
                  <div className="step-pending-circle check-outline">
                    <Check size={10} />
                  </div>
                  <span className="node-title pending-text">Delivered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Delivery Details */}
          <div className="content-card sidebar-widget-card">
            <div className="widget-header">
              <Truck size={17} className="text-teal" />
              <h3 className="widget-title">Delivery Details</h3>
            </div>

            <div className="widget-list-stack">
              {/* Pickup Address */}
              <div className="widget-info-row">
                <div className="widget-icon-box">
                  <MapPin size={16} />
                </div>
                <div className="widget-text-group flex-1">
                  <div className="flex items-center justify-between">
                    <span className="widget-field-label">Pickup Address</span>
                    <button 
                      onClick={() => navigateTo('customer-profile')}
                      className="edit-addr-link"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="widget-field-value bold leading-snug">
                    {customerAddress}, {customerCityState}
                  </p>
                </div>
              </div>

              {/* Delivery Partner */}
              <div className="widget-info-row">
                <div className="widget-icon-box">
                  <User size={16} />
                </div>
                <div className="widget-text-group">
                  <span className="widget-field-label">Delivery Partner</span>
                  <p className="widget-field-value">Awaiting assignment</p>
                </div>
              </div>

              {/* Estimated Delivery */}
              <div className="widget-info-row">
                <div className="widget-icon-box">
                  <Calendar size={16} />
                </div>
                <div className="widget-text-group">
                  <span className="widget-field-label">Estimated Delivery</span>
                  <p className="widget-field-value bold">14 Oct 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Payment Details */}
          <div className="content-card sidebar-widget-card">
            <div className="widget-header">
              <CreditCard size={17} className="text-teal" />
              <h3 className="widget-title">Payment Details</h3>
            </div>

            <div className="payment-details-stack">
              <div className="payment-detail-line">
                <span className="pay-label">Payment Status</span>
                <span className="paid-pill-badge small">
                  <Check size={11} strokeWidth={3} />
                  <span>Paid</span>
                </span>
              </div>

              <div className="payment-detail-line">
                <span className="pay-label">Transaction ID</span>
                <span className="pay-val font-mono font-bold">UPI1234567890</span>
              </div>

              <div className="payment-detail-line">
                <span className="pay-label">Payment Method</span>
                <span className="pay-val font-semibold">UPI</span>
              </div>
            </div>
          </div>

          {/* Card 4: Need help? */}
          <div className="content-card sidebar-widget-card need-help-widget">
            <div className="widget-header">
              <Headphones size={17} className="text-teal" />
              <h3 className="widget-title">Need help?</h3>
            </div>

            <p className="need-help-desc">
              We're here to assist you with any questions or concerns.
            </p>

            <div className="help-buttons-stack">
              <button 
                onClick={() => navigateTo('customer-support')}
                className="btn-contact-support-pill"
              >
                <MessageSquare size={16} />
                <span>Contact Support</span>
              </button>

              <button 
                onClick={handlePrint}
                className="btn-view-invoice-pill"
              >
                <FileText size={16} />
                <span>View Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .invoice-page-portal {
          width: 100%;
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
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .invoice-action-btn:hover {
          background: #F4FBFA;
        }

        /* 2. Main Tax Invoice Document Card */
        .tax-invoice-document-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 32px 36px;
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
          margin: 0;
          line-height: 1.1;
        }

        .brand-sub {
          font-size: 0.775rem;
          color: #64748B;
          font-weight: 500;
        }

        .tax-invoice-heading {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.04em;
          margin: 0;
        }

        .tax-order-number {
          font-size: 1rem;
          font-weight: 700;
          color: #0F172A;
          margin-top: 2px;
        }

        .invoice-paid-badge-wrap {
          margin-top: 4px;
        }

        .paid-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          background: #10B981;
          color: #ffffff;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .paid-pill-badge.small {
          padding: 2px 8px;
          font-size: 0.6875rem;
        }

        /* Bill To & Meta Grid */
        .bill-to-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 28px;
          margin-top: 24px;
        }

        .bill-to-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .bill-to-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .bill-customer-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .customer-name-bold {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
        }

        .customer-detail-text {
          font-size: 0.8125rem;
          color: #64748B;
          line-height: 1.4;
        }

        .invoice-meta-fields-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .meta-field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
        }

        .meta-label-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748B;
        }

        .meta-val-text {
          color: #0F172A;
          text-align: right;
        }

        /* Thank You Mint Banner */
        .thank-you-mint-banner {
          background: #E8FAF6;
          border: 1px solid #CCFBF1;
          border-radius: 14px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 24px;
        }

        .banner-left-msg {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .banner-shirt-icon {
          color: #0D7A75;
          display: flex;
          flex-shrink: 0;
        }

        .banner-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .banner-desc {
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 2px;
        }

        .banner-script-text {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          color: #0D7A75;
          font-weight: 800;
          font-size: 0.9375rem;
          line-height: 1.25;
        }

        .script-happier {
          font-size: 0.875rem;
        }

        /* Order Items Table Section */
        .invoice-items-section {
          margin-top: 24px;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .section-heading-text {
          font-size: 0.9375rem;
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
          font-size: 0.8125rem;
        }

        .invoice-doc-table thead th {
          text-align: left;
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748B;
          padding-bottom: 10px;
          border-bottom: 1.5px solid #EDF2F7;
        }

        .invoice-doc-table th.th-idx {
          width: 32px;
        }

        .invoice-doc-table th.th-icon-gap {
          width: 36px;
        }

        .invoice-doc-table th.th-qty {
          text-align: center;
        }

        .invoice-doc-table th.th-rate,
        .invoice-doc-table th.th-amount {
          text-align: right;
        }

        .invoice-doc-table tbody td {
          padding: 12px 0;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        .td-idx {
          color: #64748B;
          font-weight: 600;
        }

        .item-icon-square {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-title-bold {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
        }

        .item-subtitle-sub {
          font-size: 0.72rem;
          color: #64748B;
          margin-top: 1px;
        }

        .td-qty {
          text-align: center;
          color: #64748B;
          font-weight: 600;
        }

        .td-rate {
          text-align: right;
          color: #64748B;
        }

        .td-amount {
          text-align: right;
          font-weight: 700;
          color: #0F172A;
        }

        /* Bottom Split */
        .invoice-bottom-split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1.5px solid #F1F5F9;
        }

        .care-instructions-card {
          background: #FAFCFC;
          border: 1px solid #EDF2F7;
          border-radius: 14px;
          padding: 16px 20px;
        }

        .care-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .care-card-title {
          font-size: 0.875rem;
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
          gap: 8px;
          font-size: 0.78rem;
          color: #334155;
          font-weight: 500;
        }

        .check-bullet {
          color: #0D7A75;
          flex-shrink: 0;
        }

        .totals-breakdown-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .totals-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
        }

        .total-label {
          color: #64748B;
          font-weight: 500;
        }

        .total-val {
          color: #0F172A;
          font-weight: 700;
        }

        .discount-val {
          color: #059669;
        }

        .total-grand-highlight-box {
          background: #E8FAF6;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .grand-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0D7A75;
        }

        .grand-val {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0D7A75;
        }

        /* 3. Sidebar Cards */
        .sidebar-widget-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 20px 20px;
        }

        .widget-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .widget-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        /* Order Status Stepper in Widget */
        .widget-stepper-wrap {
          overflow-x: auto;
          padding: 4px 0;
        }

        .stepper-dots-flow {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          width: 100%;
          min-width: 280px;
        }

        .step-node-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
        }

        .step-check-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #0D7A75;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }

        .step-active-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #E8FAF6;
          border: 2px solid #0D7A75;
          box-shadow: 0 0 0 4px rgba(13, 122, 117, 0.15);
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }

        .step-pending-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E1;
          background: #ffffff;
          margin-bottom: 6px;
        }

        .step-pending-circle.check-outline {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
        }

        .node-title {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #0F172A;
          line-height: 1.2;
        }

        .node-title.active-text {
          color: #0D7A75;
          font-weight: 700;
        }

        .node-title.pending-text {
          color: #94A3B8;
        }

        .node-time {
          font-size: 0.625rem;
          color: #64748B;
          margin-top: 2px;
        }

        .node-status-tag {
          font-size: 0.625rem;
          font-weight: 700;
          color: #0D7A75;
          margin-top: 2px;
        }

        .stepper-bar-line {
          flex: 1;
          height: 2px;
          margin: 11px 4px 0;
        }

        .stepper-bar-line.completed {
          background: #0D7A75;
        }

        .stepper-bar-line.pending {
          background: #E2E8F0;
        }

        /* Delivery Details in Widget */
        .widget-list-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .widget-info-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 8px 10px;
          background: #FAFCFC;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
        }

        .widget-icon-box {
          color: #0D7A75;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .widget-text-group {
          display: flex;
          flex-direction: column;
        }

        .widget-field-label {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 500;
        }

        .widget-field-value {
          font-size: 0.8125rem;
          color: #0F172A;
          margin-top: 2px;
        }

        .widget-field-value.bold {
          font-weight: 700;
        }

        .edit-addr-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .edit-addr-link:hover {
          text-decoration: underline;
        }

        /* Payment Details in Widget */
        .payment-details-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .payment-detail-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
        }

        .pay-label {
          color: #64748B;
        }

        .pay-val {
          color: #0F172A;
        }

        /* Need Help Widget */
        .need-help-desc {
          font-size: 0.8125rem;
          color: #64748B;
          margin-top: -4px;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .help-buttons-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-contact-support-pill {
          width: 100%;
          padding: 11px;
          background: #0D7A75;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 999px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.18);
          transition: background 0.15s;
        }

        .btn-contact-support-pill:hover {
          background: #095F5B;
        }

        .btn-view-invoice-pill {
          width: 100%;
          padding: 10px;
          background: #ffffff;
          color: #0D7A75;
          border: 1.5px solid #0D7A75;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-view-invoice-pill:hover {
          background: #F4FBFA;
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
      `}</style>
    </div>
  );
};

export default PaymentsInvoices;
