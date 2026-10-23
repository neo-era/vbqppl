import type { DocType } from './types';

export const DOC_TYPES: DocType[] = [
  'Luật', 'Nghị quyết', 'Pháp lệnh', 'Nghị định', 'Quyết định',
  'Thông tư', 'Thông tư liên tịch', 'Chỉ thị', 'Quy chuẩn', 'Tiêu chuẩn', 'Công văn', 'Khác',
];

export const RELATION_LABELS: Record<string, string> = {
  thay_the: 'Thay thế',
  bi_thay_the: 'Bị thay thế bởi',
  sua_doi: 'Sửa đổi',
  duoc_dan_chieu: 'Dẫn chiếu',
};

// Gợi ý lĩnh vực hay dùng (người dùng vẫn gõ thêm tự do)
export const LINH_VUC_GOI_Y = [
  'Chiếu sáng công cộng', 'Xây dựng', 'Giao thông', 'Đấu thầu',
  'Điện lực', 'Năng lượng', 'Đô thị', 'Môi trường', 'Tài chính',
];
