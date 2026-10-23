import { useEffect, useState } from 'react';
import { Scale, Plus, Sun, Moon, Loader2, Download, Share, LogOut, Users, X } from 'lucide-react';
import { AuthProvider, useAuth } from './auth';
import { ToastProvider } from './ui';
import AuthScreen from './components/AuthScreen';
import SearchView from './components/SearchView';
import DocDetail from './components/DocDetail';
import DocForm from './components/DocForm';
import FileViewer from './components/FileViewer';
import AdminUsers from './components/AdminUsers';
import { applyTheme, getInitialTheme, type Theme } from './theme';
import type { VanBan } from './lib/types';

function Shell() {
  const { session, profile, loading, isEditor, isAdmin, signOut } = useAuth();
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [token, setToken] = useState(0);
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; doc: VanBan | null }>({ open: false, doc: null });
  const [fileDoc, setFileDoc] = useState<VanBan | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [menu, setMenu] = useState(false);
  const [installEvt, setInstallEvt] = useState<any>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  function toggleTheme() { const t: Theme = theme === 'dark' ? 'light' : 'dark'; setTheme(t); applyTheme(t); }
  const bump = () => setToken((x) => x + 1);

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

  if (loading) return <div className="auth-wrap"><Loader2 className="i lg" style={{ animation: 'sp .7s linear infinite', color: 'var(--accent)' }} /></div>;
  if (!session) return <AuthScreen />;

  const initials = (profile?.full_name || 'U').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand" onClick={() => { setDetailId(null); bump(); }}>
          <div className="logo"><Scale className="i" /></div>
          <b className="full">Kho Văn bản QPPL</b>
        </div>
        <div className="spacer" />
        <div className="top-actions">
          {isEditor && (
            <button className="btn pri sm" onClick={() => setForm({ open: true, doc: null })}>
              <Plus className="i sm" /><span className="full">Thêm văn bản</span>
            </button>
          )}
          <button className="btn icon ghost" onClick={toggleTheme} title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}>
            {theme === 'dark' ? <Sun className="i" /> : <Moon className="i" />}
          </button>
          <div style={{ position: 'relative' }}>
            <button className="avatar" onClick={() => setMenu((m) => !m)} aria-label="Tài khoản">{initials}</button>
            {menu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 35 }} onClick={() => setMenu(false)} />
                <div className="menu">
                  <div className="uinfo"><b>{profile?.full_name}</b>{profile?.role === 'admin' ? 'Quản trị' : profile?.role === 'editor' ? 'Biên tập' : 'Xem'}</div>
                  <div className="sep" />
                  {isAdmin && <button onClick={() => { setShowAdmin(true); setMenu(false); }}><Users className="i sm" />Người dùng &amp; quyền</button>}
                  {(installEvt || (isIos && !isStandalone)) && (
                    <button onClick={async () => {
                      setMenu(false);
                      if (installEvt) { installEvt.prompt(); setInstallEvt(null); }
                      else setShowIosHint(true);
                    }}><Download className="i sm" />Cài ứng dụng</button>
                  )}
                  <button onClick={() => { signOut(); setMenu(false); }}><LogOut className="i sm" />Đăng xuất</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <SearchView reloadToken={token} onOpen={setDetailId} onQueryChange={setQuery} />

      {detailId && (
        <DocDetail
          docId={detailId} query={query} isEditor={isEditor}
          onClose={() => setDetailId(null)}
          onEdit={(d) => { setForm({ open: true, doc: d }); }}
          onOpenFile={(d) => setFileDoc(d)}
          onChanged={bump}
          onOpenDoc={(id) => setDetailId(id)}
        />
      )}
      {form.open && (
        <DocForm doc={form.doc} onClose={() => setForm({ open: false, doc: null })}
          onSaved={(d) => { setForm({ open: false, doc: null }); bump(); setDetailId(d.id); }} />
      )}
      {fileDoc && <FileViewer doc={fileDoc} onClose={() => setFileDoc(null)} />}
      {showAdmin && <AdminUsers onClose={() => setShowAdmin(false)} />}

      {/* Install prompt (desktop/Android) */}
      {installEvt && !isStandalone && (
        <div className="install">
          <h4>Cài ứng dụng</h4>
          <p>Cài “Kho Văn bản QPPL” để mở nhanh như một ứng dụng, chạy toàn màn hình.</p>
          <div className="row">
            <button className="btn pri sm" onClick={async () => { installEvt.prompt(); setInstallEvt(null); }}><Download className="i sm" />Cài đặt</button>
            <button className="btn ghost sm" onClick={() => setInstallEvt(null)}>Để sau</button>
          </div>
        </div>
      )}
      {showIosHint && (
        <div className="overlay" onClick={() => setShowIosHint(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="mhead"><h2>Cài trên iPhone/iPad</h2><button className="btn icon ghost" onClick={() => setShowIosHint(false)}><X className="i" /></button></div>
            <div className="mbody">
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                Trong Safari, bấm nút <Share className="i sm" style={{ display: 'inline', verticalAlign: '-3px' }} /> <b>Chia sẻ</b> ở thanh dưới, chọn <b>“Thêm vào MH chính”</b> (Add to Home Screen) để cài ứng dụng.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ToastProvider>
  );
}
