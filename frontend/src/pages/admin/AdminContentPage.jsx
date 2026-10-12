import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  HelpCircle, 
  FileText, 
  Plus, 
  Edit, 
  MoreHorizontal, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  List, 
  Link, 
  Image as ImageIcon, 
  Undo, 
  Redo, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  X,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const AdminContentPage = () => {
  const { faqs, setFaqs, termsContent, updateTerms } = useAdmin();

  const [activeTab, setActiveTab] = useState('faqs');
  const [editingTitle, setEditingTitle] = useState(termsContent?.title || 'Terms & Conditions');
  const [editingBody, setEditingBody] = useState(termsContent?.body || '');
  const [saveToast, setSaveToast] = useState(false);

  // Modal State for Add / Edit FAQ
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    status: 'Active',
    displayOrder: 1
  });

  // Sync state when termsContent updates from Firestore
  useEffect(() => {
    if (termsContent) {
      if (termsContent.title) setEditingTitle(termsContent.title);
      if (termsContent.body) setEditingBody(termsContent.body);
    }
  }, [termsContent]);

  const handleUpdatePage = async () => {
    const updated = {
      title: editingTitle,
      body: editingBody
    };
    if (typeof updateTerms === 'function') {
      await updateTerms(updated);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleReset = () => {
    setEditingTitle('Terms & Conditions');
    setEditingBody(
      `1. Introduction\nWelcome to FabriCare. These Terms & Conditions govern your use of our website, mobile application and laundry services. By accessing our services, you agree to comply with and be bound by these terms.\n\n2. Services\nFabriCare provides professional laundry and dry cleaning services, including pickup and delivery. Service details, pricing and turnaround time may vary based on location and fabric type.\n\n3. Orders & Pickup\nOrders can be placed through our website, mobile app or by phone. Pickup and delivery timings are subject to availability. Please ensure clothes are securely packed and handed over in clean condition.\n\n4. Pricing & Payment\nPrices are based on the type of garment, fabric and service selected.`
    );
  };

  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({
      question: '',
      answer: '',
      status: 'Active',
      displayOrder: faqs.length + 1
    });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
      displayOrder: faq.displayOrder
    });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;

    if (editingFaq) {
      setFaqs(prev => prev.map(f => f.id === editingFaq.id ? { ...f, ...faqForm } : f));
    } else {
      const newFaq = {
        id: faqs.length + 1,
        ...faqForm
      };
      setFaqs(prev => [...prev, newFaq]);
    }
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = (id) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
  };

  const toggleFaqStatus = (id) => {
    setFaqs(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, status: f.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return f;
    }));
  };

  return (
    <div className="admin-content-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Content</h1>
          <p className="page-subtitle">Manage website and app content like FAQs and informational sections.</p>
        </div>

        {activeTab === 'faqs' && (
          <button className="btn btn-teal" onClick={handleOpenAddFaq}>
            <Plus size={18} />
            <span>Add FAQ</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="content-nav-pills-row">
        <button 
          className={`content-pill-btn ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          <HelpCircle size={16} />
          <span>FAQs</span>
        </button>

        <button 
          className={`content-pill-btn ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          <FileText size={16} />
          <span>Terms & Policies</span>
        </button>
      </div>

      {/* TAB 1: FAQS */}
      {activeTab === 'faqs' && (
        <div className="orders-table-card animate-fade-in">
          <div className="table-responsive">
            <table className="orders-full-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Answer (Preview)</th>
                  <th>Status</th>
                  <th>Display Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map(faq => (
                  <tr key={faq.id}>
                    <td>
                      <strong className="faq-q-text">{faq.question}</strong>
                    </td>
                    <td>
                      <span className="faq-ans-preview">{faq.answer}</span>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className={`status-pill clickable-pill ${faq.status.toLowerCase()}`}
                        onClick={() => toggleFaqStatus(faq.id)}
                        title="Click to toggle status"
                      >
                        ● {faq.status}
                      </button>
                    </td>
                    <td>
                      <strong className="display-order-num">{faq.displayOrder}</strong>
                    </td>
                    <td>
                      <div className="actions-cell-row">
                        <button 
                          className="action-icon-btn" 
                          onClick={() => handleOpenEditFaq(faq)}
                          title="Edit FAQ"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="action-icon-btn text-danger" 
                          onClick={() => handleDeleteFaq(faq.id)}
                          title="Delete FAQ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-pagination-footer">
            <span className="pagination-info">Showing 1-{faqs.length} of {faqs.length} FAQs</span>
            <div className="pagination-pages">
              <button className="page-btn"><ChevronLeft size={16} /></button>
              <button className="page-btn active">1</button>
              <button className="page-btn"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TERMS & POLICIES (EDITOR + LIVE PREVIEW) */}
      {activeTab === 'terms' && (
        <div className="terms-editor-grid animate-fade-in">
          {/* Left Editor Card */}
          <div className="terms-editor-card">
            <div className="terms-card-header">
              <h2 className="editor-heading">Terms & Conditions</h2>
              <p className="editor-sub">Edit the terms and conditions for your website and customer app.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Page Title *</label>
              <input 
                type="text"
                className="modal-input"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
              />
            </div>

            <div className="form-group mt-3">
              <label className="form-label">Content *</label>
              
              {/* Rich Text Toolbar */}
              <div className="editor-toolbar">
                <select className="toolbar-select">
                  <option>Paragraph</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>
                <div className="toolbar-divider" />
                <button type="button" className="toolbar-btn"><Bold size={14} /></button>
                <button type="button" className="toolbar-btn"><Italic size={14} /></button>
                <button type="button" className="toolbar-btn"><Underline size={14} /></button>
                <div className="toolbar-divider" />
                <button type="button" className="toolbar-btn"><AlignLeft size={14} /></button>
                <button type="button" className="toolbar-btn"><List size={14} /></button>
                <button type="button" className="toolbar-btn"><Link size={14} /></button>
                <button type="button" className="toolbar-btn"><ImageIcon size={14} /></button>
                <div className="toolbar-divider" />
                <button type="button" className="toolbar-btn"><Undo size={14} /></button>
                <button type="button" className="toolbar-btn"><Redo size={14} /></button>
              </div>

              <textarea 
                rows="14"
                className="terms-editor-textarea"
                value={editingBody}
                onChange={(e) => setEditingBody(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="terms-actions-footer">
              <button type="button" className="btn btn-outline-teal" onClick={handleReset}>
                <RotateCcw size={14} />
                <span>Reset to Default</span>
              </button>

              <div className="terms-right-btns">
                <button type="button" className="btn btn-white" onClick={() => setSaveToast(true)}>Save as Draft</button>
                <button type="button" className="btn btn-teal" onClick={handleUpdatePage}>
                  Update Page
                </button>
              </div>
            </div>

            {saveToast && (
              <div className="save-toast-banner animate-fade-in">
                <CheckCircle2 size={16} />
                <span>Terms & Conditions updated and saved successfully!</span>
              </div>
            )}
          </div>

          {/* Right Live Preview Card */}
          <div className="terms-preview-card">
            <div className="terms-card-header">
              <h2 className="editor-heading">Live Preview</h2>
              <p className="editor-sub">This is how it will appear on your website or app.</p>
            </div>

            <div className="live-preview-container">
              {/* Preview Hero */}
              <div className="preview-hero-banner">
                <div className="preview-hero-text">
                  <span className="preview-tag">TERMS & CONDITIONS</span>
                  <h3 className="preview-title">{editingTitle || 'Our Terms & Conditions'}</h3>
                  <p className="preview-sub">Please read these terms carefully before using FabriCare services.</p>
                </div>
                <div className="preview-hero-thumb">
                  <img src="/assets/folded-towels.jpg" alt="Towels" />
                </div>
              </div>

              {/* Preview Document Render */}
              <div className="preview-doc-body">
                {editingBody.split('\n\n').map((paragraph, index) => {
                  const lines = paragraph.split('\n');
                  const firstLine = lines[0];
                  const isHeading = /^\d+\./.test(firstLine);

                  return (
                    <div key={index} className="preview-section-block">
                      {isHeading ? (
                        <>
                          <h4 className="preview-section-heading">{firstLine}</h4>
                          <p className="preview-section-text">{lines.slice(1).join(' ')}</p>
                        </>
                      ) : (
                        <p className="preview-section-text">{paragraph}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FAQ MODAL */}
      {isFaqModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsFaqModalOpen(false)}>
          <div className="modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
              <button className="modal-close-btn" onClick={() => setIsFaqModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="modal-body">
              <div className="form-group">
                <label className="form-label">Question *</label>
                <input 
                  type="text" 
                  required 
                  className="modal-input" 
                  placeholder="e.g. How does pickup and delivery work?"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                />
              </div>

              <div className="form-group mt-3">
                <label className="form-label">Answer *</label>
                <textarea 
                  rows="4"
                  required
                  className="modal-input"
                  placeholder="Enter detailed answer..."
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                />
              </div>

              <div className="form-row-2 mt-3">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="modal-input"
                    value={faqForm.status}
                    onChange={(e) => setFaqForm({ ...faqForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input 
                    type="number"
                    min="1"
                    className="modal-input"
                    value={faqForm.displayOrder}
                    onChange={(e) => setFaqForm({ ...faqForm, displayOrder: Number(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="modal-footer mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setIsFaqModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-teal">
                  {editingFaq ? 'Update FAQ' : 'Add FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-content-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .content-nav-pills-row {
          display: flex;
          gap: 12px;
        }

        .content-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 18px;
          font-size: 0.875rem;
          font-weight: 700;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s;
        }

        .content-pill-btn:hover {
          border-color: #BCEAE6;
          color: #0D7A75;
        }

        .content-pill-btn.active {
          background: #EBF8F7;
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .clickable-pill {
          cursor: pointer;
          border: none;
          background: none;
        }

        .text-danger {
          color: #EF4444 !important;
        }

        .faq-q-text {
          font-size: 0.875rem;
          color: #1E293B;
          display: block;
          max-width: 280px;
        }

        .faq-ans-preview {
          font-size: 0.8125rem;
          color: #64748B;
          display: block;
          max-width: 380px;
          line-height: 1.5;
        }

        .display-order-num {
          font-size: 0.9375rem;
          color: #1E293B;
        }

        /* TERMS & POLICIES GRID */
        .terms-editor-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .terms-editor-card, .terms-preview-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .terms-card-header {
          margin-bottom: 20px;
        }

        .editor-heading {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1E293B;
        }

        .editor-sub {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .editor-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-bottom: none;
          border-radius: 10px 10px 0 0;
          padding: 8px 12px;
          flex-wrap: wrap;
        }

        .toolbar-select {
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 0.75rem;
          outline: none;
        }

        .toolbar-btn {
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
        }

        .toolbar-btn:hover {
          background: #E2E8F0;
          color: #1E293B;
        }

        .toolbar-divider {
          width: 1px;
          height: 18px;
          background: #E2E8F0;
          margin: 0 4px;
        }

        .terms-editor-textarea {
          width: 100%;
          border: 1.5px solid #E2E8F0;
          border-radius: 0 0 10px 10px;
          padding: 16px;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #1E293B;
          outline: none;
          resize: vertical;
          font-family: inherit;
        }

        .terms-actions-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
        }

        .terms-right-btns {
          display: flex;
          gap: 12px;
        }

        .save-toast-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #DCFCE7;
          color: #15803D;
          border: 1px solid #86EFAC;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 700;
          margin-top: 16px;
        }

        /* LIVE PREVIEW */
        .live-preview-container {
          background: #FAFCFC;
          border: 1.5px solid #E6EEF0;
          border-radius: 16px;
          padding: 20px;
          max-height: 560px;
          overflow-y: auto;
        }

        .preview-hero-banner {
          background: linear-gradient(135deg, #EBF8F7 0%, #E0F4F2 100%);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .preview-tag {
          font-size: 0.6875rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 4px;
        }

        .preview-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1E293B;
          margin-bottom: 4px;
        }

        .preview-sub {
          font-size: 0.75rem;
          color: #64748B;
        }

        .preview-hero-thumb {
          width: 90px;
          height: 65px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .preview-hero-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-doc-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .preview-section-heading {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #1E293B;
          margin-bottom: 4px;
        }

        .preview-section-text {
          font-size: 0.8125rem;
          color: #475569;
          line-height: 1.6;
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal-container {
          background: #FFFFFF;
          border-radius: 20px;
          max-width: 500px;
          width: 100%;
          padding: 28px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1E293B;
        }

        .modal-close-btn {
          background: #F1F5F9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        @media (max-width: 1024px) {
          .terms-editor-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
