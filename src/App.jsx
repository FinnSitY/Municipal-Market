import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import RequireSeller from './components/RequireSeller.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import SellerLayout from './components/SellerLayout.jsx'
import Account from './pages/Account.jsx'
import Cart from './pages/Cart.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Landing from './pages/Landing.jsx'
import Marketplace from './pages/Marketplace.jsx'
import MyOrders from './pages/MyOrders.jsx'
import NotFound from './pages/NotFound.jsx'
import OrderDetails from './pages/OrderDetails.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Register from './pages/Register.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import AddProduct from './pages/seller/AddProduct.jsx'
import EditProduct from './pages/seller/EditProduct.jsx'
import MyProducts from './pages/seller/MyProducts.jsx'
import SellerDashboard from './pages/seller/SellerDashboard.jsx'
import SellerOrders from './pages/seller/SellerOrders.jsx'
import ShopProfile from './pages/seller/ShopProfile.jsx'
import SignIn from './pages/SignIn.jsx'
import Terms from './pages/Terms.jsx'
import Wishlist from './pages/Wishlist.jsx'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />

        <Route element={<AppLayout />}>
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />

          <Route element={<RequireAuth />}>
            <Route path="/account" element={<Account />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
          </Route>

          <Route path="/seller" element={<RequireSeller />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route element={<SellerLayout />}>
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="products" element={<MyProducts />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={<EditProduct />} />
              <Route path="profile" element={<ShopProfile />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
