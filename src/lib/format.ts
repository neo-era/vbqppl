// Định dạng hiển thị: ngày, trạng thái hiệu lực.

export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export interface StatusInfo { label: string; cls: string; }

const STATUS: Record<string, StatusInfo> = {
  con_hieu_luc: { label: 'Còn hiệu lực', cls: 'con' },
  het_hieu_luc: { label: 'Hết hiệu lực', cls: 'het' },
  chua_hieu_luc: { label: 'Chưa có hiệu lực', cls: 'chua' },
  sua_doi_bo_sung: { label: 'Sửa đổi, bổ sung', cls: 'sua' },
};

export function statusLabel(code: string): StatusInfo {
  return STATUS[code] || { label: code, cls: 'khac' };
}

export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, v]) => ({ value, label: v.label }));

/** true nếu ngày hết hiệu lực nằm trong khoảng [hôm nay, hôm nay + days]. */
export function isExpiringSoon(iso?: string | null, days = 30): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  return d >= now && d <= limit;
}
