import type { VanBan } from './types';
import { formatDate, statusLabel } from './format';

export const EXCEL_HEADER = [
  'STT', 'Số/ký hiệu', 'Loại VB', 'Trích yếu', 'Cơ quan',
  'Ngày ban hành', 'Ngày hiệu lực', 'Trạng thái', 'Lĩnh vực',
];

/** Ma trận dữ liệu thuần (hàng đầu là header) — dễ test, dùng để đổ vào ExcelJS. */
export function buildExcelMatrix(docs: VanBan[]): (string | number)[][] {
  const rows: (string | number)[][] = [EXCEL_HEADER.slice()];
  docs.forEach((d, i) => {
    rows.push([
      i + 1,
      d.so_hieu || '',
      String(d.loai_vb || ''),
      d.trich_yeu || '',
      d.co_quan || '',
      formatDate(d.ngay_ban_hanh),
      formatDate(d.ngay_hieu_luc),
      statusLabel(String(d.trang_thai)).label,
      (d.linh_vuc || []).join(', '),
    ]);
  });
  return rows;
}

/** Sinh file Excel có định dạng (header navy) — trả Blob để tải về. */
export async function buildExcelBlob(docs: VanBan[]): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const NAVY = 'FF1F4E79', BLUE = 'FF2E5496', GREY = 'FFF2F2F2';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'VBQPPL';
  wb.created = new Date();
  const ws = wb.addWorksheet('Danh mục văn bản', {
    properties: { tabColor: { argb: NAVY } },
    views: [{ state: 'frozen', ySplit: 2 }],
  });
  ws.columns = [
    { width: 6 }, { width: 20 }, { width: 16 }, { width: 50 }, { width: 20 },
    { width: 14 }, { width: 14 }, { width: 16 }, { width: 24 },
  ];
  ws.mergeCells('A1:I1');
  const title = ws.getCell('A1');
  title.value = 'DANH MỤC VĂN BẢN QUY PHẠM PHÁP LUẬT';
  title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  const matrix = buildExcelMatrix(docs);
  const header = ws.getRow(2);
  matrix[0].forEach((h, i) => {
    const c = header.getCell(i + 1);
    c.value = h as string;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  header.height = 26;
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: matrix[0].length } };

  for (let r = 1; r < matrix.length; r++) {
    const row = ws.addRow(matrix[r]);
    row.eachCell({ includeEmpty: true }, (c, col) => {
      c.alignment = {
        vertical: 'middle', wrapText: true,
        horizontal: (col === 1 || col === 6 || col === 7) ? 'center' : 'left',
      };
      c.border = { bottom: { style: 'hair', color: { argb: 'FFD9D9D9' } } };
      if (r % 2 === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
    });
  }
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
