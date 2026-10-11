import React, { useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import confetti from 'canvas-confetti';
import { Calendar, MapPin, ArrowRight, Home, RefreshCw, Package, CheckCircle2 } from 'lucide-react';

export const BookingConfirmation = () => {
  const { lastOrder, navigateTo, startBooking } = useBooking();

  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#2563EB', '#3B82F6', '#60A5FA', '#10B981']
      });
    } catch (e) {
      // Confetti fallback
    }
  }, []);

  const orderNum = lastOrder?.order_number || lastOrder?.orderId || 'ORD-PROCESSING';
  const orderDate = lastOrder?.pickup_date || lastOrder?.dateText || 'Tomorrow';
  const orderSlot = lastOrder?.pickup_time_slot || lastOrder?.timeText || '09:00 AM - 11:00 AM';
  const orderAddress = lastOrder?.pickup_address || lastOrder?.addressTitle || 'Banaswadi, Bengaluru';

  return (
    <div className="portal-container py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-xl shadow-blue-500/5 text-center animate-fade-in">
        {/* Success Icon Badge */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 size={44} />
        </div>

        <h1 className="text-3xl font-black text-navy tracking-tight">Pickup Confirmed!</h1>
        <p className="text-slate-500 mt-2 mb-8 text-sm md:text-base">
          Your laundry request has been saved to the FabriCare database and queued for pickup.
        </p>

        {/* Highlighted Order Pill Box */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-6 text-left mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-blue-200/60">
            {/* Order ID */}
            <div className="pb-3 md:pb-0">
              <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">Server Order ID</span>
              <span className="font-mono font-black text-lg md:text-xl text-navy block">{orderNum}</span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <span>●</span> <span>Database Synced</span>
              </span>
            </div>

            {/* Date & Slot */}
            <div className="pt-3 md:pt-0 md:pl-4 pb-3 md:pb-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Pickup Slot</span>
              <div className="font-bold text-navy text-sm">{orderDate}</div>
              <div className="text-xs text-slate-600">{orderSlot}</div>
            </div>

            {/* Address */}
            <div className="pt-3 md:pt-0 md:pl-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Pickup Location</span>
              <div className="text-xs text-slate-700 font-medium line-clamp-2">{orderAddress}</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-8">
          SMS and WhatsApp notifications will be sent as our delivery staff prepares for collection.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              if (lastOrder?.id) {
                navigateTo('customer-track', lastOrder.id.toString());
              } else {
                navigateTo('customer-orders');
              }
            }}
            className="btn btn-primary w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2"
          >
            <Package size={18} />
            <span>Track Order Live</span>
          </button>

          <button
            onClick={() => startBooking()}
            className="btn btn-outline-secondary w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            <span>Schedule Another Pickup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
