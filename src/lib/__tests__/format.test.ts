import { describe, it, expect } from 'vitest';
import { formatDate, statusLabel, isExpiringSoon } from '../format';

describe('formatDate', () => {
  it('ISO → dd/mm/yyyy', () => {
    expect(formatDate('2023-03-22')).toBe('22/03/2023');
  });
  it('null / rỗng / sai → chuỗi rỗng', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('không-phải-ngày')).toBe('');
  });
});

describe('statusLabel', () => {
  it('trả nhãn + class theo mã', () => {
    expect(statusLabel('con_hieu_luc').label).toBe('Còn hiệu lực');
    expect(statusLabel('het_hieu_luc').label).toBe('Hết hiệu lực');
    expect(statusLabel('sua_doi_bo_sung').label).toBe('Sửa đổi, bổ sung');
    expect(statusLabel('chua_hieu_luc').label).toBe('Chưa có hiệu lực');
  });
  it('mã lạ → chính nó', () => {
    expect(statusLabel('abc').label).toBe('abc');
  });
});

describe('isExpiringSoon', () => {
  it('ngày hết hiệu lực trong vòng 30 ngày tới → true', () => {
    const d = new Date(); d.setDate(d.getDate() + 10);
    expect(isExpiringSoon(d.toISOString().slice(0, 10))).toBe(true);
  });
  it('đã quá hạn hoặc còn xa → false', () => {
    expect(isExpiringSoon('2000-01-01')).toBe(false);
    const d = new Date(); d.setDate(d.getDate() + 200);
    expect(isExpiringSoon(d.toISOString().slice(0, 10))).toBe(false);
  });
  it('null → false', () => {
    expect(isExpiringSoon(null)).toBe(false);
  });
});
