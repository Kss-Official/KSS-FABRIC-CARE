import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin, INITIAL_FAQS_ADMIN, INITIAL_TERMS_CONTENT } from '../../context/AdminContext';
import { 
  HelpCircle, 
  FileText, 
  Plus, 
  Edit2, 
  MoreHorizontal, 
  AlignLeft, 
  List, 
  Link2, 
  Image, 
  Undo2, 
  Redo2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  X,
  Trash2
} from 'lucide-react';

export const AdminContentPage = () => {
  const { 
    faqs: contextFaqs, 
    setFaqs: contextSetFaqs, 
    termsContent: contextTerms, 
    updateTerms 
  } = useAdmin();

  const [localFaqs, setLocalFaqs] = useState(() => (Array.isArray(INITIAL_FAQS_ADMIN) ? INITIAL_FAQS_ADMIN : []));
  const faqs = Array.isArray(contextFaqs) ? contextFaqs : localFaqs;
  const setFaqs = contextSetFaqs || setLocalFaqs;

  const [activeTab, setActiveTab] = useState('faqs');
  const [editingTitle, setEditingTitle] = useState(contextTerms?.title || 'Terms & Conditions');
  const [editingBody, setEditingBody] = useState(
    contextTerms?.body || 
`1. Introduction
Welcome to Laundrix. These Terms & Conditions govern your use of our website, mobile application and laundry services. By accessing our services, you agree to comply with and be bound by these terms.

2. Services
Laundrix provides professional laundry and dry cleaning services, including pickup and delivery. Service details, pricing and turnaround time may vary based on location and fabric type.

3. Orders & Pickup
  Orders can be placed through our website, mobile app or by phone.
  Pickup and delivery timings are subject to availability.
  Please ensure clothes are securely packed and handed over in clean condition.

4. Pricing & Payment
  Prices are based on the type of garment, fabric and service selected.`
  );
  
  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('Paragraph');
  const [openMenuId, setOpenMenuId] = useState(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState([editingBody]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modal State for Add / Edit FAQ
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    status: 'Active',
    displayOrder: 1
  });

  const textareaRef = useRef(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.more-menu-wrapper')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Lock background scroll when FAQ modal is open
  useEffect(() => {
    const wrapper = document.querySelector('.admin-main-wrapper');
    if (isFaqModalOpen) {
      if (wrapper) wrapper.classList.add('admin-scroll-locked');
    } else {
      if (wrapper) wrapper.classList.remove('admin-scroll-locked');
    }
    return () => {
      if (wrapper) wrapper.classList.remove('admin-scroll-locked');
    };
  }, [isFaqModalOpen]);

  const handleBodyChange = (e) => {
    const newVal = e.target.value;
    setEditingBody(newVal);
    // Push new state into history
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newVal);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setEditingBody(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setEditingBody(history[nextIndex]);
    }
  };

  const applyFormat = (formatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editingBody.substring(start, end);
    let replacement = '';

    if (formatType === 'bold') {
      replacement = selectedText ? `**${selectedText}**` : `**bold text**`;
    } else if (formatType === 'italic') {
      replacement = selectedText ? `*${selectedText}*` : `*italic text*`;
    } else if (formatType === 'underline') {
      replacement = selectedText ? `<u>${selectedText}</u>` : `<u>underlined text</u>`;
    } else if (formatType === 'list') {
      replacement = selectedText ? `\n  • ${selectedText}` : `\n  • Item`;
    } else if (formatType === 'link') {
      replacement = selectedText ? `[${selectedText}](https://laundrix.com)` : `[link text](https://laundrix.com)`;
    } else if (formatType === 'image') {
      replacement = `\n![Image description](/assets/terms-folded-clothes.png)\n`;
    } else if (formatType === 'align') {
      replacement = selectedText ? `\n${selectedText}\n` : `\n`;
    }

    const newText = editingBody.substring(0, start) + replacement + editingBody.substring(end);
    setEditingBody(newText);
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newText);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const handleFormatChange = (e) => {
    const format = e.target.value;
    setSelectedFormat(format);
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editingBody.substring(start, end) || 'Heading Text';
    let prefix = '';

    if (format === 'Heading 1') prefix = '# ';
    if (format === 'Heading 2') prefix = '## ';
    if (format === 'Heading 3') prefix = '### ';

    if (prefix) {
      const replacement = `\n${prefix}${selectedText}\n`;
      const newText = editingBody.substring(0, start) + replacement + editingBody.substring(end);
      setEditingBody(newText);
      const updatedHistory = history.slice(0, historyIndex + 1);
      updatedHistory.push(newText);
      setHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    }
  };

  const handleUpdatePage = async () => {
    const updated = {
      title: editingTitle,
      body: editingBody
    };
    if (typeof updateTerms === 'function') {
      await updateTerms(updated);
    }
    setToastMessage('Terms & Conditions updated and published successfully!');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem('fabricare_terms_draft', JSON.stringify({
        title: editingTitle,
        body: editingBody,
        savedAt: new Date().toISOString()
      }));
    } catch (e) {}
    setToastMessage('Draft saved successfully!');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  const handleReset = () => {
    const defaultTitle = 'Terms & Conditions';
    const defaultBody = 
`1. Introduction
Welcome to Laundrix. These Terms & Conditions govern your use of our website, mobile application and laundry services. By accessing our services, you agree to comply with and be bound by these terms.

2. Services
Laundrix provides professional laundry and dry cleaning services, including pickup and delivery. Service details, pricing and turnaround time may vary based on location and fabric type.

3. Orders & Pickup
  Orders can be placed through our website, mobile app or by phone.
  Pickup and delivery timings are subject to availability.
  Please ensure clothes are securely packed and handed over in clean condition.

4. Pricing & Payment
  Prices are based on the type of garment, fabric and service selected.`;

    setEditingTitle(defaultTitle);
    setEditingBody(defaultBody);
    const updatedHistory = [...history, defaultBody];
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setToastMessage('Reset to default terms and conditions.');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqForm({
      question: '',
      answer: '',
      status: 'Active',
      displayOrder: (faqs?.length || 0) + 1
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
      setFaqs(prev => (prev || []).map(f => f.id === editingFaq.id ? { ...f, ...faqForm } : f));
      setToastMessage('FAQ updated successfully!');
    } else {
      const list = faqs || [];
      const newFaq = {
        id: list.length ? Math.max(...list.map(f => Number(f.id) || 0)) + 1 : 1,
        ...faqForm
      };
      setFaqs(prev => [...(prev || []), newFaq]);
      setToastMessage('New FAQ added successfully!');
    }
    setIsFaqModalOpen(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleDeleteFaq = (id) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
    setToastMessage('FAQ removed.');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const toggleFaqStatus = (id) => {
    setFaqs(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, status: f.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return f;
    }));
  };

  // Helper to render formatted preview content
  const renderPreviewContent = (content) => {
    if (!content) return null;
    const blocks = content.split(/\n\s*\n/);

    return blocks.map((block, idx) => {
      const lines = block.split('\n');
      const firstLine = lines[0].trim();
      const isNumberedHeading = /^\d+\.\s+/.test(firstLine);
      const isMarkdownHeading = /^#{1,3}\s+/.test(firstLine);

      if (isNumberedHeading || isMarkdownHeading) {
        const headingText = isMarkdownHeading ? firstLine.replace(/^#{1,3}\s+/, '') : firstLine;
        const subLines = lines.slice(1);

        return (
          <div key={idx} className="preview-block">
            <h4 className="preview-heading">{headingText}</h4>
            {subLines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const isIndented = line.startsWith('  ') || line.startsWith('\t') || line.startsWith('-') || line.startsWith('•');
              const cleanLine = trimmed.replace(/^[-•]\s*/, '');
              return (
                <p 
                  key={lIdx} 
                  className={`preview-body-text ${isIndented ? 'preview-indented' : ''}`}
                >
                  {cleanLine}
                </p>
              );
            })}
          </div>
        );
      }

      return (
        <div key={idx} className="preview-block">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            const isIndented = line.startsWith('  ') || line.startsWith('\t') || line.startsWith('-') || line.startsWith('•');
            const cleanLine = trimmed.replace(/^[-•]\s*/, '');
            return (
              <p 
                key={lIdx} 
                className={`preview-body-text ${isIndented ? 'preview-indented' : ''}`}
              >
                {cleanLine}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="admin-content-page animate-fade-in">
      {/* Page Header */}
      <div className="content-page-header">
        <div className="header-text-group">
          <h1 className="content-page-title">Content</h1>
          <p className="content-page-subtitle">Manage website and app content like FAQs and informational sections.</p>
        </div>

        {activeTab === 'faqs' && (
          <button className="add-faq-btn" onClick={handleOpenAddFaq}>
            <Plus size={18} />
            <span>Add FAQ</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="content-tabs-bar">
        <button 
          type="button"
          className={`content-tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          <HelpCircle size={18} />
          <span>FAQs</span>
        </button>

        <button 
          type="button"
          className={`content-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          <FileText size={18} />
          <span>Terms & Policies</span>
        </button>
      </div>

      {/* Global Notification Toast */}
      {saveToast && (
        <div className="global-toast-banner animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TAB 1: FAQS */}
      {activeTab === 'faqs' && (
        <div className="faqs-card animate-fade-in">
          <div className="faqs-table-wrapper">
            <table className="faqs-table">
              <thead>
                <tr>
                  <th className="th-question">Question</th>
                  <th className="th-answer">Answer (Preview)</th>
                  <th className="th-status">Status</th>
                  <th className="th-order">
                    <div className="order-header-cell">
                      <span>Display</span>
                      <span>Order</span>
                    </div>
                  </th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(faqs || []).map(faq => (
                  <tr key={faq.id}>
                    <td className="td-question">
                      <span className="faq-question-text">{faq.question}</span>
                    </td>
                    <td className="td-answer">
                      <span className="faq-answer-text">{faq.answer}</span>
                    </td>
                    <td className="td-status">
                      <button 
                        type="button" 
                        className={`status-badge-btn ${faq.status === 'Active' ? 'status-active' : 'status-inactive'}`}
                        onClick={() => toggleFaqStatus(faq.id)}
                        title="Click to toggle status"
                      >
                        {faq.status}
                      </button>
                    </td>
                    <td className="td-order">
                      <span className="order-number">{faq.displayOrder}</span>
                    </td>
                    <td className="td-actions">
                      <div className="actions-cell">
                        <button 
                          type="button"
                          className="action-btn" 
                          onClick={() => handleOpenEditFaq(faq)}
                          title="Edit FAQ"
                        >
                          <Edit2 size={15} />
                        </button>
                        
                        <div className="more-menu-wrapper">
                          <button 
                            type="button"
                            className="action-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === faq.id ? null : faq.id);
                            }}
                            title="More options"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {openMenuId === faq.id && (
                            <div className="more-dropdown-menu">
                              <button 
                                type="button" 
                                className="dropdown-menu-item"
                                onClick={() => {
                                  handleOpenEditFaq(faq);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Edit2 size={14} />
                                <span>Edit FAQ</span>
                              </button>
                              <button 
                                type="button" 
                                className="dropdown-menu-item"
                                onClick={() => {
                                  toggleFaqStatus(faq.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <span>Set as {faq.status === 'Active' ? 'Inactive' : 'Active'}</span>
                              </button>
                              <div className="dropdown-divider" />
                              <button 
                                type="button" 
                                className="dropdown-menu-item danger-item"
                                onClick={() => {
                                  handleDeleteFaq(faq.id);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Delete FAQ</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="faqs-pagination-footer">
            <div className="pagination-info">
              Showing <strong>1–{(faqs || []).length}</strong> of <strong>{(faqs || []).length}</strong> FAQs
            </div>
            <div className="pagination-controls">
              <button type="button" className="page-nav-btn" disabled>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="page-num-btn active">
                1
              </button>
              <button type="button" className="page-nav-btn" disabled>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TERMS & POLICIES (EDITOR + LIVE PREVIEW) */}
      {activeTab === 'terms' && (
        <div className="terms-grid animate-fade-in">
          {/* Left Column: Editor Card */}
          <div className="terms-card terms-editor-card">
            <div className="card-header-block">
              <h2 className="card-title">Terms & Conditions</h2>
              <p className="card-subtitle">Edit the terms and conditions for your website and customer app.</p>
            </div>

            <div className="form-field-group">
              <label className="field-label">
                Page Title <span className="req-asterisk">*</span>
              </label>
              <input 
                type="text"
                className="field-input"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Terms & Conditions"
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">
                Content <span className="req-asterisk">*</span>
              </label>
              
              {/* Rich Text Toolbar Container */}
              <div className="rich-editor-box">
                <div className="editor-toolbar">
                  <div className="toolbar-select-wrap">
                    <select 
                      className="toolbar-select"
                      value={selectedFormat}
                      onChange={handleFormatChange}
                    >
                      <option value="Paragraph">Paragraph</option>
                      <option value="Heading 1">Heading 1</option>
                      <option value="Heading 2">Heading 2</option>
                      <option value="Heading 3">Heading 3</option>
                    </select>
                    <ChevronDown size={14} className="select-arrow" />
                  </div>

                  <div className="toolbar-sep" />

                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={() => applyFormat('bold')} 
                    title="Bold"
                  >
                    <span className="font-bold-txt">B</span>
                  </button>
                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={() => applyFormat('italic')} 
                    title="Italic"
                  >
                    <span className="font-italic-txt">I</span>
                  </button>
                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={() => applyFormat('underline')} 
                    title="Underline"
                  >
                    <span className="font-underline-txt">U</span>
                  </button>

                  <div className="toolbar-sep" />

                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={() => applyFormat('align')} 
                    title="Align Left"
                  >
                    <AlignLeft size={15} />
                  </button>
                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={() => applyFormat('list')} 
                    title="Bullet List"
                  >
                    <List size={15} />
                  </button>

                  <div className="toolbar-sep" />

                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={() => applyFormat('link')} 
                    title="Insert Link"
                  >
                    <Link2 size={15} />
                  </button>
                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={() => applyFormat('image')} 
                    title="Insert Image"
                  >
                    <Image size={15} />
                  </button>

                  <div className="toolbar-sep" />

                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={handleUndo} 
                    title="Undo"
                    disabled={historyIndex <= 0}
                  >
                    <Undo2 size={15} />
                  </button>
                  <button 
                    type="button" 
                    className="toolbar-icon-btn" 
                    onClick={handleRedo} 
                    title="Redo"
                    disabled={historyIndex >= history.length - 1}
                  >
                    <Redo2 size={15} />
                  </button>
                </div>

                <textarea 
                  ref={textareaRef}
                  rows="16"
                  className="editor-textarea"
                  value={editingBody}
                  onChange={handleBodyChange}
                  placeholder="Write your terms and conditions here..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="editor-footer-actions">
              <button type="button" className="btn-reset" onClick={handleReset}>
                <RotateCcw size={15} />
                <span>Reset to Default</span>
              </button>

              <div className="editor-right-buttons">
                <button type="button" className="btn-draft" onClick={handleSaveDraft}>
                  Save as Draft
                </button>
                <button type="button" className="btn-update" onClick={handleUpdatePage}>
                  Update Page
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview Card */}
          <div className="terms-card terms-preview-card">
            <div className="card-header-block">
              <h2 className="card-title">Live Preview</h2>
              <p className="card-subtitle">This is how it will appear on your website or app.</p>
            </div>

            <div className="live-preview-box">
              {/* Banner with gradient and folded laundry image asset */}
              <div className="preview-banner">
                <div className="preview-banner-content">
                  <span className="preview-banner-tag">TERMS & CONDITIONS</span>
                  <h3 className="preview-banner-title">
                    {editingTitle.toLowerCase().includes('our') 
                      ? editingTitle 
                      : `Our ${editingTitle || 'Terms & Conditions'}`}
                  </h3>
                  <p className="preview-banner-desc">
                    Please read these terms carefully before using Laundrix services.
                  </p>
                </div>
                <div className="preview-banner-media">
                  <img 
                    src="/assets/terms-folded-clothes.png" 
                    alt="Folded Laundry" 
                    className="preview-clothes-img"
                  />
                </div>
              </div>

              {/* Document Text Body */}
              <div className="preview-sections-list">
                {renderPreviewContent(editingBody)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FAQ MODAL - EXACT REPRODUCTION OF SECOND REFERENCE IMAGE */}
      {isFaqModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="modal-backdrop" onClick={() => setIsFaqModalOpen(false)}>
          <div className="modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsFaqModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="modal-body">
              <div className="modal-form-group">
                <label className="modal-form-label">
                  Question <span className="modal-req-star">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  className="modal-field-input" 
                  placeholder="How does Laundryx pick..."
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-form-label">
                  Answer <span className="modal-req-star">*</span>
                </label>
                <textarea 
                  rows="4"
                  required
                  className="modal-field-textarea"
                  placeholder="Schedule a pickup through our app or website. Our executive will arrive..."
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                />
              </div>

              <div className="modal-form-grid-2col">
                <div className="modal-form-group">
                  <label className="modal-form-label">Status</label>
                  <div className="modal-select-wrapper">
                    <select 
                      className="modal-field-select"
                      value={faqForm.status}
                      onChange={(e) => setFaqForm({ ...faqForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown size={16} className="modal-select-chevron" />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Display Order</label>
                  <input 
                    type="number"
                    min="1"
                    className="modal-field-input"
                    value={faqForm.displayOrder}
                    onChange={(e) => setFaqForm({ ...faqForm, displayOrder: Number(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsFaqModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  {editingFaq ? 'Update FAQ' : 'Add FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* STYLES MATCHING THE REFERENCE DESIGNS */}
      <style>{`
        .admin-content-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          color: #0F172A;
          font-family: inherit;
        }

        /* HEADER */
        .content-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .header-text-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .content-page-title {
          font-size: 2rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.025em;
          margin: 0;
          line-height: 1.2;
        }

        .content-page-subtitle {
          font-size: 0.9375rem;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
        }

        .add-faq-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
          white-space: nowrap;
        }

        .add-faq-btn:hover {
          background: #0B6763;
        }

        .add-faq-btn:active {
          transform: scale(0.98);
        }

        /* TABS BAR */
        .content-tabs-bar {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .content-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .content-tab-btn:hover {
          border-color: #CBD5E1;
          color: #1E293B;
        }

        .content-tab-btn.active {
          border: 1.5px solid #0D7A75;
          color: #0D7A75;
          font-weight: 600;
          background: #FFFFFF;
        }

        /* GLOBAL TOAST */
        .global-toast-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #DCFCE7;
          border: 1px solid #86EFAC;
          color: #15803D;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        /* FAQS TABLE CARD */
        .faqs-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .faqs-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .faqs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .faqs-table thead tr {
          border-bottom: 1px solid #E2E8F0;
        }

        .faqs-table th {
          padding: 16px 24px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748B;
          white-space: nowrap;
          background: #FFFFFF;
        }

        .th-question {
          width: 25%;
        }

        .th-answer {
          width: 45%;
        }

        .th-status {
          text-align: center;
          width: 10%;
        }

        .th-order {
          text-align: center;
          width: 10%;
        }

        .th-actions {
          text-align: center;
          width: 10%;
        }

        .order-header-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.15;
          font-size: 0.8125rem;
        }

        .faqs-table tbody tr {
          border-bottom: 1px solid #F1F5F9;
          transition: background-color 0.15s ease;
        }

        .faqs-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .faqs-table td {
          padding: 18px 24px;
          vertical-align: middle;
        }

        .faq-question-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          display: block;
          line-height: 1.45;
          max-width: 260px;
        }

        .faq-answer-text {
          font-size: 0.84375rem;
          font-weight: 400;
          color: #64748B;
          display: block;
          line-height: 1.5;
          max-width: 480px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .td-status {
          text-align: center;
        }

        .status-badge-btn {
          border: none;
          border-radius: 9999px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          display: inline-block;
        }

        .status-badge-btn:hover {
          opacity: 0.85;
        }

        .status-badge-btn:active {
          transform: scale(0.96);
        }

        .status-active {
          background: #DCFCE7;
          color: #166534;
        }

        .status-inactive {
          background: #FEE2E2;
          color: #DC2626;
        }

        .td-order {
          text-align: center;
        }

        .order-number {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .td-actions {
          text-align: center;
        }

        .actions-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 7px 11px;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #0F172A;
        }

        .more-menu-wrapper {
          position: relative;
        }

        .more-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          padding: 6px;
          min-width: 170px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #334155;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .dropdown-menu-item:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .dropdown-menu-item.danger-item {
          color: #DC2626;
        }

        .dropdown-menu-item.danger-item:hover {
          background: #FEE2E2;
          color: #B91C1C;
        }

        .dropdown-divider {
          height: 1px;
          background: #F1F5F9;
          margin: 4px 0;
        }

        /* PAGINATION */
        .faqs-pagination-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid #F1F5F9;
          background: #FFFFFF;
        }

        .pagination-info {
          font-size: 0.875rem;
          color: #64748B;
        }

        .pagination-info strong {
          color: #0F172A;
          font-weight: 700;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .page-nav-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s;
        }

        .page-nav-btn:hover:not(:disabled) {
          border-color: #CBD5E1;
          color: #0F172A;
        }

        .page-nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-num-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
        }

        .page-num-btn.active {
          background: #0D7A75;
          color: #FFFFFF;
        }

        /* TERMS & POLICIES GRID */
        .terms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .terms-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
        }

        .terms-editor-card {
          max-height: calc(100vh - 190px);
          max-height: calc(100dvh - 190px);
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .terms-preview-card {
          position: sticky;
          top: 16px;
          max-height: calc(100vh - 190px);
          max-height: calc(100dvh - 190px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .card-header-block {
          margin-bottom: 24px;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
        }

        .form-field-group {
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 8px;
        }

        .req-asterisk {
          color: #EF4444;
          font-weight: 700;
        }

        .field-input {
          width: 100%;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.875rem;
          color: #0F172A;
          background: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .field-input:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }

        /* RICH TEXT EDITOR BOX */
        .rich-editor-box {
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
          background: #FFFFFF;
          transition: border-color 0.15s;
        }

        .rich-editor-box:focus-within {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }

        .editor-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          flex-wrap: wrap;
        }

        .toolbar-select-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .toolbar-select {
          appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 5px 28px 5px 10px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #0F172A;
          outline: none;
          cursor: pointer;
        }

        .select-arrow {
          position: absolute;
          right: 8px;
          pointer-events: none;
          color: #64748B;
        }

        .toolbar-sep {
          width: 1px;
          height: 18px;
          background: #E2E8F0;
          margin: 0 4px;
        }

        .toolbar-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 5px 8px;
          border-radius: 4px;
          color: #475569;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.15s, color 0.15s;
        }

        .toolbar-icon-btn:hover:not(:disabled) {
          background: #F1F5F9;
          color: #0F172A;
        }

        .toolbar-icon-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .font-bold-txt {
          font-weight: 800;
          font-family: inherit;
        }

        .font-italic-txt {
          font-style: italic;
          font-family: serif;
          font-weight: 600;
        }

        .font-underline-txt {
          text-decoration: underline;
          font-weight: 600;
        }

        .editor-textarea {
          width: 100%;
          min-height: 440px;
          border: none;
          padding: 16px;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #0F172A;
          background: #FFFFFF;
          outline: none;
          resize: vertical;
          font-family: inherit;
          box-sizing: border-box;
          overscroll-behavior: contain;
        }

        /* EDITOR FOOTER */
        .editor-footer-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
          gap: 12px;
        }

        .btn-reset {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0F172A;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-reset:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .editor-right-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-draft {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0F172A;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-draft:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .btn-update {
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s, transform 0.1s;
        }

        .btn-update:hover {
          background: #0B6763;
        }

        .btn-update:active {
          transform: scale(0.98);
        }

        /* LIVE PREVIEW CARD */
        .live-preview-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
          flex: 1;
        }

        .preview-banner {
          background: linear-gradient(135deg, #E6F2F7 0%, #D8E8EF 100%);
          border-radius: 14px;
          padding: 24px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .preview-banner-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-width: 58%;
        }

        .preview-banner-tag {
          font-size: 0.71875rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .preview-banner-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.25;
        }

        .preview-banner-desc {
          font-size: 0.84375rem;
          color: #475569;
          margin: 0;
          line-height: 1.45;
        }

        .preview-banner-media {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          max-width: 40%;
        }

        .preview-clothes-img {
          width: 175px;
          height: auto;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 6px 12px rgba(13, 122, 117, 0.08));
        }

        .preview-sections-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          overflow-y: auto;
          overscroll-behavior: contain;
          flex: 1;
          padding-right: 4px;
        }

        .preview-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .preview-heading {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          margin: 4px 0 2px 0;
          line-height: 1.4;
        }

        .preview-body-text {
          font-size: 0.84375rem;
          color: #475569;
          line-height: 1.55;
          margin: 2px 0;
        }

        .preview-indented {
          padding-left: 18px;
          position: relative;
        }

        /* MODAL - EXACT MATCH TO SECOND REFERENCE IMAGE */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px 16px;
          overflow: hidden;
          overscroll-behavior: none;
        }

        .modal-container {
          background: #FFFFFF;
          border-radius: 20px;
          max-width: 580px;
          width: 100%;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          padding: 32px 34px 28px 34px;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.22), 0 0 1px 1px rgba(0, 0, 0, 0.04);
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          overscroll-behavior: contain;
          animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-shrink: 0;
        }

        .modal-title {
          font-size: 1.375rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .modal-close-btn {
          background: #F1F5F9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .modal-close-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
          overscroll-behavior: contain;
          flex: 1 1 auto;
          min-height: 0;
        }

        .modal-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .modal-form-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .modal-req-star {
          color: #F43F5E;
          font-weight: 800;
          font-size: 0.9375rem;
        }

        .modal-field-input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: inherit;
          color: #0F172A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .modal-field-input:hover {
          border-color: #94A3B8;
        }

        .modal-field-input:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .modal-field-input::placeholder {
          color: #94A3B8;
        }

        .modal-field-textarea {
          width: 100%;
          min-height: 115px;
          padding: 14px 16px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: inherit;
          color: #0F172A;
          line-height: 1.5;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .modal-field-textarea:hover {
          border-color: #94A3B8;
        }

        .modal-field-textarea:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .modal-field-textarea::placeholder {
          color: #94A3B8;
        }

        .modal-form-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .modal-select-wrapper {
          position: relative;
          width: 100%;
        }

        .modal-field-select {
          width: 100%;
          height: 48px;
          padding: 0 40px 0 16px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: inherit;
          font-weight: 500;
          color: #0F172A;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .modal-field-select:hover {
          border-color: #94A3B8;
        }

        .modal-field-select:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .modal-select-chevron {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
          pointer-events: none;
        }

        .modal-footer-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }

        .btn-modal-cancel {
          padding: 11px 26px;
          border-radius: 9999px;
          background: #F1F5F9;
          border: none;
          color: #0F172A;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background-color 0.15s;
        }

        .btn-modal-cancel:hover {
          background: #E2E8F0;
        }

        .btn-modal-submit {
          padding: 11px 28px;
          border-radius: 9999px;
          background: #0D7A75;
          border: none;
          color: #FFFFFF;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .btn-modal-submit:hover {
          background: #0B6B67;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(13, 122, 117, 0.25);
        }

        @media (max-width: 580px) {
          .modal-form-grid-2col {
            grid-template-columns: 1fr;
          }
          .modal-container {
            padding: 24px 20px;
          }
        }

        @media (max-width: 1024px) {
          .terms-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
