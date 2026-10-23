import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, FileText, Star, Pencil, Trash2, Save, Link2, Plus, Search, Loader2,
} from 'lucide-react';
import type { DocRow, RelationRow } from '../lib/db';
import {
  getDocument, listRelations, addRelation, removeRelation, setNote,
  deleteDocument, searchDocuments,
} from '../lib/db';
import { formatDate, statusLabel } from '../lib/format';
import { removeDiacritics, normalizeForSearch } from '../lib/vietnamese';
import { RELATION_LABELS } from '../lib/constants';
import type { VanBan } from '../lib/types';
import { useToast } from '../ui';

function highlight(text: string, query: string): (string | JSX.Element)[] {
  if (!text) return [text];
  const nfc = text.normalize('NFC'); // đảm bảo precomposed ⇒ chỉ số khớp 1:1 khi bỏ dấu
  const capped = nfc.length > 60000 ? nfc.slice(0, 60000) + '\n…(đã rút gọn phần hiển thị)…' : nfc;
  const tokens = [...new Set(normalizeForSearch(query).split(/[^a-z0-9]+/).filter(Boolean))];
  if (!tokens.length) return [capped];
  const low = removeDiacritics(capped).toLowerCase();
  const ranges: [number, number][] = [];
  for (const tk of tokens) {
    let i = 0;
    while ((i = low.indexOf(tk, i)) !== -1) { ranges.push([i, i + tk.length]); i += tk.length; }
  }
  if (!ranges.length) return [capped];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  const out: (string | JSX.Element)[] = [];
  let pos = 0;
  merged.forEach(([s, e], idx) => {
    if (s > pos) out.push(capped.slice(pos, s));
    out.push(<mark key={idx}>{capped.slice(s, e)}</mark>);
    pos = e;
  });
  if (pos < capped.length) out.push(capped.slice(pos));
  return out;
}

export default function DocDetail({ docId, query, isEditor, onClose, onEdit, onOpenFile, onChanged, onOpenDoc }: {
  docId: string;
  query: string;
  isEditor: boolean;
  onClose: () => void;
  onEdit: (d: VanBan) => void;
  onOpenFile: (d: VanBan) => void;
  onChanged: () => void;
  onOpenDoc: (id: string) => void;
}) {
  const { push } = useToast();
  const [doc, setDoc] = useState<DocRow | null>(null);
  const [rels, setRels] = useState<RelationRow[]>([]);
  const [note, setNoteText] = useState('');
  const [fav, setFav] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const reqRef = useRef(0);

  async function reload() {
    const rid = ++reqRef.current;
    const d = await getDocument(docId);
    if (rid !== reqRef.current) return; // đã chuyển sang văn bản khác
    setShowContent(false);
    setDoc(d);
    if (d) {
      const n = d.user_notes?.[0];
      setNoteText(n?.note ?? '');
      setFav(!!n?.is_favorite);
      const r = await listRelations(docId);
      if (rid === reqRef.current) setRels(r);
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [docId]);

  const content = useMemo(() => (doc?.noi_dung ? highlight(doc.noi_dung, query) : []), [doc?.noi_dung, query]);

  if (!doc) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading"><Loader2 className="i" style={{ animation: 'sp .7s linear infinite' }} /> Đang tải…</div>
        </div>
      </div>
    );
  }
  const st = statusLabel(String(doc.trang_thai));

  async function toggleFav() {
    setFav((f) => !f);
    try { await setNote(doc!.id, { is_favorite: !fav }); onChanged(); }
    catch (e: any) { push('Lỗi: ' + (e?.message || e), 'err'); setFav((f) => !f); }
  }
  async function saveNote() {
    setSavingNote(true);
    try { await setNote(doc!.id, { note }); push('Đã lưu ghi chú.', 'ok'); }
    catch (e: any) { push('Lỗi: ' + (e?.message || e), 'err'); }
    finally { setSavingNote(false); }
  }
  async function del() {
    if (!confirm('Xoá văn bản này? Hành động không thể hoàn tác.')) return;
    try { await deleteDocument(doc!); push('Đã xoá.', 'ok'); onChanged(); onClose(); }
    catch (e: any) { push('Xoá thất bại: ' + (e?.message || e), 'err'); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="mhead">
          <h2 style={{ fontSize: 14 }}>Chi tiết văn bản</h2>
          <button className={`btn icon ghost`} onClick={toggleFav} title="Đánh dấu" style={{ color: fav ? 'var(--warn)' : undefined }}>
            <Star className="i" style={{ fill: fav ? 'var(--warn)' : 'none' }} />
          </button>
          {isEditor && <button className="btn ghost sm" onClick={() => onEdit(doc)}><Pencil className="i sm" />Sửa</button>}
          {isEditor && <button className="btn danger sm" onClick={del}><Trash2 className="i sm" />Xoá</button>}
          <button className="btn icon ghost" onClick={onClose} aria-label="Đóng"><X className="i" /></button>
        </div>
        <div className="mbody">
          <div className="dh">
            <div className="so">{doc.so_hieu || '(chưa có số hiệu)'} · {String(doc.loai_vb).toUpperCase()}</div>
            <h2>{doc.trich_yeu || '(chưa có trích yếu)'}</h2>
            <div className="kvgrid">
              <div className="kv"><div className="k">Cơ quan</div><div className="v">{doc.co_quan || '—'}</div></div>
              <div className="kv"><div className="k">Người ký</div><div className="v">{doc.nguoi_ky || '—'}</div></div>
              <div className="kv"><div className="k">Ngày ban hành</div><div className="v">{formatDate(doc.ngay_ban_hanh) || '—'}</div></div>
              <div className="kv"><div className="k">Ngày hiệu lực</div><div className="v">{formatDate(doc.ngay_hieu_luc) || '—'}</div></div>
              <div className="kv"><div className="k">Hết hiệu lực</div><div className="v">{formatDate(doc.ngay_het_hieu_luc) || '—'}</div></div>
              <div className="kv"><div className="k">Trạng thái</div><div className="v"><span className={`tag st-${st.cls}`}>{st.label}</span></div></div>
            </div>
            {(doc.linh_vuc || []).length > 0 && (
              <div className="chips" style={{ marginTop: 14 }}>
                {doc.linh_vuc!.map((lv) => <span key={lv} className="tag">{lv}</span>)}
              </div>
            )}
          </div>

          <div className="dact">
            {doc.file_name
              ? <button className="btn pri" onClick={() => onOpenFile(doc)}><FileText className="i sm" />Mở {(doc.file_type || '').toUpperCase()}</button>
              : <span className="badge st-chua">Không có tệp đính kèm</span>}
            {doc.ocr_pending && <span className="badge st-sua">Chưa bóc được toàn văn</span>}
          </div>

          {/* Toàn văn */}
          {doc.noi_dung && (
            <>
              <div className="section-t">Nội dung toàn văn</div>
              {showContent
                ? <div className="content-box">{content}</div>
                : <button className="btn ghost sm" onClick={() => setShowContent(true)}>Hiện toàn văn ({doc.noi_dung.length.toLocaleString('vi')} ký tự)</button>}
            </>
          )}

          {/* Liên kết hiệu lực */}
          <div className="section-t">Liên kết hiệu lực</div>
          {rels.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Chưa có liên kết.</div>}
          {rels.map((r) => (
            <div className="rel-item" key={r.id}>
              <Link2 className="i sm" style={{ color: 'var(--accent)' }} />
              <span className="rlabel">{RELATION_LABELS[r.relation] || r.relation}</span>
              <button className="btn" style={{ padding: 0, flex: 1, justifyContent: 'flex-start', color: 'var(--accent)', fontWeight: 600 }}
                onClick={() => r.other && onOpenDoc(r.other.id)}>
                {r.other ? `${r.other.so_hieu} — ${r.other.trich_yeu}` : '(văn bản đã xoá)'}
              </button>
              {isEditor && <button className="btn icon ghost" onClick={async () => { await removeRelation(r.id); setRels(await listRelations(docId)); }} aria-label="Xoá liên kết"><X className="i sm" /></button>}
            </div>
          ))}
          {isEditor && <RelationAdder docId={doc.id} onAdded={async () => setRels(await listRelations(docId))} />}

          {/* Ghi chú cá nhân */}
          <div className="section-t">Ghi chú của tôi (riêng tư)</div>
          <textarea value={note} onChange={(e) => setNoteText(e.target.value)} placeholder="Ghi chú cá nhân về văn bản này — chỉ mình bạn thấy." />
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <button className="btn subtle sm" onClick={saveNote} disabled={savingNote}>
              {savingNote ? <Loader2 className="i sm" style={{ animation: 'sp .7s linear infinite' }} /> : <Save className="i sm" />}Lưu ghi chú
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelationAdder({ docId, onAdded }: { docId: string; onAdded: () => void }) {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [rel, setRel] = useState('thay_the');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<VanBan[]>([]);
  const [busy, setBusy] = useState(false);

  async function doSearch() {
    setBusy(true);
    try {
      const { rows } = await searchDocuments({ q, pageSize: 6 });
      setResults(rows.filter((r) => r.id !== docId));
    } finally { setBusy(false); }
  }
  async function pick(id: string) {
    try { await addRelation(docId, id, rel); push('Đã thêm liên kết.', 'ok'); setOpen(false); setQ(''); setResults([]); onAdded(); }
    catch (e: any) { push('Lỗi: ' + (e?.message || e), 'err'); }
  }

  if (!open) return <button className="btn ghost sm" onClick={() => setOpen(true)} style={{ marginTop: 6 }}><Plus className="i sm" />Thêm liên kết</button>;
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 11, padding: 14, marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <select value={rel} onChange={(e) => setRel(e.target.value)} style={{ width: 'auto' }}>
          {Object.entries(RELATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }} placeholder="Tìm văn bản để liên kết" />
        <button className="btn ghost" onClick={doSearch} disabled={busy}>{busy ? <Loader2 className="i sm" style={{ animation: 'sp .7s linear infinite' }} /> : <Search className="i sm" />}</button>
      </div>
      {results.map((r) => (
        <div key={r.id} className="rel-item" style={{ cursor: 'pointer' }} onClick={() => pick(r.id)}>
          <Plus className="i sm" style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 13 }}><b>{r.so_hieu}</b> — {r.trich_yeu}</span>
        </div>
      ))}
    </div>
  );
}
