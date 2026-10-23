import { useEffect, useState } from 'react';
import { X, Loader2, ShieldCheck } from 'lucide-react';
import { listProfiles, setRole, type Profile } from '../lib/db';
import { useToast } from '../ui';
import { useAuth } from '../auth';

const ROLE_LABEL: Record<Profile['role'], string> = { admin: 'Quản trị', editor: 'Biên tập', viewer: 'Xem' };

export default function AdminUsers({ onClose }: { onClose: () => void }) {
  const { push } = useToast();
  const { profile } = useAuth();
  const [list, setList] = useState<Profile[] | null>(null);

  useEffect(() => { listProfiles().then(setList).catch((e) => push('Lỗi tải danh sách: ' + e.message, 'err')); /* eslint-disable-next-line */ }, []);

  async function change(id: string, role: Profile['role']) {
    try { await setRole(id, role); setList((l) => l!.map((p) => p.id === id ? { ...p, role } : p)); push('Đã cập nhật quyền.', 'ok'); }
    catch (e: any) { push('Lỗi: ' + (e?.message || e), 'err'); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="mhead">
          <ShieldCheck className="i" style={{ color: 'var(--accent)' }} />
          <h2>Người dùng &amp; phân quyền</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Đóng"><X className="i" /></button>
        </div>
        <div className="mbody">
          <div className="alert info" style={{ marginBottom: 14 }}>
            <b>Quản trị</b>: toàn quyền. <b>Biên tập</b>: thêm/sửa/xoá văn bản. <b>Xem</b>: tra cứu + ghi chú riêng.
          </div>
          {!list && <div className="loading"><Loader2 className="i" style={{ animation: 'sp .7s linear infinite' }} /> Đang tải…</div>}
          {list?.map((p) => (
            <div key={p.id} className="rel-item" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.full_name}{p.id === profile?.id ? ' (bạn)' : ''}
              </span>
              <select value={p.role} disabled={p.id === profile?.id} onChange={(e) => change(p.id, e.target.value as Profile['role'])} style={{ width: 'auto' }}>
                {(['admin', 'editor', 'viewer'] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
          ))}
          {list && list.length === 1 && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10 }}>Chỉ có mình bạn. Khi có người đăng ký, họ sẽ xuất hiện ở đây để bạn cấp quyền.</p>}
        </div>
      </div>
    </div>
  );
}
