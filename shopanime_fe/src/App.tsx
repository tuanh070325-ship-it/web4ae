import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './views/Home';
import { Shop } from './views/Shop';
import { ProductDetail } from './views/ProductDetail';
import { Cart } from './views/Cart';
import { Checkout } from './views/Checkout';
import { Wishlist } from './views/Wishlist';
import { Feed } from './views/Feed';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { Profile } from './views/Profile';
import { Orders } from './views/Orders';
import { OrderDetail } from './views/OrderDetail';
import { AdminOrders } from './views/AdminOrders';
import { AdminProducts } from './views/AdminProducts';
import { AdminDashboard } from './views/AdminDashboard';
import { NotFound } from './views/NotFound';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminCategories } from './views/AdminCategories';
import { AdminAuthors } from './views/AdminAuthors';
import { AdminUsers } from './views/AdminUsers';
import { AdminAnalytics } from './views/AdminAnalytics';
import { AnalyticsTracker } from './components/analytics/AnalyticsTracker';

function App() {
  return (
    <>
      <AnalyticsTracker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="feed" element={<Feed />} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="authors" element={<AdminAuthors />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
