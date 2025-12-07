import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AddProduct from './pages/AddProduct';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProductDetail from './pages/ProductDetail'; 
import Header from './components/Header';
import MyProducts from './pages/MyProducts';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ProductExchange from './pages/ProductExchange';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import Footer from './components/footer';
import ProductConsultant from './components/ProductConsultant';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddProduct />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/my-products" element={<MyProducts />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/exchange" element={<ProductExchange />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/search" element={<Search />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/order/:id" element={<MyOrders />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
      <ProductConsultant />
    </Router>
  );
}

export default App;
