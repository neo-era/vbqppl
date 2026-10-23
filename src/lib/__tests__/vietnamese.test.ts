import { describe, it, expect } from 'vitest';
import { removeDiacritics, normalizeForSearch } from '../vietnamese';

describe('removeDiacritics', () => {
  it('bỏ dấu các nguyên âm tiếng Việt', () => {
    expect(removeDiacritics('chiếu sáng công cộng')).toBe('chieu sang cong cong');
    expect(removeDiacritics('Nghị định')).toBe('Nghi dinh');
    expect(removeDiacritics('ĐƯỜNG ĐÔ THỊ')).toBe('DUONG DO THI');
  });
  it('xử lý đ/Đ', () => {
    expect(removeDiacritics('đèn đường')).toBe('den duong');
    expect(removeDiacritics('Đà Nẵng')).toBe('Da Nang');
  });
  it('giữ nguyên số, dấu gạch, chữ không dấu', () => {
    expect(removeDiacritics('16/2023/NĐ-CP')).toBe('16/2023/ND-CP');
    expect(removeDiacritics('QCVN 07-7:2016/BXD')).toBe('QCVN 07-7:2016/BXD');
  });
  it('chuỗi rỗng trả rỗng', () => {
    expect(removeDiacritics('')).toBe('');
  });
});

describe('normalizeForSearch', () => {
  it('bỏ dấu + lowercase + gọn khoảng trắng', () => {
    expect(normalizeForSearch('  Chiếu   SÁNG ')).toBe('chieu sang');
  });
});
