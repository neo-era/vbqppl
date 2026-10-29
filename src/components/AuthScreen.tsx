import { useState } from 'react';
import { supabase } from '../supabase';
import { Scale, Loader2 } from 'lucide-react';

export default function AuthScreen() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setOk(''); setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password: pw,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setOk('Đã tạo tài khoản. Nếu cần xác nhận email, vui lòng kiểm tra hộp thư rồi đăng nhập.');
          setMode('in');
        }
      }
    } catch (e: any) {
      setErr(viError(e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo"><Scale className="i lg" /></div>
        <h1>Kho Văn bản QPPL</h1>
        <p className="sub">Lưu trữ &amp; tra cứu văn bản quy phạm pháp luật</p>
        {err && <div className="alert err">{err}</div>}
        {ok && <div className="alert ok">{ok}</div>}
        <form onSubmit={submit}>
          {mode === 'up' && (
            <div className="field">
              <label>Họ và tên</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" autoComplete="name" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@cong-ty.vn" autoComplete="email" />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
          </div>
          <button className="btn pri" style={{ width: '100%' }} disabled={busy}>
            {busy && <Loader2 className="i spin" style={{ animation: 'sp .7s linear infinite' }} />}
            {mode === 'in' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
        <div className="auth-switch">
          {mode === 'in' ? (
            <>Chưa có tài khoản? <button onClick={() => { setMode('up'); setErr(''); setOk(''); }}>Đăng ký</button></>
          ) : (
            <>Đã có tài khoản? <button onClick={() => { setMode('in'); setErr(''); setOk(''); }}>Đăng nhập</button></>
          )}
        </div>
      </div>
    </div>
  );
}

function viError(m: string): string {
  const s = m.toLowerCase();
  if (s.includes('invalid login')) return 'Email hoặc mật khẩu không đúng.';
  if (s.includes('already registered') || s.includes('already been registered')) return 'Email này đã được đăng ký.';
  if (s.includes('password should be at least')) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (s.includes('email not confirmed')) return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.';
  if (s.includes('rate limit')) return 'Thao tác quá nhanh, vui lòng thử lại sau giây lát.';
  if (s.includes('failed to fetch') || s.includes('networkerror') || s.includes('load failed'))
    return 'Không kết nối được máy chủ. Kiểm tra mạng, hoặc máy chủ đang khởi động lại — thử lại sau 1–2 phút.';
  return m;
}
