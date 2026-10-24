import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, SlidersHorizontal } from 'lucide-react';

export const ORDER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Orders', dotColor: '#0D7A75' },
  { value: 'PENDING', label: 'Pending', dotColor: '#D97706' },
  { value: 'PROCESSING', label: 'Processing', dotColor: '#2563EB' },
  { value: 'DELIVERY', label: 'Delivery', dotColor: '#7C3AED' },
  { value: 'COMPLETED', label: 'Completed', dotColor: '#16A34A' },
  { value: 'CANCELLED', label: 'Cancelled', dotColor: '#DC2626' },
];

export const OrderStatusDropdown = ({ 
  value = 'ALL', 
  onChange, 
  options = ORDER_STATUS_OPTIONS,
  counts = null 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeOption = options.find(o => o.value === value) || options[0];
  const hasFilter = value !== 'ALL';

  return (
    <div className="toolbar-dropdown-wrapper" ref={dropdownRef}>
      {/* Filters Pill Button matching Reference Image 1 */}
      <button
        type="button"
        id="order-filters-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`toolbar-pill-btn ${hasFilter ? 'has-filter' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal size={15} className="toolbar-pill-icon" />
        <span>{hasFilter ? activeOption.label : 'Filters'}</span>
        <ChevronDown
          size={14}
          className={`toolbar-pill-chevron ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu Popover Card */}
      {isOpen && (
        <div
          className="dropdown-popover-card animate-scale-in"
          role="listbox"
        >
          <div className="popover-header">Filter by Status</div>

          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  if (onChange) onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`popover-option ${isSelected ? 'selected' : ''}`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="text-teal-600 flex-shrink-0" />}
              </button>
            );
          })}

          {hasFilter && (
            <button
              type="button"
              className="popover-reset-btn"
              onClick={() => {
                if (onChange) onChange('ALL');
                setIsOpen(false);
              }}
            >
              Reset Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderStatusDropdown;
