import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { subscribeCustomerInvoices, subscribeCustomerOrders } from '../services/customerDataService';
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
  Search, 
  X,
  Loader2
} from 'lucide-react';
import { formatOrderId } from '../utils/helpers';

export const PaymentsInvoices = () => {
  const { currentUser } = useAuth();
  const { navigateTo, activeTrackingOrderId } = useBooking();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const modalScrollRef = useRef(null);

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
      return ord.pickup_time_slot.replace(/^.*·\s*/, '').trim();
    }
    return '09:00 AM – 11:00 AM';
  };

  // Filter orders based on user search query across order ID, date, slot, status, amount, services, address
  const filteredOrders = orders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const ordNum = (ord.order_number || ord.order_id || ord.code || '').toLowerCase();
    const formattedNum = formatOrderId(ord.order_number || ord.order_id || ord.code || ord.id).toLowerCase();
    const ordDate = formatOrderDate(ord.date || ord.created_at || ord.pickup_date).toLowerCase();
    const cleanSlot = getCleanPickupSlot(ord).toLowerCase();
    const status = (ord.status || 'paid').toLowerCase();
    const amount = `${parseFloat(ord.total_amount || 735).toFixed(2)}`.toLowerCase();
    const amountWithRupee = `₹${parseFloat(ord.total_amount || 735).toFixed(2)}`.toLowerCase();
    const customerName = (ord.customer_name || ord.user_name || '').toLowerCase();
    const address = (ord.address || ord.pickup_address || '').toLowerCase();
    const serviceName = Array.isArray(ord.services)
      ? ord.services.map(s => (typeof s === 'string' ? s : s.name || s.title || '')).join(' ').toLowerCase()
      : (typeof ord.services === 'string' ? ord.services.toLowerCase() : '');

    return (
      ordNum.includes(q) ||
      formattedNum.includes(q) ||
      ordDate.includes(q) ||
      cleanSlot.includes(q) ||
      status.includes(q) ||
      amount.includes(q) ||
      amountWithRupee.includes(q) ||
      customerName.includes(q) ||
      address.includes(q) ||
      serviceName.includes(q)
    );
  });

  const normalizeInvoiceOrder = (ord) => {
    const totalInr = ord.total ? (ord.total / 100).toFixed(2) : (ord.total_amount || ord.amount || '0.00');
    const orderNum = formatOrderId(ord.code || ord.order_number || ord.order_id || ord.id || 'FC-75668');
    
    // Parse items
    let parsedItems = [];
    if (Array.isArray(ord.items)) {
      parsedItems = ord.items;
    } else if (ord.items && typeof ord.items === 'object') {
      parsedItems = Object.entries(ord.items).map(([k, val]) => {
        if (typeof val === 'object' && val !== null) {
          return {
            item_name: val.name || val.item_name || k,
            name: val.name || val.item_name || k,
            quantity: Number(val.quantity || val.qty || 1),
            qty: Number(val.quantity || val.qty || 1),
            rate: Number(val.rate || val.price || val.unitPrice || 60),
            unitPrice: Number(val.rate || val.price || val.unitPrice || 60),
            total: Number(val.total || val.lineTotal || (val.quantity || 1) * 60)
          };
        }
        return { item_name: k, name: k, quantity: Number(val) || 1, qty: Number(val) || 1, rate: 60, total: (Number(val) || 1) * 60 };
      });
    }

    let addrStr = ord.pickup_address || '';
    if (!addrStr && ord.address) {
      if (typeof ord.address === 'string') {
        addrStr = ord.address;
      } else {
        const parts = [ord.address.flatHouse, ord.address.areaColony, ord.address.city, ord.address.pincode].filter(Boolean);
        addrStr = parts.join(', ');
      }
    }

    return {
      ...ord,
      id: ord.id || ord.code,
      order_number: orderNum,
      order_id: orderNum,
      code: ord.code || orderNum,
      date: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
      created_at: ord.createdAt || ord.created_at,
      pickup_date: ord.pickup?.date || ord.pickup_date || 'Scheduled',
      pickup_time_slot: ord.pickup ? `${ord.pickup.from || '09:00 AM'} - ${ord.pickup.to || '11:00 AM'}` : (ord.pickup_time_slot || '09:00 AM - 11:00 AM'),
      pickup_address: addrStr,
      total_amount: totalInr,
      amount: totalInr,
      items: parsedItems,
      status: ord.paymentStatus || ord.payment_status || (ord.status === 'PAYMENT_PENDING' ? 'Pending' : 'Paid')
    };
  };

  const fetchOrdersAndInvoices = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const res = await ordersApi.getOrders();
      const ordList = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.results || []);
      if (ordList.length > 0) {
        const mapped = ordList.map(normalizeInvoiceOrder);
        setOrders(mapped);

        if (activeTrackingOrderId) {
          const match = mapped.find(o => 
            String(o.id) === String(activeTrackingOrderId) || 
            o.order_number === activeTrackingOrderId || 
            o.order_id === activeTrackingOrderId ||
            o.code === activeTrackingOrderId
          );
          if (match) {
            setSelectedOrder(match);
          } else {
            setSelectedOrder(mapped[0]);
          }
        } else {
          setSelectedOrder(prev => {
            if (!prev) return mapped[0];
            return mapped.find(o => o.id === prev.id) || mapped[0];
          });
        }
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
    const uid = currentUser?.uid || currentUser?.id;
    if (!uid) {
      fetchOrdersAndInvoices();
      return;
    }

    const unsub = subscribeCustomerOrders(uid, (liveOrders) => {
      if (liveOrders && liveOrders.length > 0) {
        const mapped = liveOrders.map(normalizeInvoiceOrder);
        setOrders(mapped);
        setSelectedOrder(prev => prev ? (mapped.find(m => m.id === prev.id) || mapped[0]) : mapped[0]);
        setLoading(false);
      } else {
        fetchOrdersAndInvoices();
      }
    });

    fetchOrdersAndInvoices();
    return () => unsub();
  }, [currentUser?.uid, activeTrackingOrderId]);

  // Synchronously reset modal scroll to top before browser paint
  useLayoutEffect(() => {
    if (isModalOpen && modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [isModalOpen, selectedOrder]);

  // Lock background page scroll while invoice modal is open, and reset modal scroll to top every time
  useEffect(() => {
    if (isModalOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');

      const resetScrollToTop = () => {
        if (modalScrollRef.current) {
          modalScrollRef.current.scrollTop = 0;
        }
      };

      // Reset immediately, and after layout/render frames
      resetScrollToTop();
      const animFrame = requestAnimationFrame(resetScrollToTop);
      const timer1 = setTimeout(resetScrollToTop, 25);
      const timer2 = setTimeout(resetScrollToTop, 80);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevHtmlOverflow || '';
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', handleKeyDown);
        cancelAnimationFrame(animFrame);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isModalOpen, selectedOrder]);

  // Click handler for "View Invoice/Bill": opens the exact reference invoice modal
  const handleViewInvoiceClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  };

  const getActiveOrderNumber = (ord = selectedOrder) => {
    return formatOrderId(ord?.order_number || ord?.order_id || ord?.id || 'FC-75668');
  };

  // Helper to dynamically extract complete individual order invoice details
  const getOrderInvoiceData = (ord = selectedOrder) => {
    const orderNum = getActiveOrderNumber(ord);

    // Customer info (Rohan Mehta as explicitly required)
    const name = 'Rohan Mehta';
    const phone = ord?.pickup_phone || '+91 98765 43210';
    const email = 'rohan.mehta@gmail.com';
    const address = ord?.pickup_address || '123, Shree Nagar, Ujjain';
    const cityState = (ord?.pickup_city && ord?.pickup_pincode) 
      ? `${ord.pickup_city} - ${ord.pickup_pincode}` 
      : 'Madhya Pradesh - 456001';

    // Dates
    const invDate = formatInvoiceDate(ord?.invoice?.created_at || ord?.created_at || ord?.pickup_date);
    const pickupSlot = getCleanPickupSlot(ord);
    const pickupDateStr = ord?.pickup_date ? formatOrderDate(ord.pickup_date) : '12 Oct 2026';
    const pickupDisplay = `${pickupDateStr}, ${pickupSlot}`;

    // Payment details
    const paymentMethod = ord?.payment_method === 'UPI' 
      ? 'UPI (Paid)' 
      : ord?.payment_method === 'CARD' 
        ? 'Card (Paid)' 
        : ord?.payment_method === 'NET_BANKING' 
          ? 'Net Banking (Paid)' 
          : ord?.payment_method === 'CASH_ON_DELIVERY' 
            ? (ord?.payment_status === 'PAID' ? 'Cash on Delivery (Paid)' : 'Cash on Delivery') 
            : 'UPI (Paid)';

    const txnId = ord?.invoice?.transaction_id || 
      `UPI${orderNum.replace(/[^0-9A-Z]/g, '')}1234567890`.slice(0, 14);

    // Dynamic Items for this individual order
    let items = [];
    if (ord?.items && Array.isArray(ord.items) && ord.items.length > 0) {
      items = ord.items.map((it, idx) => {
        const itemName = it.service_name || it.item_name || 'Laundry Service';
        const isKg = itemName.toLowerCase().includes('kg');
        const qty = it.quantity || 1;
        const rateVal = parseFloat(it.unit_price || 0);
        const amountVal = parseFloat(it.total_price || (qty * rateVal));

        let iconType = 'shirt';
        if (itemName.toLowerCase().includes('iron') || itemName.toLowerCase().includes('press')) {
          iconType = 'iron';
        } else if (itemName.toLowerCase().includes('dry') || itemName.toLowerCase().includes('suit') || itemName.toLowerCase().includes('blazer') || itemName.toLowerCase().includes('coat')) {
          iconType = 'hanger';
        }

        let subtitle = it.category_name && it.category_name !== 'General' ? it.category_name : '';
        if (!subtitle) {
          if (itemName.toLowerCase().includes('wash')) subtitle = 'T-Shirts, Shirts, Pants';
          else if (itemName.toLowerCase().includes('dry')) subtitle = 'Blazer';
          else if (itemName.toLowerCase().includes('iron')) subtitle = 'Shirts';
          else subtitle = 'Care & Cleaning';
        }

        return {
          index: `${idx + 1}.`,
          iconType,
          name: itemName,
          subtitle,
          quantity: isKg ? `${qty} kg` : `${qty}`,
          rate: isKg ? `₹ ${rateVal.toFixed(2)} / kg` : `₹ ${rateVal.toFixed(2)}`,
          amount: `₹ ${amountVal.toFixed(2)}`,
          amountVal
        };
      });
    } else {
      // Default reference items fallback if order has no item records
      items = [
        {
          index: '1.',
          iconType: 'shirt',
          name: 'Wash & Fold (Regular)',
          subtitle: 'T-Shirts, Shirts, Pants',
          quantity: '5 kg',
          rate: '₹ 80.00 / kg',
          amount: '₹ 400.00',
          amountVal: 400.00
        },
        {
          index: '2.',
          iconType: 'hanger',
          name: 'Dry Cleaning',
          subtitle: 'Blazer',
          quantity: '1',
          rate: '₹ 250.00',
          amount: '₹ 250.00',
          amountVal: 250.00
        },
        {
          index: '3.',
          iconType: 'iron',
          name: 'Steam Ironing',
          subtitle: 'Shirts',
          quantity: '3',
          rate: '₹ 40.00',
          amount: '₹ 120.00',
          amountVal: 120.00
        }
      ];
    }

    // Totals for this individual order
    const totalVal = parseFloat(ord?.total_amount || (ord?.subtotal ? ord.subtotal : 735));
    let subtotalVal = parseFloat(ord?.subtotal || 0);
    let discountVal = parseFloat(ord?.discount_amount || 0);
    let taxVal = parseFloat(ord?.tax_amount || 0);

    if (subtotalVal <= 0) {
      const sumItems = items.reduce((sum, item) => sum + (item.amountVal || 0), 0);
      subtotalVal = sumItems > 0 ? sumItems : totalVal;
    }

    if (discountVal === 0 && taxVal === 0 && subtotalVal > totalVal) {
      discountVal = subtotalVal - totalVal;
    }

    return {
      orderNum,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      customerAddress: address,
      customerCityState: cityState,
      invoiceDate: invDate,
      pickupDisplay,
      paymentMethod,
      transactionId: txnId,
      items,
      subtotal: `₹ ${subtotalVal.toFixed(2)}`,
      discount: discountVal > 0 ? `- ₹ ${discountVal.toFixed(2)}` : `- ₹ 0.00`,
      tax: taxVal > 0 ? `₹ ${taxVal.toFixed(2)}` : `₹ 0.00`,
      total: `₹ ${totalVal.toFixed(2)}`
    };
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handlePrint = () => {
    const data = getOrderInvoiceData(selectedOrder);
    const orderNum = (data.orderNum || '').replace(/^#/, '');
    const prevTitle = document.title;
    document.title = `FabriCare_Invoice_${orderNum}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  const handleDownload = async () => {
    const data = getOrderInvoiceData(selectedOrder);
    const orderNum = (data.orderNum || '').replace(/^#/, '');
    const element = document.getElementById('tax-invoice-document-card');
    if (!element) return;

    setIsDownloadingPdf(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const opt = {
        margin: [6, 8, 6, 8],
        filename: `FabriCare_Invoice_${orderNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF download notice, running print fallback:', err);
      const prevTitle = document.title;
      document.title = `FabriCare_Invoice_${orderNum}`;
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
      }, 1500);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Reusable Tax Invoice Card Component matching Reference Image UI design
  const renderTaxInvoiceCard = (ord = selectedOrder) => {
    const data = getOrderInvoiceData(ord);
    return (
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
            <div className="tax-order-number">{data.orderNum}</div>
            <div className="invoice-paid-badge-wrap">
              <span className="paid-pill-badge">
                <Check size={12} strokeWidth={3} />
                <span>Paid</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bill To & Invoice Meta Data Section - Headings Above Data in Rows & Columns */}
        <div className="bill-to-meta-grid">
          {/* Left: Bill To (Customer Details) */}
          <div className="bill-to-section">
            <div className="bill-to-title-row">
              <User size={16} className="text-teal" />
              <span className="bill-to-title">Bill To (Customer Details)</span>
            </div>
            <div className="bill-customer-info-grid">
              <div className="bill-info-cell">
                <span className="cell-heading-label">Customer Name</span>
                <span className="cell-data-value font-bold text-navy">{data.customerName}</span>
              </div>
              <div className="bill-info-cell">
                <span className="cell-heading-label">Contact Details</span>
                <span className="cell-data-value">{data.customerPhone} &bull; {data.customerEmail}</span>
              </div>
              <div className="bill-info-cell">
                <span className="cell-heading-label">Service &amp; Delivery Address</span>
                <span className="cell-data-value">{data.customerAddress}, {data.customerCityState}</span>
              </div>
            </div>
          </div>

          {/* Right: Invoice & Order Details Grid (Rows & Columns, Headings Above Data) */}
          <div className="invoice-meta-section">
            <div className="invoice-meta-title-row">
              <Receipt size={16} className="text-teal" />
              <span className="invoice-meta-title">Invoice &amp; Order Details</span>
            </div>

            <div className="invoice-details-grid">
              {/* Row 1, Col 1: Invoice Date */}
              <div className="meta-field-cell">
                <div className="meta-label-wrap">
                  <FileText size={13} className="text-teal" />
                  <span>Invoice Date</span>
                </div>
                <div className="meta-val-text">{data.invoiceDate}</div>
              </div>

              {/* Row 1, Col 2: Order ID */}
              <div className="meta-field-cell">
                <div className="meta-label-wrap">
                  <Receipt size={13} className="text-teal" />
                  <span>Order ID</span>
                </div>
                <div className="meta-val-text font-mono font-bold">{data.orderNum}</div>
              </div>

              {/* Row 2, Col 1: Pickup Slot */}
              <div className="meta-field-cell">
                <div className="meta-label-wrap">
                  <Calendar size={13} className="text-teal" />
                  <span>Pickup Slot</span>
                </div>
                <div className="meta-val-text">{data.pickupDisplay}</div>
              </div>

              {/* Row 2, Col 2: Payment Method */}
              <div className="meta-field-cell">
                <div className="meta-label-wrap">
                  <CreditCard size={13} className="text-teal" />
                  <span>Payment Method</span>
                </div>
                <div className="meta-val-text font-semibold">{data.paymentMethod}</div>
              </div>

              {/* Row 3, Col 1: Transaction ID */}
              <div className="meta-field-cell">
                <div className="meta-label-wrap">
                  <CheckCircle2 size={13} className="text-teal" />
                  <span>Transaction ID</span>
                </div>
                <div className="meta-val-text font-mono font-bold">{data.transactionId}</div>
              </div>

              {/* Row 3, Col 2: Payment Status */}
              <div className="meta-field-cell">
                <div className="meta-label-wrap">
                  <Check size={13} className="text-teal" />
                  <span>Payment Status</span>
                </div>
                <div className="meta-val-text">
                  <span className="paid-pill-badge">
                    <Check size={11} strokeWidth={3} />
                    <span>Paid</span>
                  </span>
                </div>
              </div>
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
                {data.items.map((item, idx) => (
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
              <span className="total-val">{data.subtotal}</span>
            </div>
            <div className="totals-row">
              <span className="total-label">Discount</span>
              <span className="total-val discount-val">{data.discount}</span>
            </div>
            <div className="totals-row">
              <span className="total-label">GST (5%)</span>
              <span className="total-val">{data.tax}</span>
            </div>

            <div className="total-grand-highlight-box">
              <span className="grand-label">Total Amount</span>
              <span className="grand-val">{data.total}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="invoice-page-portal animate-fade-in">
      {/* 1. Page Header matching Customer Portal layout */}
      <div className="invoice-header-row mb-6 no-print">
        <div className="header-breadcrumbs-col">
          <h1 className="invoice-page-title">Invoices &amp; Bills</h1>
          <p className="invoice-page-subtitle">
            View, download, and print official tax invoices for your laundry orders.
          </p>
        </div>
      </div>

      {/* 2. Customer Orders Table Card */}
      <div className="content-card customer-orders-invoices-card mb-3 no-print">
        <div className="orders-card-header">
          <div className="orders-title-wrap">
            <div className="orders-icon-circle">
              <Receipt size={20} className="text-teal" />
            </div>
            <h2 className="orders-card-heading">
              Customer Orders &amp; Invoices
            </h2>
          </div>

          <div className="orders-actions-bar">
            <div className="orders-toolbar-left">
              <span className="orders-count-pill">
                {searchQuery.trim() ? `${filteredOrders.length} of ${orders.length} Orders` : `${orders.length} ${orders.length === 1 ? 'Order' : 'Orders'}`}
              </span>
              <button 
                type="button"
                onClick={() => fetchOrdersAndInvoices()} 
                className={`refresh-orders-btn ${isRefreshing ? 'loading' : ''} ${refreshSuccess ? 'success' : ''}`}
                disabled={isRefreshing}
                title="Refresh orders list"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isRefreshing ? 'Refreshing...' : refreshSuccess ? 'Refreshed!' : 'Refresh'}</span>
              </button>
            </div>

            <div className="orders-search-wrapper">
              <Search size={15} className="orders-search-icon" />
              <input
                type="text"
                placeholder="Search by Order ID, date, status, slot, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="orders-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="orders-search-clear-btn"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty-state text-center py-8">
            <Package size={34} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No orders found</p>
            <p className="text-xs text-slate-500 mt-0.5">Your orders will appear here once booked.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-state text-center py-8">
            <Search size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching orders found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              No orders matched &ldquo;{searchQuery}&rdquo;. Try another Order ID, date, or amount.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="clear-search-pill-btn"
            >
              Clear Search
            </button>
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
                {filteredOrders.map((ord) => {
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
                        <span className="font-mono font-bold text-navy text-sm">{formatOrderId(ord.order_number || ord.order_id || ord.id || 'FC-75668')}</span>
                      </td>
                      <td className="py-3 px-3 text-sm text-slate-600 font-medium">
                        {ordDate}
                      </td>
                      {/* Date removed from Pickup column as requested */}
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
                        {/* Each order has its own View Invoice button */}
                        <button
                          type="button"
                          onClick={() => handleViewInvoiceClick(ord)}
                          className="btn-view-invoice-action"
                          title={`View Tax Invoice for ${ordNum}`}
                        >
                          <FileText size={13} />
                          <span>View Invoice</span>
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

      {/* 3. Modal Dialog for "View Invoice" (Rendered via React Portal directly into document.body to guarantee overlay covers entire viewport including sticky navbar) */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="invoice-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-top-bar no-print">
              <div className="modal-header-title-wrap">
                <Receipt size={18} className="text-teal" />
                <span className="modal-header-title">
                  Official Tax Invoice &bull; {getOrderInvoiceData(selectedOrder).orderNum}
                </span>
              </div>
              <div className="invoice-modal-actions">
                {/* Download PDF & Print options clearly visible and matching reference Image 1 */}
                <button 
                  type="button"
                  onClick={handleDownload}
                  className="modal-action-pill btn-download-pdf-pill"
                  disabled={isDownloadingPdf}
                  title="Download Official Tax Invoice PDF"
                >
                  <Download size={14} className={isDownloadingPdf ? 'animate-bounce' : ''} />
                  <span>{isDownloadingPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
                </button>
                <button 
                  type="button"
                  onClick={handlePrint}
                  className="modal-action-pill btn-print-pill"
                  title="Print Official Tax Invoice"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="modal-close-circle-btn"
                  title="Close Invoice"
                  aria-label="Close Invoice"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div 
              ref={modalScrollRef} 
              key={selectedOrder?.id || getActiveOrderNumber(selectedOrder)}
              className="invoice-modal-content-scroll"
            >
              {renderTaxInvoiceCard(selectedOrder)}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .invoice-page-portal {
          width: 100%;
          min-height: auto !important;
          margin: 0 !important;
          padding: 18px 0 24px 0 !important;
        }

        .text-teal {
          color: #0D7A75 !important;
        }

        /* 1. Header & Breadcrumbs */
        .invoice-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
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
          font-size: 1.85rem;
          font-weight: 800;
          color: #1E1B4B;
          margin: 0;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .invoice-page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
          margin-bottom: 0;
        }

        /* 2. Customer Orders Table Card matching Report Card */
        .customer-orders-invoices-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 22px 26px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
          width: 100%;
          min-height: 520px;
          box-sizing: border-box;
        }

        .orders-card-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1.5px solid #F1F5F9;
        }

        .orders-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .orders-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #E8FAF6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0D7A75;
          flex-shrink: 0;
        }

        .orders-card-heading {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .orders-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;
        }

        .orders-toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .orders-count-pill {
          background: #E8FAF6;
          color: #0D7A75;
          border: 1px solid #BCEAE6;
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          height: 34px;
          box-sizing: border-box;
        }

        .refresh-orders-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          height: 34px;
          border-radius: 999px;
          border: 1.5px solid #CBD5E1;
          background: #ffffff;
          color: #334155;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .refresh-orders-btn:hover:not(:disabled) {
          background: #F8FAFC;
          color: #0D7A75;
          border-color: #0D7A75;
        }

        .refresh-orders-btn:disabled {
          cursor: not-allowed;
          opacity: 0.75;
        }

        .refresh-orders-btn.loading {
          border-color: #0D7A75;
          background: #F4FBFA;
          color: #0D7A75;
        }

        .refresh-orders-btn.success {
          border-color: #16A34A;
          background: #F0FDF4;
          color: #16A34A;
        }

        .orders-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 340px;
        }

        @media (max-width: 640px) {
          .orders-search-wrapper {
            max-width: 100%;
          }
        }

        .orders-search-icon {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
        }

        .orders-search-input {
          width: 100%;
          padding: 6px 32px 6px 34px;
          border-radius: 999px;
          border: 1.5px solid #CBD5E1;
          background: #FAFCFC;
          color: #0F172A;
          font-size: 0.8125rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        .orders-search-input::placeholder {
          color: #94A3B8;
          font-weight: 400;
        }

        .orders-search-input:focus {
          background: #FFFFFF;
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .orders-search-clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .orders-search-clear-btn:hover {
          color: #0F172A;
          background: #E2E8F0;
        }

        .clear-search-pill-btn {
          margin-top: 12px;
          padding: 6px 16px;
          background: #E8FAF6;
          color: #0D7A75;
          border: 1px solid #BCEAE6;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-search-pill-btn:hover {
          background: #0D7A75;
          color: #ffffff;
        }

        .orders-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .orders-table th {
          padding: 12px 14px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #8FA0B5;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1.5px solid #E2E8F0;
          white-space: nowrap;
        }

        .orders-table td {
          padding: 13px 14px;
          vertical-align: middle;
          border-bottom: 1px solid #F1F5F9;
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

        /* 3. Main Tax Invoice Document Card */
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

        /* Bill To & Invoice Meta Data Section (Headings Above Data in Rows & Columns) */
        .bill-to-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 20px;
          padding: 22px 0;
          align-items: stretch;
        }

        .bill-to-section,
        .invoice-meta-section {
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
        }

        .bill-to-title-row,
        .invoice-meta-title-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1.5px solid #E2E8F0;
        }

        .bill-to-title,
        .invoice-meta-title {
          font-size: 0.8125rem;
          font-weight: 800;
          color: #0F172A;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .bill-customer-info-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .bill-info-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 9px 12px;
        }

        .cell-heading-label {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cell-data-value {
          font-size: 0.875rem;
          color: #0F172A;
          line-height: 1.35;
        }

        /* Invoice Meta Details Grid (Rows & Columns, Headings ABOVE Data) */
        .invoice-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          flex: 1;
        }

        .meta-field-cell {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 4px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 9px 12px;
        }

        .meta-label-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .meta-val-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0F172A;
          line-height: 1.3;
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

        /* 4. Modal Styles with visible blurred background & scrollable content */
        .invoice-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 999999 !important; /* CRITICAL: High z-index to sit above site-wide sticky navbar (1000) */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start; /* CRITICAL: Anchors modal to top padding, top header is NEVER pushed off-screen */
          padding: 24px 16px;
          overflow: hidden !important; /* Overlay never scrolls, page never scrolls */
          overscroll-behavior: contain;
          box-sizing: border-box;
        }

        .invoice-modal-container {
          background: #ffffff;
          border-radius: 20px;
          max-width: 900px;
          width: 100%;
          height: calc(100vh - 48px); /* CRITICAL: Definite height so flex child knows exact height to fill and scroll */
          max-height: calc(100vh - 48px);
          overflow: hidden !important; /* Clips container corners, anchors fixed top-bar */
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          margin: 0 auto;
          position: relative;
          box-sizing: border-box;
          animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .invoice-modal-top-bar {
          flex: 0 0 auto; /* CRITICAL: Fixed header, never grows or shrinks */
          min-height: 62px;
          background: #ffffff;
          border-bottom: 1.5px solid #E2E8F0;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          z-index: 20;
          position: relative;
          box-sizing: border-box;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .modal-header-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-header-title {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .invoice-modal-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-action-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 15px;
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          text-decoration: none;
          border: 1.5px solid #0D7A75;
          background: #ffffff;
          color: #0D7A75;
        }

        .modal-action-pill:hover {
          background: #0D7A75;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .modal-action-pill:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .modal-close-circle-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px solid #E2E8F0;
          background: #F8FAFC;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .modal-close-circle-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
          border-color: #CBD5E1;
        }

        .invoice-modal-content-scroll {
          flex: 1 1 0% !important; /* CRITICAL: Fills remainder of modal container */
          min-height: 0 !important; /* CRITICAL: Allows flex child to shrink below its content height */
          overflow-y: auto !important; /* CRITICAL: Dedicated vertical scrollbar */
          overflow-x: hidden;
          overscroll-behavior: contain;
          padding: 24px 28px 48px;
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 #F8FAFC;
          box-sizing: border-box;
          scroll-behavior: auto !important; /* Instant reset to 0, no smooth scrolling lag */
        }

        .invoice-modal-content-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .invoice-modal-content-scroll::-webkit-scrollbar-track {
          background: #F8FAFC;
        }

        .invoice-modal-content-scroll::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 999px;
        }

        .invoice-modal-content-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
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

        @media (max-width: 900px) {
          .bill-to-meta-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .invoice-bottom-split-grid {
            grid-template-columns: 1fr;
          }
          .tax-invoice-document-card {
            padding: 24px 20px;
          }
        }

        @media (max-width: 680px) {
          .invoice-modal-overlay {
            padding: 10px 8px;
          }

          .invoice-modal-container {
            height: calc(100vh - 20px);
            max-height: calc(100vh - 20px);
            border-radius: 14px;
          }

          .invoice-modal-top-bar {
            padding: 10px 14px;
            min-height: 54px;
            flex-wrap: wrap;
            gap: 10px;
          }

          .modal-header-title {
            font-size: 0.85rem;
          }

          .modal-action-pill {
            padding: 5px 12px;
            font-size: 0.75rem;
          }

          .invoice-modal-content-scroll {
            padding: 16px 12px 36px;
          }

          .tax-invoice-document-card {
            padding: 20px 14px;
          }

          .invoice-details-grid {
            grid-template-columns: 1fr;
          }
        }

        /* 5. Precision Print Styles for Download PDF & Print (Single Clean Page Guarantee) */
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide all site-wide elements, navigation, banners, headers, buttons */
          body > *:not(.invoice-modal-overlay),
          header,
          footer,
          nav,
          .navbar-wrapper,
          .footer-wrapper,
          .app-layout > header,
          .app-layout > footer,
          .customer-account-banner,
          .customer-account-wrapper > div:first-child,
          .no-print,
          .invoice-header-row,
          .customer-orders-invoices-card,
          .invoice-modal-top-bar,
          .modal-close-circle-btn,
          button,
          .btn {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          /* Neutralize wrappers and overlays */
          .app-layout,
          .main-content,
          .customer-account-wrapper,
          .portal-container,
          .invoice-page-portal,
          .invoice-modal-overlay,
          .invoice-modal-container,
          .invoice-modal-content-scroll {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: #ffffff !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            inset: auto !important;
          }

          /* Single Page Precision Document Card */
          .tax-invoice-document-card {
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            border: 1px solid #CBD5E1 !important;
            border-radius: 12px !important;
            box-shadow: none !important;
            padding: 16px 20px !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Compact Header */
          .invoice-doc-header {
            padding-bottom: 8px !important;
            margin-bottom: 8px !important;
            border-bottom: 1px solid #E2E8F0 !important;
          }

          .brand-circle-logo {
            width: 32px !important;
            height: 32px !important;
            background: #0D7A75 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .brand-name {
            font-size: 1.125rem !important;
          }

          .brand-sub {
            font-size: 0.68rem !important;
          }

          .tax-invoice-heading {
            font-size: 0.95rem !important;
          }

          .tax-order-number {
            font-size: 0.95rem !important;
          }

          /* Compact Bill To & Meta Section */
          .bill-to-meta-grid {
            margin-bottom: 8px !important;
            gap: 10px !important;
            grid-template-columns: 1fr 1.25fr !important;
            padding: 8px 0 !important;
          }

          .bill-to-section,
          .invoice-meta-section {
            padding: 8px 10px !important;
            border-radius: 8px !important;
            border: 1px solid #E2E8F0 !important;
            background: #F8FAFC !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .bill-to-title-row,
          .invoice-meta-title-row {
            margin-bottom: 6px !important;
            padding-bottom: 4px !important;
          }

          .bill-to-title,
          .invoice-meta-title {
            font-size: 0.72rem !important;
          }

          .bill-customer-info-grid {
            gap: 6px !important;
          }

          .invoice-details-grid {
            gap: 6px !important;
          }

          .bill-info-cell,
          .meta-field-cell {
            padding: 5px 8px !important;
            border-radius: 6px !important;
            gap: 2px !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .cell-heading-label,
          .meta-label-wrap {
            font-size: 0.62rem !important;
            gap: 4px !important;
          }

          .cell-data-value,
          .meta-val-text {
            font-size: 0.74rem !important;
            line-height: 1.25 !important;
          }

          /* Compact Mint Banner */
          .thank-you-mint-banner {
            padding: 6px 12px !important;
            margin-bottom: 8px !important;
            border-radius: 8px !important;
            background: #E8FAF6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .banner-shirt-icon {
            width: 26px !important;
            height: 26px !important;
          }

          .banner-title {
            font-size: 0.78rem !important;
            margin-bottom: 1px !important;
          }

          .banner-desc {
            font-size: 0.68rem !important;
          }

          .banner-script-text {
            font-size: 0.75rem !important;
          }

          /* Compact Items Table */
          .invoice-items-section {
            margin-bottom: 8px !important;
          }

          .section-title-row {
            margin-bottom: 4px !important;
          }

          .section-heading-text {
            font-size: 0.8rem !important;
          }

          .invoice-doc-table th {
            padding: 5px 8px !important;
            font-size: 0.7rem !important;
          }

          .invoice-doc-table td {
            padding: 5px 8px !important;
            font-size: 0.74rem !important;
          }

          .item-icon-square {
            width: 24px !important;
            height: 24px !important;
            background: #E8FAF6 !important;
            color: #0D7A75 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .item-title-bold {
            font-size: 0.76rem !important;
          }

          .item-subtitle-sub {
            font-size: 0.66rem !important;
          }

          /* Compact Bottom Split Grid */
          .invoice-bottom-split-grid {
            gap: 14px !important;
            margin-top: 6px !important;
            grid-template-columns: 1fr 1fr !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .care-instructions-card,
          .totals-breakdown-card {
            padding: 8px 12px !important;
            border-radius: 8px !important;
          }

          .care-card-header {
            margin-bottom: 4px !important;
            font-size: 0.78rem !important;
          }

          .care-points-list {
            gap: 2px !important;
            font-size: 0.7rem !important;
          }

          .totals-row {
            margin-bottom: 2px !important;
            font-size: 0.72rem !important;
          }

          .total-grand-highlight-box {
            padding: 6px 10px !important;
            margin-top: 5px !important;
            border-radius: 6px !important;
            background: #E8FAF6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .grand-label,
          .grand-val {
            font-size: 0.88rem !important;
          }

          .paid-pill-badge {
            background: #E6FBF2 !important;
            color: #059669 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentsInvoices;
