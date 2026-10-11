import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { ordersApi } from '../api/apiClient';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

const WORKFLOW_STEPS = [
  { key: 'BOOKED', label: 'Booking Placed', desc: 'Order received by FabriCare' },
  { key: 'PICKED_UP', label: 'Picked Up', desc: 'Collected by delivery agent' },
  { key: 'RECEIVED_AT_LAUNDRY', label: 'Received at Hub', desc: 'Count & weight verified' },
  { key: 'IN_PROCESS', label: 'Processing & Wash', desc: 'Washing, drying & ironing' },
  { key: 'QUALITY_CHECK', label: 'Quality Check', desc: 'Passed hygiene & stain audit' },
  { key: 'PACKED', label: 'Packed & Ready', desc: 'Sanitized & bagged for transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'On way to your doorstep' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Order completed successfully' }
];

export const TrackOrder = () => {
  const { activeTrackingOrderId, setActiveTrackingOrderId, navigateTo, startBooking } = useBooking();
  const [order, setOrder] = useState(null);
  const [allUserOrders, setAllUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTrackingOrderId) {
        const res = await ordersApi.getOrderById(activeTrackingOrderId);
        setOrder(res.data);
      } else {
        const res = await ordersApi.getOrders();
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setAllUserOrders(list);
        if (list.length > 0) {
          const active = list.find(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED') || list[0];
          setOrder(active);
        } else {
          setOrder(null);
        }
      }
    } catch (err) {
      console.error('Failed to load tracking details:', err);
      setError('Could not retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [activeTrackingOrderId]);

  // Determine active step index based on order status
  const getStepProgress = (status) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_REVIEW':
      case 'ACCEPTED':
      case 'PICKUP_ASSIGNED':
      case 'PICKUP_SCHEDULED':
      case 'PICKUP_IN_PROGRESS':
        return 0;
      case 'PICKED_UP':
        return 1;
      case 'DROPPED_OFF_AT_LAUNDRY':
      case 'RECEIVED_AT_LAUNDRY':
      case 'RECEIVED_BY_LAUNDRY':
        return 2;
      case 'INSPECTION':
      case 'IN_PROCESS':
      case 'WASHING':
      case 'DRYING':
      case 'IRONING':
        return 3;
      case 'QUALITY_CHECK':
        return 4;
      case 'PACKING':
      case 'PACKED':
      case 'READY_FOR_DELIVERY':
      case 'DELIVERY_ASSIGNED':
        return 5;
      case 'OUT_FOR_DELIVERY':
        return 6;
      case 'DELIVERED':
        return 7;
      default:
        return 0;
    }
  };

  const currentStepIndex = order ? getStepProgress(order.status) : 0;

  if (loading) {
    return (
      <div className="portal-container text-center py-20">
        <RefreshCw size={40} className="animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-navy">Connecting to FabriCare Hub...</h2>
        <p className="text-sm text-muted mt-1">Fetching authoritative real-time order tracking data</p>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="portal-container">
        <div className="content-card text-center py-16">
          <Package size={48} className="text-teal mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy">No Orders to Track Yet</h2>
          <p className="text-sm text-muted max-w-sm mx-auto mt-1 mb-6">
            You don't have an active laundry order currently being processed. Schedule a pickup to track your garments in real time!
          </p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => startBooking()}
              className="btn btn-primary"
            >
              Book a Pickup
            </button>
            <button 
              onClick={() => navigateTo('customer-orders')}
              className="btn btn-outline-primary"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-container">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigateTo('customer-orders')}
          className="btn btn-outline-secondary btn-sm flex items-center gap-1.5"
        >
          <ArrowLeft size={16} />
          <span>Back to My Orders</span>
        </button>
        <button 
          onClick={fetchOrderDetails} 
          className="btn btn-outline-primary btn-sm flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="content-card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Live Tracking</span>
              <span className="badge badge-primary">{order.status}</span>
            </div>
            <h1 className="text-2xl font-black text-navy tracking-tight">{order.order_number}</h1>
            <p className="text-xs text-muted mt-0.5">
              Scheduled pickup: <strong className="text-navy">{order.pickup_date}</strong> ({order.pickup_time_slot})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-muted block">Estimated Total</span>
              <span className="text-2xl font-black text-navy">₹{order.total_amount || order.estimated_amount || '0.00'}</span>
              <span className={`text-xs block font-bold ${order.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {order.payment_status || 'Pending Payment'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Stepper Timeline */}
        <div className="pt-8 pb-4">
          <div className="timeline-stepper">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex || order.status === 'DELIVERED';
              const isCurrent = idx === currentStepIndex && order.status !== 'DELIVERED';
              
              return (
                <div 
                  key={step.key} 
                  className={`timeline-step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                >
                  <div className="step-node">
                    {isCompleted ? (
                      <CheckCircle size={16} />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <div className="step-details">
                    <span className="step-title">{step.label}</span>
                    <span className="step-desc">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hub Verification & Discrepancy Card (if available) */}
      {(order.pickup_record || order.laundry_handover_record) && (
        <div className="content-card mb-6 border-l-4 border-l-blue-500">
          <h2 className="text-base font-bold text-navy flex items-center gap-2 mb-3">
            <ShieldCheck size={20} className="text-blue-600" />
            <span>Hub Quantity & Weight Verification</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {order.pickup_record && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-primary uppercase block mb-1">Pickup Logged by Delivery Staff</span>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-muted">Collected Bags:</span>
                  <span className="font-semibold text-navy">{order.pickup_record.bags_count} bags</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-muted">Measured Weight:</span>
                  <span className="font-semibold text-navy">{order.pickup_record.weight_kg ? `${order.pickup_record.weight_kg} kg` : 'N/A'}</span>
                </div>
                {order.pickup_record.notes && (
                  <div className="mt-2 text-xs text-slate-600">
                    <strong>Pickup Notes:</strong> {order.pickup_record.notes}
                  </div>
                )}
              </div>
            )}

            {order.laundry_handover_record && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-indigo-600 uppercase block mb-1">Laundry Facility Receipt Log</span>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-muted">Verified Bags:</span>
                  <span className="font-semibold text-navy">{order.laundry_handover_record.received_bags_count} bags</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-muted">Verified Weight:</span>
                  <span className="font-semibold text-navy">{order.laundry_handover_record.received_weight_kg ? `${order.laundry_handover_record.received_weight_kg} kg` : 'N/A'}</span>
                </div>
                {order.laundry_handover_record.has_discrepancy && (
                  <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-800 border border-amber-200 flex items-start gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>Discrepancy Logged:</strong> {order.laundry_handover_record.discrepancy_notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout: Order Items & Delivery Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items Table */}
        <div className="lg:col-span-2 content-card">
          <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
            <Package size={18} className="text-primary" />
            <span>Garment Items & Care Instructions</span>
          </h2>

          <div className="orders-table-wrapper">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Item / Service</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="font-semibold text-navy">{item.item_name}</div>
                        <span className="text-xs text-muted">{item.service_category || 'Fabric Care'}</span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{item.quantity}</span>
                      </td>
                      <td>₹{item.unit_price}</td>
                      <td className="text-right font-bold text-navy">₹{item.total_price}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-muted">
                      General Laundry Items
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={3} className="text-right font-bold text-navy pt-3">
                    Grand Total:
                  </td>
                  <td className="text-right font-black text-primary text-lg pt-3">
                    ₹{order.total_amount || order.estimated_amount || '0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.special_instructions && (
            <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-700">
              <strong className="text-blue-900 block mb-1">Customer Care Instructions:</strong>
              {order.special_instructions}
            </div>
          )}
        </div>

        {/* Right 1 Col: Assigned Staff & Address */}
        <div className="space-y-6">
          {/* Pickup & Delivery Staff Card */}
          <div className="content-card">
            <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
              <User size={16} className="text-primary" />
              <span>Assigned Personnel</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted block mb-1">Pickup Delivery Agent</span>
                <div className="font-semibold text-navy">
                  {order.assigned_delivery_staff_name || 'Dispatch pending assignment'}
                </div>
                {order.assigned_delivery_staff_name && (
                  <div className="flex items-center gap-1.5 text-xs text-primary mt-1">
                    <Phone size={12} />
                    <span>Verified FabriCare Agent</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted block mb-1">Laundry Facility Specialist</span>
                <div className="font-semibold text-navy">
                  {order.assigned_laundry_staff_name || 'Hub Operations Desk'}
                </div>
                <div className="text-xs text-muted mt-1">Careful fabric inspection & wash</div>
              </div>
            </div>
          </div>

          {/* Pickup Address Card */}
          <div className="content-card">
            <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span>Service Address</span>
            </h3>
            <p className="text-sm text-slate-700 font-medium">
              {order.pickup_address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
