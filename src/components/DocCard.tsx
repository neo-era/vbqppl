import { Star, Building2, CalendarDays, FileText, FileType2 } from 'lucide-react';
import type { DocRow } from '../lib/db';
import { formatDate, statusLabel } from '../lib/format';

export default function DocCard({ doc, onOpen, onToggleFav }: {
  doc: DocRow;
  onOpen: () => void;
  onToggleFav: (fav: boolean) => void;
}) {
  const note = doc.user_notes?.[0];
  const fav = !!note?.is_favorite;
  const st = statusLabel(String(doc.trang_thai));
  return (
    <div className="card" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}>
      <button className={`fav ${fav ? 'on' : ''}`} title={fav ? 'Bỏ đánh dấu' : 'Đánh dấu'}
        onClick={(e) => { e.stopPropagation(); onToggleFav(!fav); }}>
        <Star className="i" />
      </button>
      <div className="r1">
        <span className="so">{doc.so_hieu || '(chưa có số hiệu)'}</span>
        <span className={`tag st-${st.cls}`}>{st.label}</span>
        <span className="tag">{doc.loai_vb}</span>
      </div>
      <h3>{doc.trich_yeu || '(chưa có trích yếu)'}</h3>
      <div className="meta">
        {doc.co_quan && <span><Building2 className="i sm" />{doc.co_quan}</span>}
        {doc.ngay_ban_hanh && <span><CalendarDays className="i sm" />{formatDate(doc.ngay_ban_hanh)}</span>}
        {doc.file_name
          ? <span><FileText className="i sm" />{(doc.file_type || '').toUpperCase()}{doc.ocr_pending ? ' · chưa bóc chữ' : ''}</span>
          : <span style={{ color: 'var(--faint)' }}><FileType2 className="i sm" />Không có file</span>}
        {(doc.linh_vuc || []).slice(0, 2).map((lv) => <span key={lv} className="tag">{lv}</span>)}
      </div>
    </div>
  );
}
