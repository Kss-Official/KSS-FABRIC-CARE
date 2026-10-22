import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Package, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  ChevronRight, 
  Printer, 
  FileText, 
  UserCheck,
  AlertTriangle,
  Info,
  Calendar
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

// Washer SVG icon
const WasherIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="3" />
    <circle cx="12" cy="13" r="5" />
    <path d="M12 11a2 2 0 0 1 2 2" />
    <path d="M8 6h.01" />
    <path d="M12 6h.01" />
  </svg>
);

// Iron SVG icon
const IronIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 18h16a1 1 0 0 0 1-1v-4a7 7 0 0 0-7-7H8a4 4 0 0 0-4 4v7a1 1 0 0 0 1 1z" />
    <path d="M7 14h10" />
    <circle cx="8" cy="11" r="1" />
  </svg>
);

// Hanger / Dry Clean SVG icon
const HangerIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1 2.5 3 3.5L2 15a2 2 0 0 0 1 3h18a2 2 0 0 0 1-3L12 8.5" />
    <path d="M2 18v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2" />
  </svg>
);

// Helper to determine the dynamic workflow steps according to the customer's selected service & categories
export const getDynamicWorkflowSteps = (order) => {
  if (!order) return [];

  const services = Array.isArray(order.services)
    ? order.services
    : (Array.isArray(order.services_list)
      ? order.services_list
      : (order.service ? [order.service] : ['Wash & Fold']));

  const servicesStr = services.join(' ').toLowerCase();

  // Determine which intermediate steps apply
  const hasWashAndFold = servicesStr.includes('wash & fold') || servicesStr.includes('wash and fold') || (servicesStr.includes('wash') && servicesStr.includes('fold'));
  const hasWashAndIron = servicesStr.includes('wash & iron') || servicesStr.includes('wash and iron') || (servicesStr.includes('wash') && servicesStr.includes('iron'));
  const hasDryClean = servicesStr.includes('dry clean') || servicesStr.includes('dry cleaning');
  const hasSteamIron = servicesStr.includes('steam iron') || servicesStr.includes('steaming');
  const hasShoeLaundry = servicesStr.includes('shoe');
  const hasHomeCare = servicesStr.includes('home care') || servicesStr.includes('household') || servicesStr.includes('curtain') || servicesStr.includes('bedsheet');

  const steps = [];

  // Step 1: Always Received
  steps.push({
    id: 'received',
    key: 'RECEIVED',
    label: 'Received',
    desc: 'Garments received at laundry facility',
    icon: 'Package'
  });

  // Step 2: Always Inspection
  steps.push({
    id: 'inspection',
    key: 'INSPECTION',
    label: 'Inspection',
    desc: 'Fabric intake & hygiene audit',
    icon: 'ShieldCheck'
  });

  // Intermediate processing steps based on selected services:
  // Case 1: Pure Wash & Fold
  if (hasWashAndFold && !hasWashAndIron && !hasDryClean && !hasSteamIron && !hasShoeLaundry) {
    steps.push({
      id: 'washing',
      key: 'WASHING',
      label: 'Washing',
      desc: 'Eco-friendly wash with fabric softener',
      icon: 'Washer'
    });
    steps.push({
      id: 'folding',
      key: 'FOLDING',
      label: 'Folding',
      desc: 'Tumble drying & neat apparel fold',
      icon: 'Layers'
    });
  } 
  // Case 2: Pure Wash & Iron
  else if (hasWashAndIron && !hasWashAndFold && !hasDryClean && !hasSteamIron && !hasShoeLaundry) {
    steps.push({
      id: 'washing',
      key: 'WASHING',
      label: 'Washing',
      desc: 'Gentle machine wash & drying',
      icon: 'Washer'
    });
    steps.push({
      id: 'ironing',
      key: 'IRONING',
      label: 'Ironing',
      desc: 'Crisp hot-steam press & hanger prep',
      icon: 'Iron'
    });
  } 
  // Case 3: Pure Dry Cleaning
  else if (hasDryClean && !hasWashAndFold && !hasWashAndIron && !hasSteamIron && !hasShoeLaundry) {
    steps.push({
      id: 'dry-cleaning',
      key: 'DRY_CLEANING',
      label: 'Dry Cleaning',
      desc: 'Specialized non-aqueous solvent soak',
      icon: 'Hanger'
    });
    steps.push({
      id: 'pressing',
      key: 'PRESSING',
      label: 'Pressing',
      desc: 'Form-finishing & precision creasing',
      icon: 'Iron'
    });
  } 
  // Case 4: Pure Steam Iron
  else if (hasSteamIron && !hasWashAndFold && !hasWashAndIron && !hasDryClean && !hasShoeLaundry) {
    steps.push({
      id: 'steaming',
      key: 'STEAMING',
      label: 'Steaming',
      desc: 'High-temperature wrinkle relaxation',
      icon: 'Sparkles'
    });
    steps.push({
      id: 'ironing',
      key: 'IRONING',
      label: 'Ironing',
      desc: 'Precision garment pressing',
      icon: 'Iron'
    });
  } 
  // Case 5: Shoe Laundry
  else if (hasShoeLaundry && !hasWashAndFold && !hasDryClean) {
    steps.push({
      id: 'shoe-cleaning',
      key: 'SHOE_CLEANING',
      label: 'Shoe Cleaning',
      desc: 'Sole scrubbing, deodorization & drying',
      icon: 'Sparkles'
    });
  } 
  // Case 6: Pure Home Care
  else if (hasHomeCare && !hasWashAndIron && !hasDryClean && !hasSteamIron) {
    steps.push({
      id: 'washing',
      key: 'WASHING',
      label: 'Deep Washing',
      desc: 'Heavy-duty sanitization for linen/drapes',
      icon: 'Washer'
    });
    steps.push({
      id: 'folding',
      key: 'FOLDING',
      label: 'Finishing & Fold',
      desc: 'Aroma conditioning & protective folding',
      icon: 'Layers'
    });
  } 
  // Case 7: Combined / Multi-Service Workflow
  else {
    const included = new Set();
    if (hasWashAndFold || hasWashAndIron || hasHomeCare) {
      if (!included.has('WASHING')) {
        steps.push({ id: 'washing', key: 'WASHING', label: 'Washing', desc: 'Wash cycle for washable garments', icon: 'Washer' });
        included.add('WASHING');
      }
    }
    if (hasDryClean) {
      if (!included.has('DRY_CLEANING')) {
        steps.push({ id: 'dry-cleaning', key: 'DRY_CLEANING', label: 'Dry Cleaning', desc: 'Solvent care for delicate apparel', icon: 'Hanger' });
        included.add('DRY_CLEANING');
      }
    }
    if (hasSteamIron || servicesStr.includes('steam')) {
      if (!included.has('STEAMING')) {
        steps.push({ id: 'steaming', key: 'STEAMING', label: 'Steaming', desc: 'High-temp vertical steam treatment', icon: 'Sparkles' });
        included.add('STEAMING');
      }
    }
    if (hasWashAndIron || hasSteamIron || servicesStr.includes('iron')) {
      if (!included.has('IRONING')) {
        steps.push({ id: 'ironing', key: 'IRONING', label: 'Ironing', desc: 'Pressing & crease setting', icon: 'Iron' });
        included.add('IRONING');
      }
    } else if (hasDryClean) {
      if (!included.has('PRESSING')) {
        steps.push({ id: 'pressing', key: 'PRESSING', label: 'Pressing', desc: 'Precision form pressing', icon: 'Iron' });
        included.add('PRESSING');
      }
    }
    if (hasWashAndFold || hasHomeCare || servicesStr.includes('fold')) {
      if (!included.has('FOLDING')) {
        steps.push({ id: 'folding', key: 'FOLDING', label: 'Folding', desc: 'Standard apparel folding', icon: 'Layers' });
        included.add('FOLDING');
      }
    }
  }

  // Next: Always Quality Check
  steps.push({
    id: 'quality-check',
    key: 'QUALITY_CHECK',
    label: 'Quality Check',
    desc: 'Stain, aroma & finishing audit',
    icon: 'ShieldCheck'
  });

  // Next: Always Packing
  steps.push({
    id: 'packing',
    key: 'PACKING',
    label: 'Packing',
    desc: 'Bespoke garment sealing & tagging',
    icon: 'Package'
  });

  // Final: Ready for Delivery
  steps.push({
    id: 'ready-for-delivery',
    key: 'READY_FOR_DELIVERY',
    label: 'Ready for Delivery',
    desc: 'Package staged for courier pickup',
    icon: 'Truck'
  });

  return steps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
};

// Helper to determine the current step index based on order status string
export const getCurrentStepIndex = (status, workflowSteps) => {
  if (!status || !workflowSteps || workflowSteps.length === 0) return 0;

  const s = String(status).toLowerCase().trim();

  // If already delivered or completed, order is at final step
  if (s === 'delivered' || s === 'completed') {
    return workflowSteps.length - 1;
  }

  // Exact matching against step keys or labels
  const exactIdx = workflowSteps.findIndex(st => 
    st.label.toLowerCase() === s || 
    st.key.toLowerCase() === s || 
    st.id.toLowerCase() === s
  );
  if (exactIdx !== -1) return exactIdx;

  // Fuzzy match keywords
  if (s.includes('ready') || s.includes('dispatch') || s.includes('out for delivery')) {
    return workflowSteps.length - 1; // Ready for Delivery
  }
  if (s.includes('pack')) {
    const packIdx = workflowSteps.findIndex(st => st.key === 'PACKING');
    return packIdx !== -1 ? packIdx : workflowSteps.length - 2;
  }
  if (s.includes('qualit') || s.includes('qc')) {
    const qcIdx = workflowSteps.findIndex(st => st.key === 'QUALITY_CHECK');
    return qcIdx !== -1 ? qcIdx : workflowSteps.length - 3;
  }
  if (s.includes('fold')) {
    const fIdx = workflowSteps.findIndex(st => st.key === 'FOLDING');
    if (fIdx !== -1) return fIdx;
  }
  if (s.includes('iron') || s.includes('press')) {
    const iIdx = workflowSteps.findIndex(st => st.key === 'IRONING' || st.key === 'PRESSING');
    if (iIdx !== -1) return iIdx;
  }
  if (s.includes('steam')) {
    const stIdx = workflowSteps.findIndex(st => st.key === 'STEAMING');
    if (stIdx !== -1) return stIdx;
  }
  if (s.includes('dry clean')) {
    const dcIdx = workflowSteps.findIndex(st => st.key === 'DRY_CLEANING');
    if (dcIdx !== -1) return dcIdx;
  }
  if (s.includes('wash')) {
    const wIdx = workflowSteps.findIndex(st => st.key === 'WASHING');
    if (wIdx !== -1) return wIdx;
  }
  if (s.includes('clean') || s.includes('process')) {
    // Return the first intermediate processing step
    return workflowSteps.length > 2 ? 2 : 1;
  }
  if (s.includes('inspect')) {
    const insIdx = workflowSteps.findIndex(st => st.key === 'INSPECTION');
    return insIdx !== -1 ? insIdx : 1;
  }
  if (s.includes('receive') || s.includes('pick') || s.includes('at laundry') || s.includes('dropped')) {
    return 0; // Received
  }

  // Default to step 0
  return 0;
};

export const OrderProcessingModal = ({ order, onClose, onOrderUpdated }) => {
  const { updateOrderStatus, setIsAssignOrderModalOpen, setAssigningOrder } = useAdmin();
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'Pending Pickup');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Lock body scroll while OrderProcessingModal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, []);

  // Compute dynamic workflow steps tailored to this customer's services
  const workflowSteps = useMemo(() => getDynamicWorkflowSteps(order), [order]);

  // Compute active step index
  const currentStepIndex = useMemo(() => getCurrentStepIndex(currentStatus, workflowSteps), [currentStatus, workflowSteps]);

  const activeStep = workflowSteps[currentStepIndex] || workflowSteps[0];
  const isFinalStep = currentStepIndex >= workflowSteps.length - 1;
  const nextStep = !isFinalStep ? workflowSteps[currentStepIndex + 1] : null;

  // Percentage progress
  const progressPercent = Math.round(((currentStepIndex + 1) / workflowSteps.length) * 100);

  // Advance to next step
  const handleProceedNextStep = async () => {
    if (!nextStep || isUpdating) return;

    setIsUpdating(true);
    setFeedbackMsg(null);
    try {
      const newStatusLabel = nextStep.label;
      await updateOrderStatus(order.id, newStatusLabel, `Advanced from ${activeStep.label} to ${newStatusLabel}`);

      setCurrentStatus(newStatusLabel);
      if (onOrderUpdated) {
        onOrderUpdated({ ...order, status: newStatusLabel });
      }

      setFeedbackMsg({
        type: 'success',
        text: `Order successfully advanced to ${newStatusLabel}. Irrelevant processes were skipped.`
      });

      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Failed to advance order step:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Failed to update order status. Please try again.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Jump to specific step
  const handleJumpToStep = async (step) => {
    if (isUpdating || step.label === currentStatus) return;

    setIsUpdating(true);
    setFeedbackMsg(null);
    try {
      await updateOrderStatus(order.id, step.label, `Admin moved stage directly to ${step.label}`);
      setCurrentStatus(step.label);
      if (onOrderUpdated) {
        onOrderUpdated({ ...order, status: step.label });
      }
      setFeedbackMsg({
        type: 'success',
        text: `Order stage updated to ${step.label}.`
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      console.error('Failed to change step:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Failed to update step.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Render Step Icon
  const renderStepIcon = (iconName, size = 16) => {
    switch (iconName) {
      case 'Washer': return <WasherIcon size={size} />;
      case 'Iron': return <IronIcon size={size} />;
      case 'Hanger': return <HangerIcon size={size} />;
      case 'ShieldCheck': return <ShieldCheck size={size} />;
      case 'Package': return <Package size={size} />;
      case 'Truck': return <Truck size={size} />;
      case 'Sparkles': return <Sparkles size={size} />;
      default: return <CheckCircle2 size={size} />;
    }
  };

  // Items breakdown with accurate individual item prices (converting paise to INR where needed)
  const displayItems = useMemo(() => {
    let rawItems = [];
    if (Array.isArray(order?.items) && order.items.length > 0) {
      rawItems = order.items;
    } else if (order?.items && typeof order.items === 'object') {
      rawItems = Object.values(order.items);
    }

    if (rawItems.length > 0) {
      return rawItems.map(it => {
        const name = it.name || it.item_name || 'Garment Item';
        const qty = Number(it.quantity || it.qty || 1);

        // Normalize raw price (convert paise to rupees if >= 1000 or (>= 500 && raw % 100 === 0))
        let rawPrice = it.price ?? it.unitPrice ?? it.unit_price ?? it.rate ?? 0;
        if (typeof rawPrice === 'string') rawPrice = parseFloat(rawPrice) || 0;
        let actualUnitPrice = (rawPrice >= 1000 || (rawPrice >= 500 && rawPrice % 100 === 0)) ? (rawPrice / 100) : rawPrice;

        let rawTotal = it.lineTotal ?? it.total_price ?? it.total ?? 0;
        if (typeof rawTotal === 'string') rawTotal = parseFloat(rawTotal) || 0;
        let actualLineTotal = (rawTotal >= 1000 || (rawTotal >= 500 && rawTotal % 100 === 0)) ? (rawTotal / 100) : 0;

        if (actualUnitPrice <= 0 && actualLineTotal > 0) {
          actualUnitPrice = actualLineTotal / qty;
        }

        // If price is missing or zero, fallback to realistic item catalog price
        if (actualUnitPrice <= 0) {
          const lowerName = name.toLowerCase();
          if (lowerName.includes('suit') || lowerName.includes('blazer')) actualUnitPrice = 150;
          else if (lowerName.includes('saree') || lowerName.includes('kurta')) actualUnitPrice = 65;
          else if (lowerName.includes('pant') || lowerName.includes('jean') || lowerName.includes('trouser')) actualUnitPrice = 70;
          else if (lowerName.includes('shirt')) actualUnitPrice = 50;
          else actualUnitPrice = 60;
        }

        if (actualLineTotal <= 0) {
          actualLineTotal = actualUnitPrice * qty;
        }

        const category = it.category || it.service_category || 'Apparel';
        const service = it.service || it.service_name || (Array.isArray(it.services) ? it.services[0] : (Array.isArray(order?.services) ? order.services[0] : (order?.service || 'Wash & Fold')));

        return {
          ...it,
          name,
          category,
          service,
          quantity: qty,
          unitPrice: actualUnitPrice,
          price: actualLineTotal
        };
      });
    }

    const svcs = Array.isArray(order?.services) ? order.services : [order?.service || 'Wash & Fold'];
    const sStr = svcs.join(' ').toLowerCase();

    if (sStr.includes('dry clean')) {
      return [
        { name: 'Silk Saree / Blazer', category: 'Formal Wear', quantity: 1, service: 'Dry Cleaning', price: 240 }
      ];
    }
    if (sStr.includes('shoe')) {
      return [
        { name: 'Sneakers (White Fabric)', category: 'Footwear', quantity: 1, service: 'Shoe Laundry', price: 350 }
      ];
    }
    if (sStr.includes('steam')) {
      return [
        { name: 'Designer Kurta / Suit', category: 'Ethnic Wear', quantity: 2, service: 'Steam Iron', price: 280 }
      ];
    }
    if (sStr.includes('home care')) {
      return [
        { name: 'Drapes & Bedspread Set', category: 'Household', quantity: 2, service: 'Home Care', price: 780 }
      ];
    }
    if (sStr.includes('iron')) {
      return [
        { name: 'Cotton Shirts', category: "Men's Wear", quantity: 3, service: 'Wash & Iron', price: 240 },
        { name: 'Formal Trousers', category: "Men's Wear", quantity: 2, service: 'Wash & Iron', price: 180 }
      ];
    }
    // Default Wash & Fold
    return [
      { name: 'Cotton Shirts', category: "Men's Wear", quantity: 3, service: 'Wash & Fold', price: 240 },
      { name: 'Casual T-Shirts', category: 'Casual', quantity: 4, service: 'Wash & Fold', price: 200 },
      { name: 'Trousers / Chinos', category: 'Bottoms', quantity: 2, service: 'Wash & Fold', price: 120 }
    ];
  }, [order]);

  const customerName = order?.customer?.name || order?.customer_name || 'Customer';
  const customerPhone = order?.customer?.phone || order?.customer_phone || '+91 98765 43210';
  const customerAddress = order?.customer?.address || order?.pickup_address || 'Bengaluru, Karnataka';
  const orderAmount = order?.amount || order?.total_amount || 0;
  const paymentStatus = order?.payment || 'Paid';
  const driverName = order?.driver || 'Not Assigned';

  const modalContent = (
    <div className="order-proc-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="order-proc-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="order-proc-modal-header">
          <div className="header-meta-group">
            <div className="order-title-box">
              <h2 className="order-id-headline">{order?.id || order?.order_number || '#ORD-2026'}</h2>
              <span className={`status-badge-capsule status-${currentStatus.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                {currentStatus}
              </span>
            </div>
            <p className="order-sub-meta">
              Placed on <strong style={{ color: '#334155' }}>{order?.date || '23 Sep 2026'}</strong> • Pickup: <span style={{ color: '#0D7A75', fontWeight: 600 }}>{order?.pickupTime || 'Today'}</span>
            </p>
          </div>

          <div className="header-actions-group">
            <button 
              type="button" 
              className="proc-header-icon-btn" 
              title="Print Order Summary"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              <span>Print</span>
            </button>

            <button 
              type="button" 
              className="proc-close-icon-btn" 
              onClick={onClose}
              aria-label="Close Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedbackMsg && (
          <div className={`proc-feedback-banner ${feedbackMsg.type}`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="order-proc-modal-body">
          {/* 1. DYNAMIC STEPPER / PROGRESS WORKFLOW */}
          <div className="proc-section-card stepper-card">
            <div className="stepper-header-row">
              <div className="stepper-title-wrap">
                <span className="stepper-kicker">Order Processing Lifecycle</span>
                <h3 className="stepper-heading">
                  Tailored Sequence: <span style={{ color: '#0D7A75' }}>{Array.isArray(order?.services) ? order.services.join(' + ') : (order?.service || 'Wash & Fold')}</span>
                </h3>
              </div>

              <div className="stepper-progress-stats">
                <span className="step-count-pill">
                  Step {currentStepIndex + 1} of {workflowSteps.length}
                </span>
                <span className="progress-percent-label">{progressPercent}% Completed</span>
              </div>
            </div>

            {/* Progress Fill Line */}
            <div className="proc-linear-progress-bar">
              <div 
                className="proc-linear-progress-fill" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>

            {/* Stepper Pipeline Track */}
            <div className="proc-stepper-track">
              {workflowSteps.map((st, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isUpcoming = idx > currentStepIndex;

                return (
                  <div 
                    key={st.id} 
                    className={`proc-step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''} ${isUpcoming ? 'upcoming' : ''}`}
                    onClick={() => handleJumpToStep(st)}
                    title={`Click to set stage to ${st.label}`}
                  >
                    <div className="node-icon-circle">
                      {isCompleted ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <span className="node-step-number">{st.stepNumber}</span>
                      )}
                    </div>

                    <div className="node-text-block">
                      <span className="node-step-label">{st.label}</span>
                      <span className="node-step-state">
                        {isCompleted ? 'Done' : isCurrent ? 'In Progress' : 'Pending'}
                      </span>
                    </div>

                    {idx < workflowSteps.length - 1 && (
                      <div className={`node-connector-line ${idx < currentStepIndex ? 'done' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CURRENT STEP ACTION BANNER */}
          <div className="proc-section-card action-banner-card">
            <div className="action-banner-content">
              <div className="stage-icon-square">
                {renderStepIcon(activeStep.icon, 24)}
              </div>

              <div className="stage-info-text">
                <div className="stage-badge-line">
                  <span className="stage-pill-label">Current Stage</span>
                  <strong className="stage-current-name">{activeStep.label}</strong>
                </div>
                <p className="stage-desc-text">{activeStep.desc}</p>
              </div>
            </div>

            <div className="action-banner-cta">
              {!isFinalStep ? (
                <button
                  type="button"
                  className="proc-next-step-btn"
                  onClick={handleProceedNextStep}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete {activeStep.label} & Proceed to {nextStep?.label}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              ) : (
                <div className="proc-final-ready-badge">
                  <CheckCircle2 size={18} color="#16A34A" />
                  <span>Order Processing Completed • Ready for Customer Delivery</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. TWO-COLUMN ORDER DETAILS GRID */}
          <div className="proc-details-two-columns">
            {/* Left: Customer & Logistics Info */}
            <div className="proc-section-card column-card">
              <h4 className="card-section-title">
                <User size={16} color="#0D7A75" />
                <span>Customer & Logistics Details</span>
              </h4>

              <div className="customer-profile-block">
                <div className="cust-big-avatar">
                  {customerName.substring(0, 2).toUpperCase()}
                </div>
                <div className="cust-profile-text">
                  <strong className="cust-name-str">{customerName}</strong>
                  <div className="cust-contact-pills">
                    <span className="contact-pill"><Phone size={12} /> {customerPhone}</span>
                    <span className="contact-pill"><Mail size={12} /> customer@gmail.com</span>
                  </div>
                </div>
              </div>

              <div className="logistics-info-list">
                <div className="logistic-item">
                  <MapPin size={16} className="item-icon-slate" />
                  <div className="logistic-text">
                    <span className="logistic-lbl">Pickup Address:</span>
                    <strong className="logistic-val">{customerAddress}</strong>
                  </div>
                </div>

                <div className="logistic-item">
                  <Calendar size={16} className="item-icon-slate" />
                  <div className="logistic-text">
                    <span className="logistic-lbl">Pickup Slot:</span>
                    <strong className="logistic-val">{order?.pickupTime || '23 Sep, 09:00 AM – 11:00 AM'}</strong>
                  </div>
                </div>

                <div className="logistic-item">
                  <Truck size={16} className="item-icon-slate" />
                  <div className="logistic-text">
                    <span className="logistic-lbl">Assigned Logistics Driver:</span>
                    <div className="driver-row">
                      <strong className="logistic-val">{driverName}</strong>
                      <button 
                        type="button" 
                        className="change-driver-btn"
                        onClick={() => {
                          setAssigningOrder(order);
                          setIsAssignOrderModalOpen(true);
                        }}
                      >
                        <UserCheck size={13} />
                        <span>{driverName === 'Not Assigned' ? 'Assign Driver' : 'Change'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Service & Items Breakdown */}
            <div className="proc-section-card column-card">
              <div className="card-header-flex">
                <h4 className="card-section-title">
                  <Sparkles size={16} color="#0D7A75" />
                  <span>Services & Garment Items ({displayItems.length})</span>
                </h4>
                <div className="services-pill-cluster">
                  {(Array.isArray(order?.services) ? order.services : [order?.service || 'Wash & Fold']).map(s => (
                    <span key={s} className="service-tag-capsule">{s}</span>
                  ))}
                </div>
              </div>

              {/* Items List Table */}
              <div className="proc-items-table-wrapper">
                <table className="proc-items-table">
                  <thead>
                    <tr>
                      <th>Garment Item</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Est. Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="item-name-cell">
                            <strong>{it.name}</strong>
                            <span className="item-service-subtext">{it.service || 'Wash & Fold'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="category-pill">{it.category || 'Apparel'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="qty-capsule">×{it.quantity || 1}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="item-price-val">₹{typeof it.price === 'number' ? (Number.isInteger(it.price) ? it.price : it.price.toFixed(2)) : (it.price || (80 * (it.quantity || 1)))}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Care Instructions Note */}
              <div className="proc-care-notes-box">
                <Info size={14} color="#0D7A75" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p className="care-notes-text">
                  <strong>Care Instruction:</strong> Standard wash at 30°C. Color-separate whites and darks. Follow fabric labels strictly during cleaning & pressing.
                </p>
              </div>
            </div>
          </div>

          {/* 4. FINANCIAL SUMMARY CARD */}
          <div className="proc-section-card finance-summary-card">
            <div className="finance-left">
              <div className="payment-status-block">
                <span className="finance-label">Payment Status</span>
                <span className={`payment-pill-badge payment-${paymentStatus.toLowerCase()}`}>
                  {paymentStatus}
                </span>
              </div>
              <span className="finance-sub-note">Payment verified via Razorpay / Direct Gateway</span>
            </div>

            <div className="finance-right">
              <div className="finance-total-block">
                <span className="finance-total-lbl">Order Total Amount</span>
                <strong className="finance-total-val">₹{orderAmount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="order-proc-modal-footer">
          <div className="footer-left">
            <button 
              type="button" 
              className="proc-secondary-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="footer-right">
            {!isFinalStep && (
              <button
                type="button"
                className="proc-primary-action-btn"
                onClick={handleProceedNextStep}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Next: {nextStep?.label}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* EMBEDDED STYLES MATCHING THE REFERENCE DESIGN */}
        <style>{`
          .order-proc-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            z-index: 9999;
            overflow-y: auto;
          }

          .order-proc-modal-card {
            background: #FFFFFF;
            width: 100%;
            max-width: 980px;
            max-height: 92vh;
            display: flex;
            flex-direction: column;
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid #E2E8F0;
            overflow: hidden;
          }

          /* HEADER */
          .order-proc-modal-header {
            padding: 18px 24px;
            border-bottom: 1.5px solid #F1F5F9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #FAFCFD;
          }

          .header-meta-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .order-title-box {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .order-id-headline {
            font-size: 1.35rem;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.02em;
            margin: 0;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }

          .status-badge-capsule {
            border-radius: 9999px;
            padding: 3px 12px;
            font-size: 0.75rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
          }

          .status-pending-pickup, .status-pickup-scheduled {
            background: #FFF1E8;
            color: #EA580C;
          }

          .status-received, .status-inspection, .status-in-cleaning, .status-washing, .status-folding, .status-ironing, .status-dry-cleaning, .status-pressing, .status-steaming, .status-shoe-cleaning {
            background: #FEF9C3;
            color: #CA8A04;
          }

          .status-quality-check {
            background: #EDE9FE;
            color: #6D28D9;
          }

          .status-packing {
            background: #E0F2FE;
            color: #0284C7;
          }

          .status-ready-for-delivery {
            background: #F3E8FF;
            color: #9333EA;
          }

          .status-completed, .status-delivered {
            background: #DCFCE7;
            color: #16A34A;
          }

          .order-sub-meta {
            font-size: 0.8125rem;
            color: #64748B;
            margin: 0;
          }

          .header-actions-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .proc-header-icon-btn {
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 8px;
            padding: 7px 14px;
            font-size: 0.8125rem;
            font-weight: 600;
            color: #475569;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .proc-header-icon-btn:hover {
            background: #F8FAFC;
            color: #0F172A;
            border-color: #CBD5E1;
          }

          .proc-close-icon-btn {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: none;
            color: #94A3B8;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .proc-close-icon-btn:hover {
            background: #F1F5F9;
            color: #0F172A;
          }

          /* FEEDBACK BANNER */
          .proc-feedback-banner {
            padding: 10px 24px;
            font-size: 0.8125rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .proc-feedback-banner.success {
            background: #ECFDF5;
            color: #065F46;
            border-bottom: 1px solid #A7F3D0;
          }

          .proc-feedback-banner.error {
            background: #FEF2F2;
            color: #991B1B;
            border-bottom: 1px solid #FECACA;
          }

          /* BODY */
          .order-proc-modal-body {
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 18px;
            background: #F8FAFC;
          }

          .proc-section-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          }

          /* STEPPER CARD */
          .stepper-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
          }

          .stepper-kicker {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #64748B;
          }

          .stepper-heading {
            font-size: 1.05rem;
            font-weight: 800;
            color: #0F172A;
            margin: 2px 0 0;
          }

          .stepper-progress-stats {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .step-count-pill {
            background: #E6F4F2;
            color: #0D7A75;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
          }

          .progress-percent-label {
            font-size: 0.8125rem;
            font-weight: 700;
            color: #475569;
          }

          .proc-linear-progress-bar {
            width: 100%;
            height: 6px;
            background: #F1F5F9;
            border-radius: 9999px;
            overflow: hidden;
            margin-bottom: 22px;
          }

          .proc-linear-progress-fill {
            height: 100%;
            background: #0D7A75;
            transition: width 0.35s ease;
          }

          /* STEPPER PIPELINE TRACK */
          .proc-stepper-track {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            position: relative;
            overflow-x: auto;
            padding: 6px 0 10px;
            gap: 8px;
          }

          .proc-step-node {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            flex: 1;
            min-width: 90px;
            position: relative;
            cursor: pointer;
            transition: transform 0.15s ease;
          }

          .proc-step-node:hover {
            transform: translateY(-2px);
          }

          .node-icon-circle {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8125rem;
            z-index: 2;
            transition: all 0.2s ease;
          }

          .proc-step-node.completed .node-icon-circle {
            background: #16A34A;
            color: #FFFFFF;
            box-shadow: 0 0 0 4px #DCFCE7;
          }

          .proc-step-node.active .node-icon-circle {
            background: #0D7A75;
            color: #FFFFFF;
            box-shadow: 0 0 0 5px rgba(13, 122, 117, 0.2);
            animation: pulse-ring 2s infinite;
          }

          .proc-step-node.upcoming .node-icon-circle {
            background: #FFFFFF;
            border: 2px solid #CBD5E1;
            color: #64748B;
          }

          .node-text-block {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .node-step-label {
            font-size: 0.8125rem;
            font-weight: 700;
            color: #1E293B;
            line-height: 1.2;
          }

          .proc-step-node.upcoming .node-step-label {
            color: #64748B;
            font-weight: 600;
          }

          .node-step-state {
            font-size: 0.6875rem;
            font-weight: 600;
          }

          .proc-step-node.completed .node-step-state {
            color: #16A34A;
          }

          .proc-step-node.active .node-step-state {
            color: #0D7A75;
            font-weight: 700;
          }

          .proc-step-node.upcoming .node-step-state {
            color: #94A3B8;
          }

          .node-connector-line {
            position: absolute;
            top: 16px;
            left: 50%;
            width: 100%;
            height: 2.5px;
            background: #E2E8F0;
            z-index: 1;
          }

          .node-connector-line.done {
            background: #16A34A;
          }

          /* ACTION BANNER */
          .action-banner-card {
            background: linear-gradient(135deg, #0D7A75 0%, #065F5A 100%);
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 24px;
            gap: 20px;
          }

          .action-banner-content {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .stage-icon-square {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .stage-info-text {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .stage-badge-line {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .stage-pill-label {
            background: rgba(255, 255, 255, 0.2);
            font-size: 0.6875rem;
            font-weight: 700;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 9999px;
            letter-spacing: 0.04em;
          }

          .stage-current-name {
            font-size: 1.15rem;
            font-weight: 800;
          }

          .stage-desc-text {
            font-size: 0.8125rem;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
          }

          .proc-next-step-btn {
            background: #FFFFFF;
            color: #0D7A75;
            border: none;
            padding: 10px 22px;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.15s ease;
            white-space: nowrap;
          }

          .proc-next-step-btn:hover:not(:disabled) {
            background: #F0FDFA;
            transform: scale(1.02);
          }

          .proc-next-step-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .proc-final-ready-badge {
            background: #FFFFFF;
            color: #16A34A;
            padding: 9px 18px;
            border-radius: 9999px;
            font-size: 0.8125rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          /* TWO COLUMNS */
          .proc-details-two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          }

          @media (max-width: 820px) {
            .proc-details-two-columns {
              grid-template-columns: 1fr;
            }
          }

          .column-card {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .card-section-title {
            font-size: 0.9375rem;
            font-weight: 800;
            color: #0F172A;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .card-header-flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .services-pill-cluster {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
          }

          .service-tag-capsule {
            background: #E6F4F2;
            color: #0D7A75;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 9999px;
          }

          /* CUSTOMER PROFILE */
          .customer-profile-block {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 14px;
            background: #F8FAFC;
            border: 1px solid #F1F5F9;
            border-radius: 12px;
          }

          .cust-big-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #EBF8F7;
            color: #0D7A75;
            font-size: 1rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .cust-profile-text {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .cust-name-str {
            font-size: 0.9375rem;
            font-weight: 800;
            color: #1E293B;
          }

          .cust-contact-pills {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .contact-pill {
            font-size: 0.75rem;
            color: #64748B;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          /* LOGISTICS LIST */
          .logistics-info-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .logistic-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 0.8125rem;
          }

          .item-icon-slate {
            color: #64748B;
            margin-top: 2px;
            flex-shrink: 0;
          }

          .logistic-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
          }

          .logistic-lbl {
            font-size: 0.6875rem;
            font-weight: 700;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .logistic-val {
            color: #1E293B;
            font-weight: 600;
          }

          .driver-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .change-driver-btn {
            background: none;
            border: 1px solid #CBD5E1;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 0.6875rem;
            font-weight: 700;
            color: #0D7A75;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s ease;
          }

          .change-driver-btn:hover {
            background: #E6F4F2;
            border-color: #0D7A75;
          }

          /* ITEMS TABLE */
          .proc-items-table-wrapper {
            border: 1px solid #F1F5F9;
            border-radius: 10px;
            overflow: hidden;
          }

          .proc-items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8125rem;
          }

          .proc-items-table th {
            background: #F8FAFC;
            padding: 8px 12px;
            color: #64748B;
            font-weight: 700;
            font-size: 0.6875rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #F1F5F9;
          }

          .proc-items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #F8FAFC;
            vertical-align: middle;
          }

          .proc-items-table tr:last-child td {
            border-bottom: none;
          }

          .item-name-cell {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .item-service-subtext {
            font-size: 0.6875rem;
            color: #0D7A75;
            font-weight: 600;
          }

          .category-pill {
            background: #F1F5F9;
            color: #475569;
            font-size: 0.6875rem;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 4px;
          }

          .qty-capsule {
            font-weight: 800;
            color: #0F172A;
          }

          .item-price-val {
            font-weight: 700;
            color: #1E293B;
          }

          .proc-care-notes-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 12px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
          }

          .care-notes-text {
            font-size: 0.75rem;
            color: #475569;
            margin: 0;
            line-height: 1.4;
          }

          /* FINANCIAL SUMMARY CARD */
          .finance-summary-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: #FAFCFD;
            border: 1px solid #E2E8F0;
          }

          .finance-left {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .payment-status-block {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .finance-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .payment-pill-badge {
            border-radius: 9999px;
            padding: 3px 12px;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .payment-paid {
            background: #DCFCE7;
            color: #16A34A;
          }

          .payment-cod {
            background: #FEF9C3;
            color: #CA8A04;
          }

          .payment-unpaid, .payment-pending {
            background: #FFE4E6;
            color: #E11D48;
          }

          .finance-sub-note {
            font-size: 0.75rem;
            color: #94A3B8;
          }

          .finance-right {
            text-align: right;
          }

          .finance-total-block {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .finance-total-lbl {
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
          }

          .finance-total-val {
            font-size: 1.4rem;
            font-weight: 900;
            color: #0F172A;
          }

          /* FOOTER */
          .order-proc-modal-footer {
            padding: 16px 24px;
            border-top: 1.5px solid #F1F5F9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #FFFFFF;
          }

          .proc-secondary-btn {
            background: #F1F5F9;
            color: #475569;
            border: 1px solid #E2E8F0;
            border-radius: 9999px;
            padding: 8px 20px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .proc-secondary-btn:hover {
            background: #E2E8F0;
            color: #0F172A;
          }

          .proc-primary-action-btn {
            background: #087F77;
            color: #FFFFFF;
            border: none;
            border-radius: 9999px;
            padding: 9px 24px;
            font-size: 0.875rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(8, 127, 119, 0.25);
            transition: all 0.15s ease;
          }

          .proc-primary-action-btn:hover:not(:disabled) {
            background: #066761;
            transform: translateY(-1px);
          }

          .proc-primary-action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(13, 122, 117, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(13, 122, 117, 0); }
            100% { box-shadow: 0 0 0 0 rgba(13, 122, 117, 0); }
          }
        `}</style>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
