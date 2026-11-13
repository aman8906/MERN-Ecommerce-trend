import React, { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import api from '../api'

const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other'];

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const Field = (props) => <input {...props} required className='w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand' />;

const PlaceOrder = () => {
  const { navigate, token, cartItems, clearCart, getCartCount, userName } = useContext(ShopContext);
  const [method, setMethod] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem('address')) || {}; } catch { return {}; }
  });
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    if (!token) navigate('/login', { state: { from: '/place-order' } });
    else if (getCartCount() === 0) navigate('/cart');
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => { if (!form.firstName && userName) setForm((f) => ({ ...f, firstName: userName.split(' ')[0], lastName: userName.split(' ').slice(1).join(' ') })); }, [userName]); // eslint-disable-line

  const items = Object.entries(cartItems).flatMap(([productId, sizes]) =>
    Object.entries(sizes).filter(([, q]) => q > 0).map(([size, quantity]) => ({ productId, size, quantity }))
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.phone || '')) return toast.error('Enter a valid 10-digit mobile number');
    if (!/^\d{6}$/.test(form.zipcode || '')) return toast.error('Enter a valid 6-digit pincode');
    setBusy(true);
    const address = { country: 'India', ...form };
    localStorage.setItem('address', JSON.stringify(address));
    try {
      if (method === 'cod') {
        const { data } = await api.post('/order/cod', { items, address });
        if (data.success) { clearCart(); toast.success('Order placed successfully!'); navigate('/orders'); }
      } else if (method === 'stripe') {
        const { data } = await api.post('/order/stripe', { items, address });
        if (data.success) window.location.replace(data.session_url);
      } else {
        if (!(await loadRazorpay())) throw new Error('Could not load Razorpay');
        const { data } = await api.post('/order/razorpay', { items, address });
        const rz = new window.Razorpay({
          key: data.key, amount: data.order.amount, currency: data.order.currency, name: 'Trendify',
          description: 'Order payment', order_id: data.order.id,
          prefill: { name: `${address.firstName} ${address.lastName}`, email: address.email, contact: address.phone },
          theme: { color: '#9f2089' },
          handler: async (resp) => {
            try {
              const v = await api.post('/order/verify-razorpay', { orderId: data.orderId, ...resp });
              if (v.data.success) { clearCart(); toast.success('Payment successful!'); navigate('/orders'); }
            } catch (err) { toast.error(err.response?.data?.message || 'Payment verification failed'); }
          },
          modal: { ondismiss: () => { api.post('/order/cancel-unpaid', { orderId: data.orderId }).catch(() => {}); setBusy(false); } },
        });
        rz.open();
        return; // keep button busy until the popup finishes
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not place order');
    }
    setBusy(false);
  };

  const Option = ({ id, children }) => (
    <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${method === id ? 'border-brand bg-brand-soft' : 'bg-white'}`}>
      <input type='radio' name='pay' checked={method === id} onChange={() => setMethod(id)} className='accent-brand' />
      {children}
    </label>
  );

  return (
    <form onSubmit={onSubmit} className='grid gap-6 py-4 sm:py-8 lg:grid-cols-[1fr_400px]'>
      <div className='space-y-3 rounded-lg border bg-white p-4 sm:p-6'>
        <h2 className='text-lg font-bold'>Delivery address</h2>
        <div className='grid gap-3 sm:grid-cols-2'>
          <Field name='firstName' value={form.firstName || ''} onChange={on} placeholder='First name' />
          <Field name='lastName' value={form.lastName || ''} onChange={on} placeholder='Last name' />
        </div>
        <Field name='email' type='email' value={form.email || ''} onChange={on} placeholder='Email address' />
        <Field name='phone' type='tel' inputMode='numeric' maxLength={10} value={form.phone || ''} onChange={on} placeholder='10-digit mobile number' />
        <Field name='street' value={form.street || ''} onChange={on} placeholder='House no, building, street, area' />
        <div className='grid gap-3 sm:grid-cols-2'>
          <Field name='city' value={form.city || ''} onChange={on} placeholder='City' />
          <Field name='zipcode' inputMode='numeric' maxLength={6} value={form.zipcode || ''} onChange={on} placeholder='Pincode' />
        </div>
        <select name='state' value={form.state || ''} onChange={on} required className='w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand'>
          <option value=''>Select state</option>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className='space-y-4'>
        <CartTotal />
        <div className='space-y-2 rounded-lg border bg-white p-4'>
          <h2 className='mb-1 font-bold'>Payment method</h2>
          <Option id='cod'><span className='text-sm font-medium'>Cash on Delivery</span></Option>
          <Option id='razorpay'><img className='h-5' src={assets.razorpay_logo} alt='Razorpay' /><span className='text-xs text-gray-500'>UPI, Cards, Netbanking</span></Option>
          <Option id='stripe'><img className='h-5' src={assets.stripe_logo} alt='Stripe' /><span className='text-xs text-gray-500'>Cards</span></Option>
        </div>
        <button disabled={busy} className='w-full rounded-lg bg-brand py-3.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60'>
          {busy ? 'PLEASE WAIT…' : method === 'cod' ? 'PLACE ORDER' : 'PAY & PLACE ORDER'}
        </button>
      </div>
    </form>
  )
}

export default PlaceOrder
