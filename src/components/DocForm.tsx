import { useEffect, useRef, useState } from 'react';
import { X, UploadCloud, FileText, Loader2, Wand2, Plus, AlertTriangle } from 'lucide-react';
import type { VanBan } from '../lib/types';
import { DOC_TYPES, LINH_VUC_GOI_Y } from '../lib/constants';
import { STATUS_OPTIONS } from '../lib/format';
import { guessDocType } from '../lib/docmeta';
import { upsertDocument, uploadFile, removeStorageFile } from '../lib/db';
import { extractText } from '../lib/extract';
import { MAX_FILE_MB } from '../config';
import { useToast } from '../ui';

type Draft = Partial<VanBan> & { linh_vuc: string[] };

export default function DocForm({ doc, onClose, onSaved }: {
  doc?: VanBan | null;
  onClose: () => void;
  onSaved: (d: VanBan) => void;
}) {
  const { push } = useToast();
  const [d, setD] = useState<Draft>({
    id: doc?.id,
    so_hieu: doc?.so_hieu ?? '',
    loai_vb: doc?.loai_vb ?? 'Khác',
    co_quan: doc?.co_quan ?? '',
    nguoi_ky: doc?.nguoi_ky ?? '',
    ngay_ban_hanh: doc?.ngay_ban_hanh ?? '',
    ngay_hieu_luc: doc?.ngay_hieu_luc ?? '',
    ngay_het_hieu_luc: doc?.ngay_het_hieu_luc ?? '',
    trich_yeu: doc?.trich_yeu ?? '',
    linh_vuc: doc?.linh_vuc ?? [],
    trang_thai: doc?.trang_thai ?? 'con_hieu_luc',
    noi_dung: doc?.noi_dung ?? '',
    file_path: doc?.file_path ?? null,
    file_name: doc?.file_name ?? null,
    file_type: doc?.file_type ?? null,
    file_size: doc?.file_size ?? null,
    ocr_pending: doc?.ocr_pending ?? false,
  });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);
  const [lvInput, setLvInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);

  const set = (k: keyof Draft, v: any) => setD((s) => ({ ...s, [k]: v }));

  async function onPickFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      push(`Tệp vượt quá ${MAX_FILE_MB}MB.`, 'err'); return;
    }
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      push('Chỉ hỗ trợ PDF hoặc DOCX.', 'err'); return;
    }
    setNewFile(f);
    setExtracting(true);
    try {
      const res = await extractText(f);
      if (!aliveRef.current) return;
      setD((s) => ({
        ...s,
        noi_dung: res.text || s.noi_dung,
        ocr_pending: res.ocrPending,
        file_name: f.name,
        file_type: res.type,
        file_size: f.size,
      }));
      if (res.ocrPending) push('Tệp không có lớp chữ (có thể là bản scan) — vẫn lưu, tra cứu theo thông tin nhập tay.', 'info');
      else push(`Đã bóc ${res.text.length.toLocaleString('vi')} ký tự toàn văn.`, 'ok');
    } catch (e: any) {
      if (aliveRef.current) push('Không bóc được chữ: ' + (e?.message || e), 'err');
    } finally {
      if (aliveRef.current) setExtracting(false);
    }
  }

  function addLinhVuc(v: string) {
    const t = v.trim();
    if (!t) return;
    if (!d.linh_vuc.includes(t)) set('linh_vuc', [...d.linh_vuc, t]);
    setLvInput('');
  }

  async function save() {
    if (!d.so_hieu?.trim() && !d.trich_yeu?.trim()) {
      push('Cần ít nhất Số hiệu hoặc Trích yếu.', 'err'); return;
    }
    setSaving(true);
    try {
      let filePatch: Partial<VanBan> = {};
      const oldPath = doc?.file_path || null;
      if (newFile) {
        const up = await uploadFile(newFile);
        filePatch = { file_path: up.path, file_name: up.name, file_type: up.type, file_size: up.size };
      }
      const payload: Partial<VanBan> = {
        id: d.id,
        so_hieu: d.so_hieu?.trim() || '',
        loai_vb: d.loai_vb || 'Khác',
        co_quan: d.co_quan?.trim() || '',
        nguoi_ky: d.nguoi_ky?.trim() || null,
        ngay_ban_hanh: d.ngay_ban_hanh || null,
        ngay_hieu_luc: d.ngay_hieu_luc || null,
        ngay_het_hieu_luc: d.ngay_het_hieu_luc || null,
        trich_yeu: d.trich_yeu?.trim() || '',
        linh_vuc: d.linh_vuc,
        trang_thai: d.trang_thai,
        noi_dung: d.noi_dung || null,
        ocr_pending: !!d.ocr_pending,
        ...filePatch,
      };
      const saved = await upsertDocument(payload);
      // Đổi tệp thành công → dọn file cũ (tránh rác trong Storage)
      if (newFile && oldPath && oldPath !== saved.file_path) {
        await removeStorageFile(oldPath);
      }
      push(d.id ? 'Đã cập nhật văn bản.' : 'Đã thêm văn bản.', 'ok');
      onSaved(saved);
    } catch (e: any) {
      push('Lưu thất bại: ' + (e?.message || e), 'err');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="mhead">
          <h2>{d.id ? 'Sửa văn bản' : 'Thêm văn bản'}</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Đóng"><X className="i" /></button>
        </div>
        <div className="mbody">
          {/* File */}
          {(newFile || d.file_name) ? (
            <div className="filechip" style={{ marginBottom: 16 }}>
              {extracting ? <Loader2 className="i" style={{ animation: 'sp .7s linear infinite' }} /> : <FileText className="i" />}
              <span className="grow">{d.file_name}{d.file_size ? ` · ${(d.file_size / 1048576).toFixed(1)} MB` : ''}</span>
              <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>Đổi tệp</button>
            </div>
          ) : (
            <div className={`dropzone ${drag ? 'drag' : ''}`} style={{ marginBottom: 16 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); onPickFile(e.dataTransfer.files?.[0] ?? null); }}>
              <UploadCloud className="i" />
              <div><b>Kéo-thả hoặc chọn tệp</b> (PDF / DOCX, ≤ {MAX_FILE_MB}MB)</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Hệ thống sẽ tự bóc toàn văn để tra cứu.</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
          {d.ocr_pending && (
            <div className="alert info" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertTriangle className="i sm" /> Tệp chưa bóc được toàn văn (có thể là bản scan). Vẫn lưu được, tra cứu theo thông tin nhập tay.
            </div>
          )}

          <div className="form-grid">
            <div>
              <label>Số / ký hiệu</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={d.so_hieu ?? ''} onChange={(e) => set('so_hieu', e.target.value)} placeholder="16/2023/NĐ-CP" />
                <button className="btn ghost" title="Tự đoán loại văn bản từ số hiệu"
                  onClick={() => { const t = guessDocType(d.so_hieu || ''); set('loai_vb', t); push(`Đoán loại: ${t}`, 'info'); }}>
                  <Wand2 className="i sm" />
                </button>
              </div>
            </div>
            <div>
              <label>Loại văn bản</label>
              <select value={d.loai_vb} onChange={(e) => set('loai_vb', e.target.value)}>
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="full">
              <label>Trích yếu</label>
              <textarea value={d.trich_yeu ?? ''} onChange={(e) => set('trich_yeu', e.target.value)} placeholder="Tiêu đề / nội dung tóm tắt của văn bản" style={{ minHeight: 64 }} />
            </div>
            <div>
              <label>Cơ quan ban hành</label>
              <input value={d.co_quan ?? ''} onChange={(e) => set('co_quan', e.target.value)} placeholder="Chính phủ / Bộ Xây dựng / UBND TP.HCM" />
            </div>
            <div>
              <label>Người ký</label>
              <input value={d.nguoi_ky ?? ''} onChange={(e) => set('nguoi_ky', e.target.value)} />
            </div>
            <div>
              <label>Ngày ban hành</label>
              <input type="date" value={d.ngay_ban_hanh ?? ''} onChange={(e) => set('ngay_ban_hanh', e.target.value)} />
            </div>
            <div>
              <label>Trạng thái hiệu lực</label>
              <select value={d.trang_thai} onChange={(e) => set('trang_thai', e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label>Ngày hiệu lực</label>
              <input type="date" value={d.ngay_hieu_luc ?? ''} onChange={(e) => set('ngay_hieu_luc', e.target.value)} />
            </div>
            <div>
              <label>Ngày hết hiệu lực</label>
              <input type="date" value={d.ngay_het_hieu_luc ?? ''} onChange={(e) => set('ngay_het_hieu_luc', e.target.value)} />
            </div>
            <div className="full">
              <label>Lĩnh vực (thẻ)</label>
              <div className="chips" style={{ marginBottom: 8 }}>
                {d.linh_vuc.map((lv) => (
                  <span key={lv} className="x">{lv}
                    <button onClick={() => set('linh_vuc', d.linh_vuc.filter((x) => x !== lv))} aria-label="Xoá"><X className="i sm" /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input list="lv-goiy" value={lvInput} onChange={(e) => setLvInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLinhVuc(lvInput); } }}
                  placeholder="Nhập lĩnh vực rồi Enter" />
                <button className="btn ghost" onClick={() => addLinhVuc(lvInput)}><Plus className="i sm" /></button>
                <datalist id="lv-goiy">{LINH_VUC_GOI_Y.map((x) => <option key={x} value={x} />)}</datalist>
              </div>
            </div>
            <div className="full">
              <label>Nội dung toàn văn {d.noi_dung ? `(${d.noi_dung.length.toLocaleString('vi')} ký tự)` : ''}</label>
              <textarea value={d.noi_dung ?? ''} onChange={(e) => set('noi_dung', e.target.value)} placeholder="Nội dung dùng để tra cứu toàn văn — tự điền khi nạp file, có thể sửa." style={{ minHeight: 140 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn ghost" onClick={onClose} disabled={saving}>Huỷ</button>
            <button className="btn pri" onClick={save} disabled={saving || extracting}>
              {saving && <Loader2 className="i sm" style={{ animation: 'sp .7s linear infinite' }} />}
              {d.id ? 'Lưu thay đổi' : 'Thêm văn bản'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
