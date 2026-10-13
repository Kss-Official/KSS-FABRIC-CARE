import React, { useState, useEffect, useRef } from 'react';
import { supportApi, contentApi } from '../api/apiClient';
import { useBooking } from '../context/BookingContext';
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
  ChevronRight
} from 'lucide-react';

export const HelpSupport = () => {
  const { navigateTo } = useBooking();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const faqCardRef = useRef(null);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const ticketsRes = await supportApi.getTickets().catch(() => ({ data: [] }));
      const list = Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data?.results || []);
      setTickets(list);
    } catch (err) {
      console.error('Failed to load support data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) return;
    setSubmitting(true);
    try {
      await supportApi.createTicket({ subject, message, priority });
      setSubject('');
      setMessage('');
      setSuccessMsg('Support ticket submitted successfully. Our helpdesk will contact you shortly!');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Failed to submit ticket');
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

  const displayTickets = tickets.length > 0 
    ? tickets.map(t => ({
        id: t.id,
        ticket_number: t.ticket_number || `FC-${1000 + t.id}`,
        subject: t.subject || 'Garment inquiry',
        status: t.status === 'IN_REVIEW' || t.status === 'PENDING' ? 'In Review' : (t.status === 'RESOLVED' ? 'Resolved' : t.status),
        statusColor: t.status === 'RESOLVED' ? 'green' : 'yellow',
        updatedText: t.created_at ? `Last updated ${new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Last updated today'
      }))
    : defaultTickets;

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
            </div>

            <div className="tickets-list">
              {displayTickets.map((t) => (
                <div key={t.id} className="ticket-item-box" onClick={focusTicketForm} title="Click to view ticket details">
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
                        <span className="ticket-meta-subtitle">Ticket #{t.ticket_number}</span>
                        <span className="ticket-meta-dot">•</span>
                        <span className="ticket-updated-time">{t.updatedText}</span>
                      </div>
                      <ChevronRight size={15} className="ticket-chevron-icon" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
};

export default HelpSupport;
