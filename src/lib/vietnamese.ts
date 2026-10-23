// Chuẩn hoá tiếng Việt: bỏ dấu để tìm kiếm có/không dấu.

export function removeDiacritics(s: string): string {
  if (!s) return '';
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu kết hợp (sắc/huyền/hỏi/ngã/nặng, mũ, móc…)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalizeForSearch(s: string): string {
  return removeDiacritics(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
