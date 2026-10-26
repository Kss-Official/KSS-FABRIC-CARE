import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { supportApi } from '../api/apiClient';
import { 
  HelpCircle, 
  Send, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  RefreshCw,
  ChevronDown,
  Headphones,
  Clock,
  Zap,
  Ticket,
  ChevronRight,
  X,
  Search,
  Filter
} from 'lucide-react';

export const HelpSupport = () => {
  const { currentUser } = useAuth();
  const { navigateTo } = useBooking();
  const [tickets, setTickets] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const email = currentUser?.email || 'default';
        const saved = localStorage.getItem(`fabricare_support_tickets_${email}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (_) {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const faqCardRef = useRef(null);

  // View All Tickets Modal State
  const [isAllTicketsModalOpen, setIsAllTicketsModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('ALL');
  const [modalExpandedTicketId, setModalExpandedTicketId] = useState(null);
  const allTicketsScrollRef = useRef(null);

  // Lock background page scroll while all tickets modal is open
  useEffect(() => {
    if (isAllTicketsModalOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      if (allTicketsScrollRef.current) {
        allTicketsScrollRef.current.scrollTop = 0;
      }

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsAllTicketsModalOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevHtmlOverflow || '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isAllTicketsModalOpen]);


  useEffect(() => {
    if (expandedFaq === null) return;

    const handleClickOutside = (event) => {
      if (faqCardRef.current && !faqCardRef.current.contains(event.target)) {
        setExpandedFaq(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [expandedFaq]);

  const fetchCustomerTickets = useCallback(async () => {
    try {
      const email = (currentUser?.email || '').toLowerCase().trim();
      const res = await supportApi.getCustomerTickets(email ? { customer_email: email } : {});
      if (res && res.data) {
        const list = res.data.results || res.data.items || [];
        if (Array.isArray(list)) {
          setTickets(() => {
            const map = new Map();
            list.forEach(item => {
              const cleanNum = String(item.ticket_number || '').replace(/^#+/, '').toUpperCase();
              const key = cleanNum ? `num_${cleanNum}` : `id_${item.id}`;
              map.set(key, item);
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
            try {
              if (email) {
                localStorage.setItem(`fabricare_support_tickets_${email}`, JSON.stringify(merged));
              }
            } catch (_) {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching backend customer support tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    fetchCustomerTickets();

    const handleTicketCreated = (e) => {
      const newTicket = e.detail;
      if (!newTicket) return;
      setTickets(prev => {
        const list = prev || [];
        const cleanNewNum = String(newTicket.ticket_number || '').replace(/^#+/, '').toUpperCase();
        const cleanNewSubj = String(newTicket.subject || '').trim().toLowerCase();
        const cleanNewMsg = String(newTicket.message || '').trim().toLowerCase();

        const exists = list.some(t => {
          const cleanOldNum = String(t.ticket_number || '').replace(/^#+/, '').toUpperCase();
          const cleanOldSubj = String(t.subject || '').trim().toLowerCase();
          const cleanOldMsg = String(t.message || '').trim().toLowerCase();

          return (newTicket.id && String(t.id) === String(newTicket.id)) ||
                 (cleanNewNum && cleanOldNum && cleanNewNum === cleanOldNum) ||
                 (cleanNewSubj && cleanOldSubj && cleanNewSubj === cleanOldSubj && cleanNewMsg === cleanOldMsg);
        });

        if (exists) {
          return list.map(t => {
            const cleanOldNum = String(t.ticket_number || '').replace(/^#+/, '').toUpperCase();
            if ((newTicket.id && String(t.id) === String(newTicket.id)) || (cleanNewNum && cleanOldNum && cleanNewNum === cleanOldNum)) {
              return { ...t, ...newTicket };
            }
            return t;
          });
        }
        return [newTicket, ...list];
      });
    };

    const handleTicketUpdated = (e) => {
      const updated = e.detail;
      if (!updated) return;
      setTickets(prev => (prev || []).map(t => {
        const cleanUpdNum = String(updated.ticket_number || '').replace(/^#+/, '').toUpperCase();
        const cleanOldNum = String(t.ticket_number || '').replace(/^#+/, '').toUpperCase();
        if (String(t.id) === String(updated.id) || (cleanUpdNum && cleanOldNum && cleanUpdNum === cleanOldNum)) {
          return {
            ...t,
            ...updated,
            admin_reply: updated.admin_reply || t.admin_reply,
            admin_reply_at: updated.admin_reply_at || t.admin_reply_at || updated.formatted_admin_reply_at,
            status: updated.status || t.status
          };
        }
        return t;
      }));
    };

    window.addEventListener('fabricare_support_ticket_created', handleTicketCreated);
    window.addEventListener('fabricare_support_ticket_updated', handleTicketUpdated);

    return () => {
      window.removeEventListener('fabricare_support_ticket_created', handleTicketCreated);
      window.removeEventListener('fabricare_support_ticket_updated', handleTicketUpdated);
    };
  }, [fetchCustomerTickets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const custName = currentUser?.name || currentUser?.displayName || currentUser?.fullName || 'Customer';
      const custEmail = currentUser?.email || 'customer@fabricare.com';

      const ticketPayload = {
        subject: subject.trim(),
        message: message.trim(),
        priority,
        customer_name: custName,
        customer_email: custEmail
      };

      // Submit to Django backend SupportTicket API
      const res = await supportApi.createTicket(ticketPayload);
      const backendTicket = res?.data;

      // Note: supportApi.createTicket dispatches 'fabricare_support_ticket_created',
      // but we safely ensure it is in state without duplicating:
      if (backendTicket) {
        setTickets(prev => {
          const list = prev || [];
          const cleanNewNum = String(backendTicket.ticket_number || '').replace(/^#+/, '').toUpperCase();
          const cleanNewSubj = String(backendTicket.subject || '').trim().toLowerCase();
          const cleanNewMsg = String(backendTicket.message || '').trim().toLowerCase();

          const exists = list.some(t => {
            const cleanOldNum = String(t.ticket_number || '').replace(/^#+/, '').toUpperCase();
            const cleanOldSubj = String(t.subject || '').trim().toLowerCase();
            const cleanOldMsg = String(t.message || '').trim().toLowerCase();
            return (backendTicket.id && String(t.id) === String(backendTicket.id)) ||
                   (cleanNewNum && cleanOldNum && cleanNewNum === cleanOldNum) ||
                   (cleanNewSubj && cleanOldSubj && cleanNewSubj === cleanOldSubj && cleanNewMsg === cleanOldMsg);
          });
          if (exists) return list;
          return [backendTicket, ...list];
        });
      }

      setSubject('');
      setMessage('');
      setSuccessMsg('Support ticket submitted successfully. Our helpdesk will contact you shortly!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const focusTicketForm = () => {
    const el = document.getElementById('support-subject-input');
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 3 Verified FAQ items matching reference image
  const faqList = [
    {
      id: 1,
      q: 'What is the standard turnaround time for laundry?',
      a: 'Standard Wash & Fold is typically delivered within 24 to 48 hours. Premium Dry Cleaning and heavy home care items (curtains/blankets) take 48 to 72 hours.'
    },
    {
      id: 2,
      q: 'How does FabriCare verify my clothes count and weight?',
      a: 'When our delivery agent collects your bag, they count and weigh it. Once the bag reaches our central laundry facility, a staff specialist independently inspects, recounts, and verifies everything to prevent loss.'
    },
    {
      id: 3,
      q: 'What detergents and cleaning methods are used?',
      a: 'We use non-toxic, eco-friendly enzyme detergents and pH-balanced fabric softeners that maintain garment color vibrancy and fabric fiber integrity.'
    }
  ];

  // Default ticket item matching reference image if no tickets yet submitted
  const defaultTickets = [
    {
      id: 'default-1',
      ticket_number: 'FC-1024',
      subject: 'Pickup delay',
      status: 'In Review',
      statusColor: 'yellow',
      updatedText: 'Last updated today'
    }
  ];

  const displayTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return defaultTickets;

    const seenIds = new Set();
    const seenNumbers = new Set();
    const seenSubjects = new Set();
    const result = [];

    // Sort tickets latest first
    const sorted = [...tickets].sort((a, b) => {
      const timeA = new Date(b.created_at || b.createdAt || 0).getTime();
      const timeB = new Date(a.created_at || a.createdAt || 0).getTime();
      return timeA - timeB;
    });

    for (const t of sorted) {
      const rawNum = String(t.ticket_number || t.ticket_id_display || t.ticketId || '').trim();
      const cleanNum = rawNum.replace(/^#+/, '').toUpperCase();
      const cleanSubject = String(t.subject || '').trim().toLowerCase();
      const cleanMessage = String(t.message || '').trim().toLowerCase();

      // Duplicate prevention checks
      if (t.id && seenIds.has(String(t.id).toLowerCase())) continue;
      if (cleanNum && seenNumbers.has(cleanNum)) continue;
      if (cleanSubject && seenSubjects.has(`${cleanSubject}__${cleanMessage.slice(0, 30)}`)) continue;

      if (t.id) seenIds.add(String(t.id).toLowerCase());
      if (cleanNum) seenNumbers.add(cleanNum);
      if (cleanSubject) seenSubjects.add(`${cleanSubject}__${cleanMessage.slice(0, 30)}`);

      let formattedTicketNum = cleanNum;
      if (!formattedTicketNum) {
        if (typeof t.id === 'number') {
          formattedTicketNum = `SUP-${1000 + t.id}`;
        } else {
          formattedTicketNum = `SUP-${String(t.id || 'REQ').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
        }
      }

      result.push({
        id: t.id,
        ticket_number: formattedTicketNum,
        subject: t.subject || 'Garment inquiry',
        message: t.message,
        admin_reply: t.admin_reply,
        admin_reply_at: t.admin_reply_at || t.formatted_admin_reply_at,
        priority: t.priority,
        status: t.status === 'RESOLVED' ? 'Resolved' : (t.status === 'IN_PROGRESS' ? 'In Progress' : (t.status === 'OPEN' ? 'Open' : (t.status || 'Open'))),
        statusColor: t.status === 'RESOLVED' ? 'green' : (t.status === 'IN_PROGRESS' ? 'blue' : 'yellow'),
        updatedText: t.created_at || t.createdAt ? `Last updated ${new Date(t.created_at || t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Last updated today'
      });
    }

    return result.length > 0 ? result : defaultTickets;
  }, [tickets, defaultTickets]);

  // Display only the latest 4 tickets by default on the main card
  const recentTickets = useMemo(() => {
    return displayTickets.slice(0, 4);
  }, [displayTickets]);

  // Stats summary for the modal
  const ticketStats = useMemo(() => {
    const total = displayTickets.length;
    const open = displayTickets.filter(t => String(t.status || '').toUpperCase().includes('OPEN')).length;
    const inProgress = displayTickets.filter(t => String(t.status || '').toUpperCase().includes('PROGRESS')).length;
    const resolved = displayTickets.filter(t => String(t.status || '').toUpperCase().includes('RESOLVED')).length;
    return { total, open, inProgress, resolved };
  }, [displayTickets]);

  // Filtered tickets within the View All modal
  const filteredModalTickets = useMemo(() => {
    let list = displayTickets;
    if (modalStatusFilter !== 'ALL') {
      list = list.filter(t => {
        const s = String(t.status || '').toUpperCase();
        if (modalStatusFilter === 'OPEN') return s.includes('OPEN');
        if (modalStatusFilter === 'IN_PROGRESS') return s.includes('PROGRESS');
        if (modalStatusFilter === 'RESOLVED') return s.includes('RESOLVED');
        return true;
      });
    }
    if (modalSearchQuery.trim()) {
      const q = modalSearchQuery.toLowerCase().trim();
      list = list.filter(t => 
        String(t.subject || '').toLowerCase().includes(q) ||
        String(t.ticket_number || '').toLowerCase().includes(q) ||
        String(t.message || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [displayTickets, modalStatusFilter, modalSearchQuery]);


  return (
    <div className="portal-container help-support-portal animate-fade-in">
      {/* Header */}
      <div className="help-header-row mb-6">
        <div className="breadcrumbs-nav">
          <span onClick={() => navigateTo('home')} className="breadcrumb-link">Home</span>
          <span className="breadcrumb-slash">&gt;</span>
          <span className="breadcrumb-active">Help &amp; Support</span>
        </div>
        <h1 className="help-main-title">Customer Help Desk</h1>
        <p className="help-main-subtitle">Submit queries, report garment concerns, and read common laundry FAQs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Submit Support Request & Frequently Asked Questions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submit Support Ticket Card */}
          <div className="content-card raise-request-card">
            <div className="card-section-header">
              <div className="section-icon-badge">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="card-section-title">Raise a Support Request</h3>
                <p className="card-section-subtitle">We will review your concern and respond as quickly as possible</p>
              </div>
            </div>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="support-form-stack">
              <div className="form-group">
                <label className="form-label" htmlFor="support-subject-input">Issue Subject *</label>
                <input 
                  id="support-subject-input"
                  type="text"
                  required
                  placeholder="E.g., Pickup delayed, question about silk care..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-select"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Message *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Explain your question or concern in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div className="form-actions-row">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn-submit-ticket"
                >
                  {submitting ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>

          {/* Frequently Asked Questions Card (Exact Layout from Image 1) */}
          <div className="content-card faq-accordion-card" ref={faqCardRef}>
            <div className="faq-card-header">
              <HelpCircle size={20} className="text-teal" />
              <h3 className="faq-header-title">Frequently Asked Questions</h3>
            </div>

            <div className="faq-list">
              {faqList.map((faq) => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div key={faq.id} className={`faq-item-box ${isOpen ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                      className="faq-trigger-btn"
                    >
                      <span className="faq-question-text">{faq.q}</span>
                      <ChevronDown size={18} className={`faq-chevron ${isOpen ? 'rotate' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="faq-answer-body">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Need More Help? & My Support Tickets (Exact Layout from Image 2) */}
        <div className="space-y-6">
          {/* Top Card: Need More Help? */}
          <div className="content-card need-help-card">
            <div className="need-help-header">
              <div className="need-help-avatar-circle">
                <Headphones size={26} />
              </div>
              <div className="need-help-title-stack">
                <h3 className="need-help-title">Need More Help?</h3>
                <span className="need-help-subtitle">We're here to help with your laundry concerns.</span>
              </div>
            </div>

            <div className="need-help-info-list">
              {/* Row 1: Email Support */}
              <div className="need-help-row">
                <div className="help-icon-square">
                  <Mail size={19} />
                </div>
                <div className="help-row-stack">
                  <span className="help-row-label">Email Support</span>
                  <span className="help-row-value">support@fabricare.example</span>
                </div>
              </div>

              {/* Row 2: Support Hours */}
              <div className="need-help-row">
                <div className="help-icon-square">
                  <Clock size={19} />
                </div>
                <div className="help-row-stack">
                  <span className="help-row-label">Support Hours</span>
                  <span className="help-row-value">Mon – Sat, 9 AM – 6 PM</span>
                </div>
              </div>

              {/* Row 3: Typical Response */}
              <div className="need-help-row">
                <div className="help-icon-square">
                  <Zap size={19} />
                </div>
                <div className="help-row-stack">
                  <span className="help-row-label">Typical Response</span>
                  <span className="help-row-value">Within 24 hours</span>
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={focusTicketForm}
              className="btn-contact-support-outline"
            >
              <Headphones size={18} />
              <span>Contact Support</span>
            </button>
          </div>

          {/* Bottom Card: My Support Tickets */}
          <div className="content-card support-tickets-card">
            <div className="tickets-card-header">
              <div className="tickets-title-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7A75" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                  <path d="M13 5v2"/>
                  <path d="M13 17v2"/>
                  <path d="M13 11v2"/>
                </svg>
                <h3 className="tickets-header-title">My Support Tickets</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAllTicketsModalOpen(true)}
                className="btn-view-all-tickets"
                title="View all support tickets"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="tickets-list">
              {recentTickets.map((t) => {
                const isExpanded = expandedTicketId === t.id;
                return (
                  <div 
                    key={t.id} 
                    className={`ticket-item-box ${isExpanded ? 'expanded' : ''}`} 
                    onClick={() => setExpandedTicketId(isExpanded ? null : t.id)} 
                    title="Click to view ticket status and response"
                  >
                    <div className="ticket-avatar-circle">
                      <Headphones size={18} />
                    </div>

                    <div className="ticket-text-stack">
                      <div className="ticket-top-row">
                        <h4 className="ticket-subject-title">{t.subject}</h4>
                        <span className={`ticket-status-pill ${t.statusColor || 'yellow'}`}>
                          <Clock size={11} strokeWidth={2.5} />
                          <span>{t.status}</span>
                        </span>
                      </div>

                      <div className="ticket-bottom-row">
                        <div className="ticket-meta-info">
                          <span className="ticket-meta-subtitle">Ticket #{String(t.ticket_number || '').replace(/^#+/, '')}</span>
                          <span className="ticket-meta-dot">•</span>
                          <span className="ticket-updated-time">{t.updatedText}</span>
                        </div>
                        <ChevronRight 
                          size={15} 
                          className={`ticket-chevron-icon transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                      </div>

                      {/* Expanded View with Admin Response */}
                      {isExpanded && (
                        <div className="ticket-expanded-content mt-3 pt-3 border-t border-slate-100 text-xs">
                          {t.message && (
                            <div className="mb-2">
                              <span className="font-semibold text-slate-600 block mb-0.5">Your Message:</span>
                              <p className="text-slate-700 bg-slate-50 p-2 rounded">{t.message}</p>
                            </div>
                          )}

                          {t.admin_reply ? (
                            <div className="mt-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-emerald-800">Support Team Response:</span>
                                {t.admin_reply_at && (
                                  <span className="text-[10px] text-emerald-600">
                                    {new Date(t.admin_reply_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-emerald-950 font-medium">{t.admin_reply}</p>
                            </div>
                          ) : (
                            <p className="text-slate-400 italic mt-1">Our support team is currently reviewing your ticket.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Modal Dialog for "View All" Tickets (Matching exact dimensions of Official Tax Invoice • FC-47030 modal) */}
      {isAllTicketsModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="all-tickets-modal-overlay" onClick={() => setIsAllTicketsModalOpen(false)}>
          <div className="all-tickets-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="all-tickets-modal-top-bar no-print">
              <div className="modal-header-title-wrap">
                <Headphones size={18} className="text-teal" />
                <span className="modal-header-title">
                  All Support Tickets &bull; {currentUser?.displayName || currentUser?.name || 'Customer'}
                </span>
                <span className="modal-count-pill">{displayTickets.length} {displayTickets.length === 1 ? 'Ticket' : 'Tickets'}</span>
              </div>
              <div className="all-tickets-modal-actions">
                <button 
                  type="button"
                  onClick={() => setIsAllTicketsModalOpen(false)}
                  className="modal-close-circle-btn"
                  title="Close Dialog"
                  aria-label="Close Dialog"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div 
              ref={allTicketsScrollRef}
              className="all-tickets-modal-content-scroll"
            >
              <div className="all-tickets-document-card">
                {/* Header Banner */}
                <div className="modal-tickets-doc-header">
                  <div className="modal-tickets-brand">
                    <div className="tickets-brand-icon">
                      <Ticket size={24} />
                    </div>
                    <div>
                      <h2 className="modal-doc-title">Support Ticket History</h2>
                      <p className="modal-doc-subtitle">Complete log of all customer inquiries, feedback, and support team responses</p>
                    </div>
                  </div>
                  <div className="modal-tickets-stats-strip">
                    <div className="stat-pill-box">
                      <span className="stat-pill-num">{ticketStats.total}</span>
                      <span className="stat-pill-lbl">Total</span>
                    </div>
                    <div className="stat-pill-box pill-open">
                      <span className="stat-pill-num">{ticketStats.open}</span>
                      <span className="stat-pill-lbl">Open</span>
                    </div>
                    <div className="stat-pill-box pill-progress">
                      <span className="stat-pill-num">{ticketStats.inProgress}</span>
                      <span className="stat-pill-lbl">In Progress</span>
                    </div>
                    <div className="stat-pill-box pill-resolved">
                      <span className="stat-pill-num">{ticketStats.resolved}</span>
                      <span className="stat-pill-lbl">Resolved</span>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="modal-tickets-filter-bar">
                  <div className="modal-tickets-search">
                    <Search size={15} className="modal-search-icon" />
                    <input 
                      type="text"
                      placeholder="Search tickets by subject, ticket #, message..."
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      className="modal-search-input"
                    />
                    {modalSearchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setModalSearchQuery('')}
                        className="modal-search-clear"
                        title="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div className="modal-status-tabs">
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setModalStatusFilter(tab)}
                        className={`modal-tab-btn ${modalStatusFilter === tab ? 'active' : ''}`}
                      >
                        {tab === 'ALL' ? `All (${ticketStats.total})` : 
                         tab === 'OPEN' ? `Open (${ticketStats.open})` : 
                         tab === 'IN_PROGRESS' ? `In Progress (${ticketStats.inProgress})` : 
                         `Resolved (${ticketStats.resolved})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tickets List */}
                <div className="modal-tickets-list-wrap">
                  {filteredModalTickets.length === 0 ? (
                    <div className="modal-empty-tickets-state">
                      <HelpCircle size={36} className="text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No support tickets match your filter</p>
                      <p className="text-xs text-slate-400">Try adjusting your search terms or status filter</p>
                    </div>
                  ) : (
                    filteredModalTickets.map((t, idx) => {
                      const isExpanded = modalExpandedTicketId === t.id;
                      return (
                        <div 
                          key={t.id || idx}
                          className={`modal-ticket-card-item ${isExpanded ? 'is-open' : ''}`}
                        >
                          <div 
                            className="modal-ticket-card-header"
                            onClick={() => setModalExpandedTicketId(isExpanded ? null : t.id)}
                            title="Click to view full ticket details and responses"
                          >
                            <div className="modal-ticket-left">
                              <div className="modal-ticket-avatar">
                                <Headphones size={18} />
                              </div>
                              <div className="modal-ticket-info-text">
                                <div className="modal-ticket-title-row">
                                  <h4 className="modal-ticket-subject">{t.subject}</h4>
                                  <span className={`ticket-status-pill ${t.statusColor || 'yellow'}`}>
                                    <Clock size={11} strokeWidth={2.5} />
                                    <span>{t.status}</span>
                                  </span>
                                </div>
                                <div className="modal-ticket-meta-row">
                                  <span className="modal-ticket-code font-mono">
                                    Ticket #{String(t.ticket_number || '').replace(/^#+/, '')}
                                  </span>
                                  <span className="modal-ticket-dot">&bull;</span>
                                  <span className="modal-ticket-priority">
                                    Priority: <strong>{t.priority || 'MEDIUM'}</strong>
                                  </span>
                                  <span className="modal-ticket-dot">&bull;</span>
                                  <span className="modal-ticket-date">{t.updatedText}</span>
                                </div>
                              </div>
                            </div>
                            <div className="modal-ticket-right">
                              <ChevronRight 
                                size={18} 
                                className={`modal-chevron-icon transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                              />
                            </div>
                          </div>

                          {/* Expanded Content Drawer */}
                          <div className={`modal-ticket-expanded-drawer ${isExpanded ? 'open' : ''}`}>
                            <div className="modal-drawer-inner">
                              {t.message && (
                                <div className="modal-ticket-msg-box">
                                  <span className="modal-msg-heading">Your Message:</span>
                                  <p className="modal-msg-body">{t.message}</p>
                                </div>
                              )}

                              {t.admin_reply ? (
                                <div className="modal-ticket-reply-box">
                                  <div className="modal-reply-header">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                                      <CheckCircle size={14} />
                                      <span>Support Team Response</span>
                                    </div>
                                    {t.admin_reply_at && (
                                      <span className="modal-reply-time">
                                        {new Date(t.admin_reply_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                  <p className="modal-reply-body">{t.admin_reply}</p>
                                </div>
                              ) : (
                                <div className="modal-ticket-pending-box">
                                  <Clock size={14} className="text-amber-600" />
                                  <span>Our support team is reviewing your ticket and will respond shortly.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .help-support-portal {
          width: 100%;
        }

        .text-teal {
          color: #0D7A75 !important;
        }

        /* Header */
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

        .help-main-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .help-main-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
        }

        /* Raise Request Card */
        .raise-request-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 26px 30px;
        }

        .card-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1.5px solid #F1F5F9;
        }

        .section-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-section-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .card-section-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin-top: 2px;
        }

        .support-form-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .form-row-2 {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #CBD5E1;
          border-radius: 12px;
          font-size: 0.875rem;
          color: #0F172A;
          background: #ffffff;
          transition: all 0.15s ease;
          outline: none;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .form-actions-row {
          display: flex;
          justify-content: flex-end;
          padding-top: 4px;
        }

        .btn-submit-ticket {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background: #0D7A75;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 700;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.2);
        }

        .btn-submit-ticket:hover {
          background: #095F5B;
        }

        .btn-submit-ticket:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* FAQ Accordion Card (Matches Image 1) */
        .faq-accordion-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 26px 30px;
        }

        .faq-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .faq-header-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item-box {
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        .faq-item-box:hover {
          border-color: #BCEAE6;
        }

        .faq-item-box.expanded {
          border-color: #0D7A75;
          box-shadow: 0 4px 16px rgba(13, 122, 117, 0.08);
        }

        .faq-trigger-btn {
          width: 100%;
          padding: 16px 20px;
          text-align: left;
          background: #ffffff;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #0F172A;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .faq-trigger-btn:hover {
          background: #F8FAFC;
        }

        .faq-question-text {
          flex: 1;
        }

        .faq-chevron {
          color: #64748B;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .faq-chevron.rotate {
          transform: rotate(180deg);
          color: #0D7A75;
        }

        .faq-answer-body {
          padding: 16px 20px;
          background: #F8FAFC;
          border-top: 1px solid #EDF2F7;
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.65;
        }

        /* Top Right Card: Need More Help? (Matches Image 2) */
        .need-help-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 26px 28px;
        }

        .need-help-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }

        .need-help-avatar-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .need-help-title-stack {
          display: flex;
          flex-direction: column;
        }

        .need-help-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.2;
        }

        .need-help-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 3px;
        }

        .need-help-info-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .need-help-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .help-icon-square {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .help-row-stack {
          display: flex;
          flex-direction: column;
        }

        .help-row-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
          margin-bottom: 1px;
        }

        .help-row-value {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
        }

        .btn-contact-support-outline {
          width: 100%;
          margin-top: 22px;
          padding: 12px 20px;
          background: transparent;
          border: 1.5px solid #0D7A75;
          border-radius: 12px;
          color: #0D7A75;
          font-size: 0.9375rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-contact-support-outline:hover {
          background: #E8FAF6;
        }

        /* Bottom Right Card: My Support Tickets */
        .support-tickets-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 22px 22px;
        }

        .tickets-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .tickets-title-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tickets-header-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .tickets-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ticket-item-box {
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ticket-item-box:hover {
          background: #FFFFFF;
          border-color: #0D7A75;
          box-shadow: 0 4px 14px rgba(13, 122, 117, 0.08);
          transform: translateY(-1px);
        }

        .ticket-avatar-circle {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 12px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ticket-text-stack {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .ticket-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .ticket-subject-title {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ticket-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .ticket-meta-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #64748B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ticket-meta-subtitle {
          font-weight: 600;
          color: #475569;
        }

        .ticket-meta-dot {
          color: #94A3B8;
          font-size: 0.7rem;
        }

        .ticket-updated-time {
          color: #64748B;
          font-weight: 500;
        }

        .ticket-chevron-icon {
          color: #94A3B8;
          flex-shrink: 0;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .ticket-item-box:hover .ticket-chevron-icon {
          color: #0D7A75;
          transform: translateX(2px);
        }

        .ticket-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4.5px;
          padding: 3.5px 9px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .ticket-status-pill.yellow {
          background: #FEF9C3;
          color: #A16207;
          border: 1px solid #FEF08A;
        }

        .ticket-status-pill.green {
          background: #DCFCE7;
          color: #15803D;
          border: 1px solid #BBF7D0;
        }

        /* View All button on the right side of header */
        .tickets-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .btn-view-all-tickets {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.78125rem;
          font-weight: 700;
          color: #0D7A75;
          background: #E8FAF6;
          border: 1px solid #BCEAE6;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-view-all-tickets:hover {
          background: #0D7A75;
          color: #ffffff;
          border-color: #0D7A75;
          transform: translateY(-1px);
        }

        /* All Support Tickets Modal (Matching exact dimensions of Official Tax Invoice modal) */
        .all-tickets-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 999999 !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 24px 16px;
          overflow: hidden !important;
          overscroll-behavior: contain;
          box-sizing: border-box;
        }

        .all-tickets-modal-container {
          background: #ffffff;
          border-radius: 20px;
          max-width: 900px;
          width: 100%;
          height: calc(100vh - 48px);
          max-height: calc(100vh - 48px);
          overflow: hidden !important;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          margin: 0 auto;
          position: relative;
          box-sizing: border-box;
          animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .all-tickets-modal-top-bar {
          flex: 0 0 auto;
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
          gap: 10px;
        }

        .modal-header-title {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .modal-count-pill {
          padding: 3px 10px;
          background: #E8FAF6;
          color: #0D7A75;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .all-tickets-modal-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .all-tickets-modal-content-scroll {
          flex: 1 1 0% !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          overflow-x: hidden;
          padding: 28px 24px;
          background: #F8FAFC;
        }

        .all-tickets-document-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 32px 36px;
          max-width: 820px;
          margin: 0 auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }

        .modal-tickets-doc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 22px;
          border-bottom: 1.5px solid #F1F5F9;
          flex-wrap: wrap;
        }

        .modal-tickets-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .tickets-brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-doc-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }

        .modal-doc-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 0;
        }

        .modal-tickets-stats-strip {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-pill-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 14px;
          border-radius: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          min-width: 62px;
        }

        .stat-pill-num {
          font-size: 1rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.2;
        }

        .stat-pill-lbl {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .stat-pill-box.pill-open .stat-pill-num { color: #D97706; }
        .stat-pill-box.pill-progress .stat-pill-num { color: #2563EB; }
        .stat-pill-box.pill-resolved .stat-pill-num { color: #059669; }

        .modal-tickets-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: 22px 0 18px 0;
          flex-wrap: wrap;
        }

        .modal-tickets-search {
          position: relative;
          flex: 1;
          min-width: 240px;
        }

        .modal-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }

        .modal-search-input {
          width: 100%;
          height: 38px;
          padding: 0 32px 0 34px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background: #FAFCFC;
          font-size: 0.8125rem;
          color: #0F172A;
          outline: none;
          transition: all 0.2s ease;
        }

        .modal-search-input:focus {
          border-color: #0D7A75;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }

        .modal-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: #E2E8F0;
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
        }

        .modal-status-tabs {
          display: flex;
          align-items: center;
          background: #F1F5F9;
          padding: 3px;
          border-radius: 10px;
          gap: 2px;
        }

        .modal-tab-btn {
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748B;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .modal-tab-btn.active {
          background: #ffffff;
          color: #0D7A75;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .modal-tickets-list-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modal-ticket-card-item {
          background: #FAFCFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.15s ease;
        }

        .modal-ticket-card-item:hover {
          border-color: #CBD5E1;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.04);
        }

        .modal-ticket-card-item.is-open {
          border-color: #0D7A75;
          background: #ffffff;
          box-shadow: 0 4px 16px rgba(13, 122, 117, 0.08);
        }

        .modal-ticket-card-header {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          gap: 14px;
        }

        .modal-ticket-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .modal-ticket-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-ticket-info-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .modal-ticket-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .modal-ticket-subject {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .modal-ticket-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #64748B;
          flex-wrap: wrap;
        }

        .modal-ticket-code {
          font-weight: 700;
          color: #0D7A75;
        }

        .modal-ticket-dot {
          color: #CBD5E1;
        }

        .modal-chevron-icon {
          color: #94A3B8;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .modal-ticket-expanded-drawer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.25s ease-out;
          background: #F8FAFC;
          border-top: 1px solid #F1F5F9;
        }

        .modal-ticket-expanded-drawer.open {
          max-height: 600px;
        }

        .modal-drawer-inner {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modal-ticket-msg-box {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .modal-msg-heading {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: block;
          margin-bottom: 4px;
        }

        .modal-msg-body {
          font-size: 0.84375rem;
          color: #334155;
          margin: 0;
          line-height: 1.5;
        }

        .modal-ticket-reply-box {
          background: #ECFDF5;
          border: 1.5px solid #A7F3D0;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .modal-reply-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 0.75rem;
        }

        .modal-reply-time {
          font-size: 0.7rem;
          color: #059669;
          font-weight: 600;
        }

        .modal-reply-body {
          font-size: 0.84375rem;
          color: #064E3B;
          font-weight: 600;
          margin: 0;
          line-height: 1.5;
        }

        .modal-ticket-pending-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.78125rem;
          color: #92400E;
          font-weight: 500;
        }

        .modal-empty-tickets-state {
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        @media (max-width: 768px) {
          .help-support-portal {
            padding: 8px 0 16px 0 !important;
          }

          .help-main-title {
            font-size: 1.45rem !important;
          }

          .help-main-subtitle {
            font-size: 0.8125rem !important;
          }

          .content-card.raise-request-card,
          .content-card.recent-tickets-card,
          .content-card.faq-section-card {
            padding: 16px 14px !important;
            border-radius: 16px !important;
          }

          .support-category-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }

          .category-pill-btn {
            padding: 8px 10px !important;
            font-size: 0.75rem !important;
          }

          /* Modal Responsive */
          .modal-overlay {
            padding: 8px 6px !important;
          }

          .modal-container {
            width: 100% !important;
            height: calc(100vh - 16px) !important;
            max-height: calc(100vh - 16px) !important;
            border-radius: 14px !important;
          }

          .modal-top-bar {
            padding: 10px 12px !important;
          }

          .modal-search-wrapper {
            width: 100% !important;
            max-width: 100% !important;
          }

          .modal-filter-pills {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 4px !important;
          }

          .modal-filter-pill {
            flex-shrink: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HelpSupport;
