import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Pencil, Trash2, MoreHorizontal, Copy, X, Reply } from 'lucide-react';
import ImageWithFallback from '../../../ui/ImageWithFallback.jsx';

export default function ChatMessage({ message, previousMessage, user, profile, partner, onExpandImage, onUpdate, onReply, repliedMessage, showSentStatus, sentStatusLeaving }) {
  const [hidden, setHidden] = useState(() => {
    try {
      const preferences = JSON.parse(localStorage.getItem('skillsignal.appearance') || '{}');
      return Boolean(message.imageSpoiler || preferences.blurChatImages || preferences.showInlineMedia === false);
    } catch { return false; }
  });
  useEffect(() => {
    if (message.imageSpoiler) setHidden(true);
  }, [message.id, message.imageSpoiler]);
  const [menu, setMenu] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [draft, setDraft] = useState(message.body || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const menuRef = useRef(null);
  const actionsRef = useRef(null);
  const editorRef = useRef(null);
  useLayoutEffect(() => {
    if (!editing || !editorRef.current) return;
    const editor = editorRef.current;
    editor.style.height = 'auto';
    const maxHeight = Math.floor(window.innerHeight * 0.55);
    editor.style.height = `${Math.min(editor.scrollHeight, maxHeight)}px`;
    editor.style.overflowY = editor.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [draft, editing]);
  const deleteDialogRef = useRef(null);
  useEffect(() => {
    if (!deleting) return;
    const dialog = deleteDialogRef.current;
    dialog.showModal();
    dialog.querySelector('[data-cancel]')?.focus();
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      actionsRef.current?.focus();
    };
  }, [deleting]);
  function requestDelete(event) {
    setMenu(null); setEditing(false); setError('');
    if (event.shiftKey) { save(true); return; }
    setDeleting(true);
  }
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector('button')?.focus();
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenu(null);
    };
    const key = (event) => {
      if (event.key === 'Escape') { setMenu(null); actionsRef.current?.focus(); }
      if (event.key === 'Tab') setMenu(null);
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        const buttons = [...menuRef.current.querySelectorAll('button')];
        const index = buttons.indexOf(document.activeElement);
        buttons[(index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus();
      }
    };
    const scroll = (event) => { if (!menuRef.current?.contains(event.target)) setMenu(null); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [menu]);
  function openMenu(event) {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    setMenu({ left: Math.max(8, Math.min(event.clientX || bounds.left, window.innerWidth - 220)),
      top: Math.max(8, Math.min(event.clientY || bounds.bottom, window.innerHeight - 240)) });
  }
  async function save(remove = false) {
    setBusy(true); setError('');
    try { await onUpdate(message.id, draft, remove); setEditing(false); setDeleting(false); }
    catch (err) { setError(err.message || 'Could not update this message. Try again.'); }
    finally { setBusy(false); }
  }
  const own = String(message.senderUserId) === String(user.userId);
  const name = (own ? user.name : partner.name) || message.senderName || 'User';
  const photo = own ? profile.photo : partner.image;
  const date = new Date(message.createdAt);
  const previousDate = new Date(previousMessage?.createdAt);
  const elapsed = date - previousDate;
  const grouped = !message.replyToMessageId && previousMessage && String(previousMessage.senderUserId) === String(message.senderUserId)
    && elapsed >= 0 && elapsed < 5 * 60 * 1000 && date.toDateString() === previousDate.toDateString();
  const validDate = !Number.isNaN(date.getTime());
  const time = validDate ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  const fullTime = validDate ? date.toLocaleString('en-GB') : '';
  const startsDay = validDate && (!previousMessage || date.toDateString() !== previousDate.toDateString());
  const dayLabel = validDate ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('');

  return (
    <>
    {startsDay && <div className="chat-date-divider" role="separator" aria-label={dayLabel}><span>{dayLabel}</span></div>}
    <article id={`chat-message-${message.id}`} className={`chat-bubble chat-message-row${grouped ? ' grouped' : ''}${message.replyToMessageId ? ' is-reply' : ''}`} aria-label={`Message from ${name}`} onContextMenu={openMenu}>
      {message.replyToMessageId && <button className="chat-reply-reference" type="button" disabled={!repliedMessage} onClick={() => {
        const original = document.getElementById(`chat-message-${message.replyToMessageId}`);
        original?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }}>
        <Reply size={14} />
        {repliedMessage ? <><ImageWithFallback className="chat-reply-avatar" src={String(repliedMessage.senderUserId) === String(user.userId) ? profile.photo : partner.image} alt="" fallback={null} /><strong>{String(repliedMessage.senderUserId) === String(user.userId) ? user.name : partner.name}</strong><span>{repliedMessage.body || 'Image attachment'}</span></> : <span>Original message deleted</span>}
      </button>}
      <div className="chat-message-actions">
        {onReply && <button type="button" title="Reply" aria-label="Reply to message" onClick={() => onReply(message)}><Reply size={17} /></button>}
        {message.imageUrl && <button type="button" title={hidden ? 'Reveal image' : 'Hide image'} aria-label={hidden ? 'Reveal image' : 'Hide image'} onClick={() => setHidden(!hidden)}>{hidden ? <Eye size={17} /> : <EyeOff size={17} />}</button>}
        {own && <button type="button" title="Edit message" aria-label="Edit message" onClick={() => { setDraft(message.body || ''); setEditing(true); setDeleting(false); }}><Pencil size={17} /></button>}
        {own && <button type="button" title="Delete message" aria-label="Delete message" disabled={busy} onClick={requestDelete}><Trash2 size={17} /></button>}
        <button ref={actionsRef} type="button" aria-label="Message actions" aria-haspopup="menu" aria-expanded={Boolean(menu)} onClick={openMenu}><MoreHorizontal size={17} /></button>
      </div>
      {menu && createPortal(<div ref={menuRef} className="chat-context-menu" role="menu" aria-label="Message actions" style={menu}>
        {onReply && <button role="menuitem" onClick={() => { setMenu(null); onReply(message); }}><Reply size={16} />Reply</button>}
        {message.imageUrl && <button role="menuitem" onClick={() => { setHidden(!hidden); setMenu(null); }}>{hidden ? <Eye size={16} /> : <EyeOff size={16} />}{hidden ? 'Reveal image' : 'Hide image'}</button>}
        {own && <button role="menuitem" onClick={() => { setDraft(message.body || ''); setEditing(true); setDeleting(false); setMenu(null); }}><Pencil size={16} />Edit message</button>}
        {message.body && <button role="menuitem" onClick={async () => { setMenu(null); try { await navigator.clipboard.writeText(message.body); } catch { setError('Could not copy the message.'); } }}><Copy size={16} />Copy text</button>}
        {own && <button role="menuitem" className="chat-delete-action" disabled={busy} onClick={requestDelete}><Trash2 size={16} />Delete message</button>}
        <button role="menuitem" onClick={async () => { setMenu(null); try { await navigator.clipboard.writeText(String(message.id)); } catch { setError('Could not copy the message ID.'); } }}>Copy message ID</button>
      </div>, document.body)}
      <div className="chat-avatar-column">
        {grouped ? <time className="chat-continuation-time" title={fullTime}>{time}</time> : (
          <ImageWithFallback src={photo} className="chat-avatar" alt={`${name}'s profile picture`}
            fallback={<span className="chat-avatar chat-avatar-fallback" aria-label={`${name}'s profile picture`}>{initials}</span>} />
        )}
      </div>
      <div className="chat-message-content">
        {!grouped && (
          <div className="chat-message-meta">
            <strong>{name}</strong>
            <time dateTime={validDate ? date.toISOString() : undefined} title={fullTime}>{time}</time>
          </div>
        )}
        {editing ? <form className="chat-message-editor" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <textarea ref={editorRef} autoFocus aria-label="Edit message text" maxLength={1000} value={draft} disabled={busy} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Escape' && !busy) { event.preventDefault(); setDraft(message.body || ''); setEditing(false); }
            if (event.key === 'Enter' && !event.shiftKey && !busy) { event.preventDefault(); save(); }
          }} />
          <small className="chat-edit-hint">Enter to save · Esc to cancel</small>
        </form> : message.body && <p>{message.body}</p>}
        {deleting && createPortal(
          <dialog ref={deleteDialogRef} className="chat-delete-dialog" aria-labelledby={`delete-title-${message.id}`} aria-describedby={`delete-description-${message.id}`}
            onContextMenu={(event) => event.stopPropagation()}
            onCancel={(event) => { event.preventDefault(); if (!busy) setDeleting(false); }}>
            <button className="chat-delete-close" type="button" aria-label="Close delete confirmation" disabled={busy} onClick={() => setDeleting(false)}><X size={24} /></button>
            <h2 id={`delete-title-${message.id}`}>Delete message?</h2>
            <p className="chat-delete-description" id={`delete-description-${message.id}`}>Permanently delete this message for everyone?</p>
            <div className="chat-delete-preview">
              <ImageWithFallback src={photo} className="chat-avatar" alt={`${name}'s profile picture`} fallback={<span className="chat-avatar chat-avatar-fallback">{initials}</span>} />
              <div className="chat-delete-preview-content">
                <div className="chat-message-meta"><strong>{name}</strong><time>{fullTime}</time></div>
                {message.body && <p>{message.body}</p>}
                {message.imageUrl && (hidden ? <div className="chat-delete-hidden-image"><EyeOff size={20} />Hidden image</div> : <img className="chat-delete-preview-image" src={message.imageUrl} alt="Message attachment to delete" />)}
              </div>
            </div>
            {error && <p role="alert">{error}</p>}
            <div className="chat-delete-dialog-actions">
              <button data-cancel type="button" disabled={busy} onClick={() => setDeleting(false)}>Cancel</button>
              <button className="chat-delete-submit" type="button" disabled={busy} onClick={() => save(true)}>{busy ? 'Deleting...' : 'Delete'}</button>
            </div>
          </dialog>, document.body)}
        {error && !deleting && <p role="alert">{error}</p>}
        {message.imageUrl && (
          <button className={`chat-message-image-button${hidden ? ' is-hidden' : ''}`} type="button" onClick={() => hidden ? setHidden(false) : onExpandImage(message.imageUrl)} aria-label={hidden ? 'Reveal hidden image' : 'Expand message image'}>
            <img className="chat-message-image" src={message.imageUrl} alt={hidden ? "Hidden attachment" : "Message attachment"} />
            {hidden && <span className="chat-image-spoiler"><EyeOff size={24} /><strong>Hidden image</strong><span>Click to reveal</span></span>}
          </button>
        )}
        {showSentStatus && <div className={`chat-message-status${sentStatusLeaving ? ' leaving' : ''}`} role="status" aria-live="polite">Sent</div>}
      </div>
    </article>
    </>
  );
}
