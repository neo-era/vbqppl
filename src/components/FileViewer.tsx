import { useEffect, useState } from 'react';
import { X, Download, ExternalLink, Loader2, FileWarning } from 'lucide-react';
import { signedUrl } from '../lib/db';
import type { VanBan } from '../lib/types';

export default function FileViewer({ doc, onClose }: { doc: VanBan; onClose: () => void }) {
  const [url, setUrl] = useState<string>('');
  const [err, setErr] = useState('');
  useEffect(() => {
    let ok = true;
    if (doc.file_path) {
      signedUrl(doc.file_path, 3600).then((u) => { if (ok) setUrl(u); }).catch((e) => ok && setErr(String(e?.message || e)));
    }
    return () => { ok = false; };
  }, [doc.file_path]);

  const isPdf = (doc.file_type || '').toLowerCase() === 'pdf';

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()} style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="mhead">
          <h2 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name || 'Tệp đính kèm'}</h2>
          {url && <a className="btn ghost sm" href={url} target="_blank" rel="noreferrer"><ExternalLink className="i sm" />Mở tab mới</a>}
          {url && <a className="btn ghost sm" href={url} download={doc.file_name || true}><Download className="i sm" />Tải về</a>}
          <button className="btn icon ghost" onClick={onClose} aria-label="Đóng"><X className="i" /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, background: 'var(--bg)' }}>
          {err && <div className="empty"><FileWarning className="i" /><h3>Không mở được tệp</h3><p>{err}</p></div>}
          {!err && !url && <div className="loading"><Loader2 className="i" style={{ animation: 'sp .7s linear infinite' }} /> Đang tải tệp…</div>}
          {!err && url && isPdf && (
            <iframe title="PDF" src={url} style={{ width: '100%', height: '100%', border: 0 }} />
          )}
          {!err && url && !isPdf && (
            <div className="empty">
              <FileWarning className="i" />
              <h3>Xem trước không khả dụng cho {(doc.file_type || 'tệp').toUpperCase()}</h3>
              <p>Trình duyệt không hiển thị trực tiếp định dạng này. Nội dung toàn văn đã bóc hiển thị ở phần chi tiết; bấm “Tải về” để mở bằng Word.</p>
              <a className="btn pri" href={url} download={doc.file_name || true} style={{ marginTop: 12 }}><Download className="i sm" />Tải về</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
