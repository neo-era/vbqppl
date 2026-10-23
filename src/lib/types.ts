// Kiểu dữ liệu dùng chung cho app VBQPPL

export type DocStatus =
  | 'con_hieu_luc'
  | 'het_hieu_luc'
  | 'chua_hieu_luc'
  | 'sua_doi_bo_sung';

export type DocType =
  | 'Luật'
  | 'Nghị quyết'
  | 'Pháp lệnh'
  | 'Nghị định'
  | 'Quyết định'
  | 'Thông tư'
  | 'Thông tư liên tịch'
  | 'Chỉ thị'
  | 'Quy chuẩn'
  | 'Tiêu chuẩn'
  | 'Công văn'
  | 'Khác';

export interface VanBan {
  id: string;
  so_hieu: string;
  loai_vb: DocType | string;
  co_quan: string;
  nguoi_ky?: string | null;
  ngay_ban_hanh?: string | null;   // ISO yyyy-mm-dd
  ngay_hieu_luc?: string | null;
  ngay_het_hieu_luc?: string | null;
  trich_yeu: string;
  linh_vuc?: string[] | null;
  trang_thai: DocStatus | string;
  noi_dung?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: 'pdf' | 'docx' | string | null;
  file_size?: number | null;
  ocr_pending?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SoHieuParts {
  so: string;        // số thứ tự, vd "16"
  nam: string;       // năm, vd "2023"
  ky_hieu: string;   // ký hiệu loại/cơ quan, vd "NĐ-CP"
}
