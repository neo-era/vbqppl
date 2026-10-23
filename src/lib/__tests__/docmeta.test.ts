import { describe, it, expect } from 'vitest';
import { parseSoHieu, guessDocType } from '../docmeta';

describe('parseSoHieu', () => {
  it('tách số / năm / ký hiệu dạng chuẩn', () => {
    expect(parseSoHieu('16/2023/NĐ-CP')).toEqual({ so: '16', nam: '2023', ky_hieu: 'NĐ-CP' });
    expect(parseSoHieu('10/2023/TT-BXD')).toEqual({ so: '10', nam: '2023', ky_hieu: 'TT-BXD' });
  });
  it('dạng không đủ 3 phần (chuẩn x/y/z) thì giữ nguyên ở "so"', () => {
    const r = parseSoHieu('QCVN 07-7:2016/BXD');
    expect(r).toEqual({ so: 'QCVN 07-7:2016/BXD', nam: '', ky_hieu: '' });
  });
  it('rỗng trả về rỗng', () => {
    expect(parseSoHieu('')).toEqual({ so: '', nam: '', ky_hieu: '' });
  });
});

describe('guessDocType', () => {
  it('đoán loại theo ký hiệu', () => {
    expect(guessDocType('16/2023/NĐ-CP')).toBe('Nghị định');
    expect(guessDocType('10/2023/TT-BXD')).toBe('Thông tư');
    expect(guessDocType('79/2009/QĐ-UBND')).toBe('Quyết định');
    expect(guessDocType('05/2021/NQ-HĐND')).toBe('Nghị quyết');
    expect(guessDocType('16/2016/CT-TTg')).toBe('Chỉ thị');
    expect(guessDocType('50/2014/QH13')).toBe('Luật');
  });
  it('đoán quy chuẩn / tiêu chuẩn', () => {
    expect(guessDocType('QCVN 07-7:2016/BXD')).toBe('Quy chuẩn');
    expect(guessDocType('TCVN 7722-2:2013')).toBe('Tiêu chuẩn');
  });
  it('không nhận ra → Khác', () => {
    expect(guessDocType('abc xyz')).toBe('Khác');
    expect(guessDocType('')).toBe('Khác');
  });
});
