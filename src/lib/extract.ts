// Bóc toàn văn từ file khi nạp. PDF dùng pdf.js (lớp text), .docx dùng mammoth.
// PDF scan ảnh (không có lớp text) → trả ocrPending=true, vẫn lưu file.
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface ExtractResult {
  text: string;
  type: 'pdf' | 'docx' | 'other';
  ocrPending: boolean;
  pages?: number;
}

export async function extractText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdf(file);
  }
  if (name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer });
    const text = (res.value || '').trim();
    return { text, type: 'docx', ocrPending: text.length < 10 };
  }
  return { text: '', type: 'other', ocrPending: true };
}

async function extractPdf(file: File): Promise<ExtractResult> {
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  try {
    let out = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      out += tc.items.map((it: any) => ('str' in it ? it.str : '')).join(' ') + '\n';
      page.cleanup();
    }
    const text = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    // Ít hơn ~20 ký tự cho toàn tài liệu ⇒ coi như PDF scan, cần OCR sau.
    return { text, type: 'pdf', ocrPending: text.length < 20, pages: doc.numPages };
  } finally {
    await doc.destroy().catch(() => {});
  }
}
