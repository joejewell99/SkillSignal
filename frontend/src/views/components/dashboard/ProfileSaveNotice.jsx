import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ProfileSaveNotice({ savedAt }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, [savedAt]);
  return visible ? <div className="profile-save-notice" role="status"><CheckCircle2 size={18} aria-hidden="true" />Changes saved</div> : null;
}
