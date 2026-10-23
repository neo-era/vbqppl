import { supabase } from '../supabase';
import { STORAGE_BUCKET } from '../config';
import { buildTsQuery } from './search';
import type { VanBan } from './types';

export interface Profile { id: string; full_name: string; role: 'admin' | 'editor' | 'viewer'; }

export async function ensureProfile(): Promise<Profile> {
  const { data, error } = await supabase.rpc('ensure_profile');
  if (error) throw error;
  return data as Profile;
}

export interface SearchParams {
  q?: string;
  loai_vb?: string;
  trang_thai?: string;
  co_quan?: string;
  linh_vuc?: string;
  fromDate?: string;
  toDate?: string;
  favoritesOnly?: boolean;
  sort?: 'moi_nhat' | 'cu_nhat' | 'cap_nhat';
  page?: number;
  pageSize?: number;
}

export interface DocRow extends VanBan {
  user_notes?: { note: string | null; is_favorite: boolean }[] | null;
}

export async function searchDocuments(p: SearchParams): Promise<{ rows: DocRow[]; count: number }> {
  const pageSize = p.pageSize ?? 20;
  const page = p.page ?? 0;

  let favIds: string[] | null = null;
  if (p.favoritesOnly) {
    const { data } = await supabase.from('user_notes').select('doc_id').eq('is_favorite', true);
    favIds = (data ?? []).map((r: any) => r.doc_id);
    if (!favIds.length) return { rows: [], count: 0 };
  }

  let qy = supabase.from('documents').select('*, user_notes(note,is_favorite)', { count: 'exact' });

  const tsq = buildTsQuery(p.q ?? '');
  if (tsq) qy = qy.textSearch('fts_nodau', tsq, { config: 'simple' });
  if (p.loai_vb) qy = qy.eq('loai_vb', p.loai_vb);
  if (p.trang_thai) qy = qy.eq('trang_thai', p.trang_thai);
  if (p.co_quan) qy = qy.eq('co_quan', p.co_quan);
  if (p.linh_vuc) qy = qy.contains('linh_vuc', [p.linh_vuc]);
  if (p.fromDate) qy = qy.gte('ngay_ban_hanh', p.fromDate);
  if (p.toDate) qy = qy.lte('ngay_ban_hanh', p.toDate);
  if (favIds) qy = qy.in('id', favIds);

  if (p.sort === 'cu_nhat') qy = qy.order('ngay_ban_hanh', { ascending: true, nullsFirst: false });
  else if (p.sort === 'cap_nhat') qy = qy.order('updated_at', { ascending: false });
  else qy = qy.order('ngay_ban_hanh', { ascending: false, nullsFirst: false });

  qy = qy.range(page * pageSize, page * pageSize + pageSize - 1);

  const { data, error, count } = await qy;
  if (error) throw error;
  return { rows: (data ?? []) as DocRow[], count: count ?? 0 };
}

export async function getDocument(id: string): Promise<DocRow | null> {
  const { data, error } = await supabase
    .from('documents').select('*, user_notes(note,is_favorite)').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as DocRow) ?? null;
}

export async function upsertDocument(doc: Partial<VanBan>): Promise<VanBan> {
  const payload: any = { ...doc };
  if (!payload.id) {
    const { data: u } = await supabase.auth.getUser();
    payload.created_by = u.user?.id ?? null;
  }
  const { data, error } = await supabase.from('documents').upsert(payload).select().single();
  if (error) throw error;
  return data as VanBan;
}

export async function deleteDocument(doc: VanBan): Promise<void> {
  // Xoá dòng DB trước (doc_relations/user_notes tự CASCADE); file storage xoá sau.
  const { error } = await supabase.from('documents').delete().eq('id', doc.id);
  if (error) throw error;
  if (doc.file_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([doc.file_path]).catch(() => {});
  }
}

/** Xoá một file trong bucket (dùng khi đổi tệp — dọn file mồ côi). */
export async function removeStorageFile(path: string): Promise<void> {
  await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch(() => {});
}

// ---- Storage ----
export async function uploadFile(file: File): Promise<{ path: string; name: string; type: string; size: number }> {
  const raw = (file.name.includes('.') ? file.name.split('.').pop()! : '').toLowerCase();
  const ext = ['pdf', 'docx'].includes(raw) ? raw : 'bin';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || undefined,
  });
  if (error) throw error;
  return { path, name: file.name, type: ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : ext, size: file.size };
}

export async function signedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ---- Relations ----
export interface RelationRow {
  id: string; from_doc: string; to_doc: string; relation: string;
  other?: { id: string; so_hieu: string; trich_yeu: string } | null;
  direction: 'out' | 'in';
}

export async function listRelations(docId: string): Promise<RelationRow[]> {
  const [outRes, inRes] = await Promise.all([
    supabase.from('doc_relations').select('*, other:to_doc(id,so_hieu,trich_yeu)').eq('from_doc', docId),
    supabase.from('doc_relations').select('*, other:from_doc(id,so_hieu,trich_yeu)').eq('to_doc', docId),
  ]);
  const out = (outRes.data ?? []).map((r: any) => ({ ...r, direction: 'out' as const }));
  const inc = (inRes.data ?? []).map((r: any) => ({ ...r, direction: 'in' as const }));
  return [...out, ...inc];
}

export async function addRelation(from_doc: string, to_doc: string, relation: string): Promise<void> {
  const { error } = await supabase.from('doc_relations').insert({ from_doc, to_doc, relation });
  if (error) throw error;
}

export async function removeRelation(id: string): Promise<void> {
  const { error } = await supabase.from('doc_relations').delete().eq('id', id);
  if (error) throw error;
}

// ---- Notes / favorites ----
export async function setNote(docId: string, patch: { note?: string | null; is_favorite?: boolean }): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error('Chưa đăng nhập');
  const { error } = await supabase.from('user_notes').upsert(
    { doc_id: docId, user_id: uid, ...patch, updated_at: new Date().toISOString() },
    { onConflict: 'doc_id,user_id' },
  );
  if (error) throw error;
}

// ---- Facets ----
export async function distinctValues(column: 'co_quan' | 'loai_vb'): Promise<string[]> {
  const { data } = await supabase.from('documents').select(column).not(column, 'is', null);
  const set = new Set<string>();
  (data ?? []).forEach((r: any) => { if (r[column]) set.add(r[column]); });
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

export async function distinctLinhVuc(): Promise<string[]> {
  const { data } = await supabase.from('documents').select('linh_vuc');
  const set = new Set<string>();
  (data ?? []).forEach((r: any) => (r.linh_vuc ?? []).forEach((t: string) => set.add(t)));
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

// ---- Admin ----
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function setRole(id: string, role: Profile['role']): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}
