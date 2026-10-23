import { describe, it, expect } from 'vitest';
import { buildExcelMatrix } from '../excel';
import type { VanBan } from '../types';

const docs: VanBan[] = [
  {
    id: '1', so_hieu: '16/2023/NĐ-CP', loai_vb: 'Nghị định', co_quan: 'Chính phủ',
    ngay_ban_hanh: '2023-03-22', ngay_hieu_luc: '2023-05-15', trich_yeu: 'Quản lý chiếu sáng đô thị',
    linh_vuc: ['Chiếu sáng'], trang_thai: 'con_hieu_luc',
  },
  {
    id: '2', so_hieu: '79/2009/QĐ-UBND', loai_vb: 'Quyết định', co_quan: 'UBND TP.HCM',
    ngay_ban_hanh: '2009-11-10', trich_yeu: 'Quản lý hệ thống CSCC', trang_thai: 'het_hieu_luc',
  },
];

describe('buildExcelMatrix', () => {
  it('hàng đầu là tiêu đề cột', () => {
    const m = buildExcelMatrix(docs);
    expect(m[0]).toEqual(['STT', 'Số/ký hiệu', 'Loại VB', 'Trích yếu', 'Cơ quan', 'Ngày ban hành', 'Ngày hiệu lực', 'Trạng thái', 'Lĩnh vực']);
  });
  it('mỗi văn bản một hàng, STT tăng dần, ngày định dạng dd/mm/yyyy, trạng thái thành nhãn', () => {
    const m = buildExcelMatrix(docs);
    expect(m.length).toBe(3); // 1 header + 2 dòng
    expect(m[1][0]).toBe(1);
    expect(m[1][1]).toBe('16/2023/NĐ-CP');
    expect(m[1][5]).toBe('22/03/2023');
    expect(m[1][7]).toBe('Còn hiệu lực');
    expect(m[1][8]).toBe('Chiếu sáng');
    expect(m[2][0]).toBe(2);
    expect(m[2][6]).toBe(''); // thiếu ngày hiệu lực
  });
  it('danh sách rỗng → chỉ có header', () => {
    expect(buildExcelMatrix([]).length).toBe(1);
  });
});
