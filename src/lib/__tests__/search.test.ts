import { describe, it, expect } from 'vitest';
import { buildTsQuery } from '../search';

describe('buildTsQuery', () => {
  it('tách từ, bỏ dấu, thêm prefix :* và nối bằng &', () => {
    expect(buildTsQuery('chiếu sáng')).toBe('chieu:* & sang:*');
  });
  it('gõ không dấu vẫn ra cùng truy vấn', () => {
    expect(buildTsQuery('chieu sang')).toBe('chieu:* & sang:*');
  });
  it('gọn nhiều khoảng trắng và dấu câu', () => {
    expect(buildTsQuery('  công   cộng!! ')).toBe('cong:* & cong:*');
  });
  it('giữ số và chữ, loại ký tự phá cú pháp tsquery', () => {
    expect(buildTsQuery("16/2023 NĐ-CP")).toBe('16:* & 2023:* & nd:* & cp:*');
  });
  it('chuỗi rỗng / chỉ ký tự đặc biệt → rỗng', () => {
    expect(buildTsQuery('')).toBe('');
    expect(buildTsQuery('  &|!()  ')).toBe('');
  });
});
