import type { DocType, SoHieuParts } from './types';

/** Tách số hiệu dạng "16/2023/NĐ-CP" thành {so, nam, ky_hieu}. */
export function parseSoHieu(soHieu: string): SoHieuParts {
  const s = (soHieu || '').trim();
  if (!s) return { so: '', nam: '', ky_hieu: '' };
  const parts = s.split('/');
  if (parts.length >= 3) {
    return {
      so: parts[0].trim(),
      nam: parts[1].trim(),
      ky_hieu: parts.slice(2).join('/').trim(),
    };
  }
  return { so: s, nam: '', ky_hieu: '' };
}

/** Đoán loại văn bản từ số hiệu/ký hiệu. Dùng để điền sẵn khi nạp file. */
export function guessDocType(soHieu: string): DocType {
  const s = (soHieu || '').toUpperCase();
  if (!s.trim()) return 'Khác';
  if (/QCVN/.test(s)) return 'Quy chuẩn';
  if (/TCVN/.test(s)) return 'Tiêu chuẩn';
  if (/NĐ-CP|ND-CP/.test(s)) return 'Nghị định';
  if (/TTLT/.test(s)) return 'Thông tư liên tịch';
  if (/TT-/.test(s)) return 'Thông tư';
  if (/QĐ-|QD-/.test(s)) return 'Quyết định';
  if (/NQ-/.test(s)) return 'Nghị quyết';
  if (/PL-/.test(s)) return 'Pháp lệnh';
  if (/CT-/.test(s)) return 'Chỉ thị';
  if (/CV-/.test(s)) return 'Công văn';
  if (/\/QH\d*/.test(s)) return 'Luật';
  return 'Khác';
}
