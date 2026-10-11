import React, { useState, useEffect } from 'react';
import { supportApi, contentApi } from '../api/apiClient';
import { 
  HelpCircle, 
  Send, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

export const HelpSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, faqsRes] = await Promise.all([
        supportApi.getTickets().catch(() => ({ data: [] })),
        contentApi.getFaqs().catch(() => ({ data: [] }))
      ]);
      setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : ticketsRes.data?.results || []);
      setFaqs(Array.isArray(faqsRes.data) ? faqsRes.data : faqsRes.data?.results || []);
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

  return (
    <div className="portal-container">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Help & Assistance</div>
        <h1 className="text-2xl font-bold text-navy">Customer Help Desk</h1>
        <p className="text-sm text-muted">Submit queries, report garment concerns, and read common laundry FAQs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Submit Ticket & FAQs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submit Support Ticket Card */}
          <div className="content-card">
            <h3 className="font-bold text-navy text-base mb-3 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              <span>Raise a Support Request</span>
            </h3>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Issue Subject *</label>
                <input 
                  type="text"
                  required
                  placeholder="E.g., Pickup delayed, question about silk care..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Priority</label>
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

              <div>
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

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>

          {/* FAQs Accordion */}
          <div className="content-card">
            <h3 className="font-bold text-navy text-base mb-3 flex items-center gap-2">
              <HelpCircle size={18} className="text-primary" />
              <span>Frequently Asked Questions</span>
            </h3>

            <div className="space-y-3">
              {[
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
              ].map((faq) => (
                <div key={faq.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full p-3.5 text-left font-semibold text-navy text-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {expandedFaq === faq.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Contact Direct & My Tickets */}
        <div className="space-y-6">
          {/* Quick Contact Box */}
          <div className="content-card bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <h3 className="font-bold text-lg mb-2">Need Immediate Help?</h3>
            <p className="text-xs text-blue-100 mb-4">
              Our laundry coordination desk is available Mon - Sun from 8:00 AM to 9:00 PM.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="text-xs text-blue-200 block">Toll-Free Helpline</span>
                  <span className="font-bold">+91 1800 572 8282</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="text-xs text-blue-200 block">Customer Support Email</span>
                  <span className="font-bold">support@fabricare.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* My Tickets List */}
          <div className="content-card">
            <h3 className="font-bold text-navy text-sm mb-3">My Support Tickets</h3>
            {tickets.length === 0 ? (
              <p className="text-xs text-muted">No open support tickets.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map(t => (
                  <div key={t.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex justify-between font-semibold text-navy">
                      <span>{t.ticket_number || `Ticket #${t.id}`}</span>
                      <span className="badge badge-warning text-[10px]">{t.status}</span>
                    </div>
                    <div className="text-slate-600 mt-1 truncate">{t.subject}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
