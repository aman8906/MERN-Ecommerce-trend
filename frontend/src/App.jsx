import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Collection from './pages/Collection'
import Trending from './pages/Trending'
import About from './pages/About'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import PlaceOrder from './pages/PlaceOrder'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'
import Verify from './pages/Verify'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import BottomNav from './components/BottomNav'
import Policy from './pages/Policy'
import NotFound from './pages/NotFound'
import WhatsAppButton from './components/WhatsAppButton'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);

  return (
    <div className='min-h-screen pb-16 sm:pb-0'>
      <ToastContainer position='top-center' autoClose={1800} hideProgressBar limit={2} />
      <NavBar />
      <main className='mx-auto max-w-[1360px] px-3 sm:px-6'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/collection' element={<Collection />} />
          <Route path='/trending' element={<Trending />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/product/:productId' element={<Product />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/wishlist' element={<Wishlist />} />
          <Route path='/login' element={<Login />} />
          <Route path='/place-order' element={<PlaceOrder />} />
          <Route path='/orders' element={<Orders />} />
          <Route path='/verify' element={<Verify />} />
          <Route path='/policy/:slug' element={<Policy />} />
          <Route path='*' element={<NotFound />} />

        </Routes>
      </main>
        <Footer />
      <WhatsAppButton />
      <BottomNav />
    </div>
  )
}

export default App
