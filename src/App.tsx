import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAppStore } from './stores/useAppStore';
import { useAuthStore } from './stores/useAuthStore';
import { useChatStore } from './stores/useChatStore';
import { useCartStore } from './stores/useCartStore';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/layout/Toast';
import { AuthModal } from './components/auth/AuthModal';
import { AddressMapModal } from './components/address/AddressMapModal';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ShowroomsPage } from './pages/ShowroomsPage';
import { StorePage } from './pages/StorePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ChatPage } from './pages/ChatPage';
import { BagPage } from './pages/BagPage';
import { OrderPage } from './pages/OrderPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { AppRoute } from './types';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Route wrappers that synchronize React Router URL params into Zustand state
const StoreRouteWrapper: React.FC = () => {
  const { sid } = useParams<{ sid: string }>();
  const setSid = useAppStore((s) => s.setSid);

  useEffect(() => {
    if (sid) setSid(sid);
  }, [sid, setSid]);

  return <StorePage />;
};

const ProductRouteWrapper: React.FC = () => {
  const { pid } = useParams<{ pid: string }>();
  const setPid = useAppStore((s) => s.setPid);

  useEffect(() => {
    if (pid) setPid(pid);
  }, [pid, setPid]);

  return <ProductDetailPage />;
};

const ChatRouteWrapper: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);

  useEffect(() => {
    if (chatId) setActiveChatId(chatId);
  }, [chatId, setActiveChatId]);

  return <ChatPage />;
};

export const App: React.FC = () => {
  const { theme, setRoute, setNavigate, addressModalOpen, setAddressModalOpen } = useAppStore();
  const initAuth = useAuthStore((s) => s.initAuth);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  useEffect(() => {
    // Automatically authenticate with real backend as guest and sync cart
    initAuth().then(() => {
      useCartStore.getState().syncBackendCart();
    });
  }, [initAuth]);

  // Sync browser URL with AppStore route
  useEffect(() => {
    const path = location.pathname;
    let r: AppRoute = 'home';
    if (path.startsWith('/products')) r = 'products';
    else if (path.startsWith('/showrooms')) r = 'showrooms';
    else if (path.startsWith('/store')) r = 'store';
    else if (path.startsWith('/product')) r = 'product';
    else if (path.startsWith('/chat')) r = 'chat';
    else if (path.startsWith('/bag')) r = 'bag';
    else if (path.startsWith('/order')) r = 'order';

    setRoute(r);
  }, [location.pathname, setRoute]);

  return (
    <div
      className="ythm min-h-screen flex flex-col bg-[var(--bg)] text-[var(--t1)] transition-colors duration-200"
      data-t={theme}
    >
      <Header />
      <main className="flex-1 flex flex-col w-full">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/showrooms" element={<ShowroomsPage />} />
            <Route path="/store/:sid" element={<StoreRouteWrapper />} />
            <Route path="/store" element={<StoreRouteWrapper />} />
            <Route path="/product/:pid" element={<ProductRouteWrapper />} />
            <Route path="/product" element={<ProductRouteWrapper />} />
            <Route path="/chat/:chatId" element={<ChatRouteWrapper />} />
            <Route path="/chat" element={<ChatRouteWrapper />} />
            <Route path="/bag" element={<BagPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order/:orderId" element={<OrderPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<ProfilePage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
      <Toast />
      <AuthModal />
      <AddressMapModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
      />
    </div>
  );
};

export default App;
