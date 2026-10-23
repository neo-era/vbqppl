import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, SlidersHorizontal, FileSpreadsheet, FileSearch, Loader2, Star } from 'lucide-react';
import DocCard from './DocCard';
import { searchDocuments, setNote, distinctValues, distinctLinhVuc, type DocRow, type SearchParams } from '../lib/db';
import { buildExcelBlob } from '../lib/excel';
import { DOC_TYPES } from '../lib/constants';
import { STATUS_OPTIONS } from '../lib/format';
import { useToast } from '../ui';

const PAGE = 20;

export default function SearchView({ reloadToken, onOpen, onQueryChange }: {
  reloadToken: number;
  onOpen: (id: string) => void;
  onQueryChange: (q: string) => void;
}) {
  const { push } = useToast();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Partial<SearchParams>>({ sort: 'moi_nhat' });
  const [showFilters, setShowFilters] = useState(false);
  const [rows, setRows] = useState<DocRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [coQuanList, setCoQuanList] = useState<string[]>([]);
  const [linhVucList, setLinhVucList] = useState<string[]>([]);
  const debRef = useRef<number | undefined>(undefined);
  const reqRef = useRef(0);

  useEffect(() => {
    distinctValues('co_quan').then(setCoQuanList).catch(() => {});
    distinctLinhVuc().then(setLinhVucList).catch(() => {});
  }, [reloadToken]);

  const load = useCallback(async (p: number, append: boolean) => {
    const rid = ++reqRef.current;
    setLoading(true);
    try {
      const { rows: r, count: c } = await searchDocuments({ ...filters, q, page: p, pageSize: PAGE });
      if (rid !== reqRef.current) return; // phản hồi cũ — bỏ qua (chống đua)
      setCount(c);
      setRows((prev) => append ? [...prev, ...r] : r);
    } catch (e: any) {
      if (rid === reqRef.current) push('Lỗi tải: ' + (e?.message || e), 'err');
    } finally {
      if (rid === reqRef.current) setLoading(false);
    }
  }, [filters, q, push]);

  // reload on query/filter/token change (debounced for q)
  useEffect(() => {
    window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(() => { setPage(0); load(0, false); }, 300);
    return () => window.clearTimeout(debRef.current);
    // eslint-disable-next-line
  }, [q, filters, reloadToken]);

  useEffect(() => { onQueryChange(q); }, [q, onQueryChange]);

  async function toggleFav(doc: DocRow, fav: boolean) {
    try {
      await setNote(doc.id, { is_favorite: fav });
      setRows((rs) => rs.map((r) => r.id === doc.id ? { ...r, user_notes: [{ note: r.user_notes?.[0]?.note ?? null, is_favorite: fav }] } : r));
    } catch (e: any) { push('Lỗi: ' + (e?.message || e), 'err'); }
  }

  async function exportExcel() {
    setExporting(true);
    try {
      const { rows: all } = await searchDocuments({ ...filters, q, page: 0, pageSize: 2000 });
      const blob = await buildExcelBlob(all);
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `danh-muc-vbqppl-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      push(`Đã xuất ${all.length} văn bản ra Excel.`, 'ok');
    } catch (e: any) {
      push('Xuất Excel lỗi: ' + (e?.message || e), 'err');
    } finally { setExporting(false); }
  }

  const setF = (k: keyof SearchParams, v: any) => setFilters((s) => ({ ...s, [k]: v || undefined }));
  const activeFilters = [filters.loai_vb, filters.trang_thai, filters.co_quan, filters.linh_vuc, filters.fromDate, filters.toDate, filters.favoritesOnly].filter(Boolean).length;

  return (
    <div className="container">
      <div className="hero">
        <h1>Tra cứu <em>văn bản quy phạm pháp luật</em></h1>
        <p>Gõ số hiệu, trích yếu hoặc nội dung — tìm được cả khi gõ không dấu.</p>
        <div className="bigsearch">
          <Search className="i" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ví dụ: chieu sang cong cong, 16/2023/NĐ-CP…" aria-label="Tra cứu toàn văn" autoFocus />
          {q && <button className="btn icon ghost clear" onClick={() => setQ('')} aria-label="Xoá"><X className="i sm" /></button>}
        </div>
        <div className="quick">
          {DOC_TYPES.slice(0, 6).map((t) => (
            <button key={t} className={`q ${filters.loai_vb === t ? 'on' : ''}`}
              onClick={() => setF('loai_vb', filters.loai_vb === t ? '' : t)}>{t}</button>
          ))}
          <button className={`q ${filters.favoritesOnly ? 'on' : ''}`} onClick={() => setF('favoritesOnly', !filters.favoritesOnly)}>
            <Star className="i sm" style={{ display: 'inline', verticalAlign: '-2px' }} /> Đã đánh dấu
          </button>
        </div>
      </div>

      <div className="filterbar">
        <button className="btn ghost sm" onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal className="i sm" />Bộ lọc{activeFilters ? ` (${activeFilters})` : ''}
        </button>
        {showFilters && (
          <>
            <select value={filters.loai_vb || ''} onChange={(e) => setF('loai_vb', e.target.value)}>
              <option value="">Mọi loại VB</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filters.trang_thai || ''} onChange={(e) => setF('trang_thai', e.target.value)}>
              <option value="">Mọi trạng thái</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filters.co_quan || ''} onChange={(e) => setF('co_quan', e.target.value)}>
              <option value="">Mọi cơ quan</option>
              {coQuanList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.linh_vuc || ''} onChange={(e) => setF('linh_vuc', e.target.value)}>
              <option value="">Mọi lĩnh vực</option>
              {linhVucList.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" style={{ width: 'auto' }} title="Từ ngày ban hành" value={filters.fromDate || ''} onChange={(e) => setF('fromDate', e.target.value)} />
            <input type="date" style={{ width: 'auto' }} title="Đến ngày ban hành" value={filters.toDate || ''} onChange={(e) => setF('toDate', e.target.value)} />
            {activeFilters > 0 && <button className="btn ghost sm" onClick={() => setFilters({ sort: filters.sort })}>Xoá lọc</button>}
          </>
        )}
      </div>

      <div className="resbar">
        <span className="count"><b>{count}</b> văn bản{q ? <> cho “{q}”</> : ''}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filters.sort} onChange={(e) => setF('sort', e.target.value)} style={{ width: 'auto' }}>
            <option value="moi_nhat">Mới ban hành nhất</option>
            <option value="cu_nhat">Cũ nhất</option>
            <option value="cap_nhat">Mới cập nhật</option>
          </select>
          <button className="btn ghost sm" onClick={exportExcel} disabled={exporting || count === 0}>
            {exporting ? <Loader2 className="i sm" style={{ animation: 'sp .7s linear infinite' }} /> : <FileSpreadsheet className="i sm" />}Excel
          </button>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="cards">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skel" />)}</div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <FileSearch className="i" />
          <h3>Không có văn bản phù hợp</h3>
          <p>{q || activeFilters ? 'Thử đổi từ khoá hoặc bỏ bớt bộ lọc.' : 'Kho đang trống — bấm “Thêm văn bản” để nạp văn bản đầu tiên.'}</p>
        </div>
      ) : (
        <>
          <div className="cards">
            {rows.map((d) => <DocCard key={d.id} doc={d} onOpen={() => onOpen(d.id)} onToggleFav={(f) => toggleFav(d, f)} />)}
          </div>
          {rows.length < count && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button className="btn ghost" disabled={loading} onClick={() => { const n = page + 1; setPage(n); load(n, true); }}>
                {loading ? <Loader2 className="i sm" style={{ animation: 'sp .7s linear infinite' }} /> : null}
                Tải thêm ({rows.length}/{count})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
