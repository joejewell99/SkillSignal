import React, { useLayoutEffect, useRef } from 'react';

export default function ChatReplyInput({ value, onChange, onPasteImage, placeholder, disabled }) {
  const inputRef = useRef(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    const maxHeight = Math.floor(window.innerHeight * 0.45);
    input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handlePaste(event) {
    const imageFile = Array.from(event.clipboardData?.items ?? [])
      .find((item) => item.kind === 'file' && item.type.startsWith('image/'))
      ?.getAsFile();
    if (imageFile) {
      event.preventDefault();
      onPasteImage?.(imageFile);
    }
  }

  return (
    <textarea
      ref={inputRef}
      className="chat-reply-input"
      rows={1}
      maxLength={1000}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      aria-label="Message"
    />
  );
}
