import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Subscribe from './pages/Subscribe.jsx';
import Feed from './pages/Feed.jsx';
import Upload from './pages/Upload.jsx';
import Profile from './pages/Profile.jsx';
import Search from './pages/Search.jsx';
import Saved from './pages/Saved.jsx';
import Notifications from './pages/Notifications.jsx';
import Admin from './pages/Admin.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Cargando…</div>;
  if (!user) return <Navigate to="/entrar" replace />;
  return children;
}

function RequireSubscription({ children }) {
  const { isSubscribed, loading } = useAuth();
  if (loading) return <div className="page-loading">Cargando…</div>;
  if (!isSubscribed) return <Navigate to="/suscripcion" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Cargando…</div>;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/entrar" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/crear-cuenta" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route
            path="/suscripcion"
            element={
              <RequireAuth>
                <Subscribe />
              </RequireAuth>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireSubscription>
                  <Feed />
                </RequireSubscription>
              </RequireAuth>
            }
          />
          <Route
            path="/subir"
            element={
              <RequireAuth>
                <RequireSubscription>
                  <Upload />
                </RequireSubscription>
              </RequireAuth>
            }
          />
          <Route
            path="/perfil"
            element={
              <RequireAuth>
                <RequireSubscription>
                  <Profile own />
                </RequireSubscription>
              </RequireAuth>
            }
          />
          <Route
            path="/buscar"
            element={
              <RequireAuth>
                <RequireSubscription>
                  <Search />
                </RequireSubscription>
              </RequireAuth>
            }
          />
          <Route
            path="/u/:username"
            element={
              <RequireAuth>
                <RequireSubscription>
                  <Profile />
                </RequireSubscription>
              </RequireAuth>
            }
          />
          <Route
            path="/guardados"
            element={
              <RequireAuth>
                <RequireSubscription>
                  <Saved />
                </RequireSubscription>
              </RequireAuth>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <RequireAuth>
                <RequireSubscription>
                  <Notifications />
                </RequireSubscription>
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireSubscription>
                  <RequireAdmin>
                    <Admin />
                  </RequireAdmin>
                </RequireSubscription>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
