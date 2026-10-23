import { normalizeForSearch } from './vietnamese';

/**
 * Dựng chuỗi to_tsquery('simple', ...) từ từ khoá người dùng.
 * - Bỏ dấu → khớp cột fts_nodau (gõ không dấu vẫn ra).
 * - Mỗi từ thêm hậu tố ':*' để khớp tiền tố (đang gõ cũng ra).
 * - Loại ký tự phá cú pháp tsquery (chỉ giữ a-z0-9).
 */
export function buildTsQuery(input: string): string {
  const norm = normalizeForSearch(input);
  const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
  if (!tokens.length) return '';
  return tokens.map((t) => `${t}:*`).join(' & ');
}
