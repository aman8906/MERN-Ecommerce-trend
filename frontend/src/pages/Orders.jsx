import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'
import api from '../api'
import { money } from '../utils/format'

const STEPS = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const Tracker = ({ status }) => {
  if (status === 'Cancelled') return <p className='rounded bg-red-50 px-3 py-1.5 text-sm font-semibold text-deal'>Order cancelled</p>;
  const idx = STEPS.indexOf(status);
  return (
    <div className='flex items-center'>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className='flex flex-col items-center'>
            <div className={`h-3 w-3 rounded-full ${i <= idx ? 'bg-good' : 'bg-gray-300'}`} />
            <span className={`mt-1 hidden w-16 text-center text-[10px] leading-tight sm:block ${i <= idx ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < idx ? 'bg-good' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

const Orders = () => {
  const { token, navigate } = useContext(ShopContext);
  const [orders, setOrders] = useState(null);

  const load = () => api.get('/order/mine').then((r) => r.data.success && setOrders(r.data.orders)).catch(() => setOrders([]));
  useEffect(() => { if (!token) navigate('/login', { state: { from: '/orders' } }); else load(); }, [token]); // eslint-disable-line

  const cancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const { data } = await api.post('/order/cancel', { orderId });
      toast[data.success ? 'success' : 'error'](data.message);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Could not cancel'); }
  };

  if (!orders) return <div className='space-y-3 py-8'>{[1, 2].map((i) => <div key={i} className='skeleton h-40 rounded-lg' />)}</div>;

  return (
    <div className='py-4 sm:py-8'>
      <h1 className='mb-4 text-xl font-bold sm:text-2xl'>My Orders</h1>
      {orders.length === 0 && (
        <div className='py-20 text-center'>
          <p className='text-5xl'>📦</p>
          <p className='mt-2 font-semibold'>No orders yet</p>
          <Link to='/' className='mt-4 inline-block rounded-lg bg-brand px-8 py-3 text-sm font-bold text-white'>Start shopping</Link>
        </div>
      )}
      <div className='space-y-4'>
        {orders.map((o) => (
          <div key={o._id} className='overflow-hidden rounded-lg border bg-white'>
            <div className='flex flex-wrap items-center justify-between gap-2 border-b bg-gray-50 px-4 py-2 text-xs text-gray-500'>
              <span>Order #{o._id.slice(-8).toUpperCase()}</span>
              <span>{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className='uppercase'>{o.paymentMethod} · {o.payment ? 'Paid' : 'Pay on delivery'}</span>
              <b className='text-sm text-gray-800'>{money(o.amount)}</b>
            </div>
            <div className='divide-y'>
              {o.items.map((it, i) => (
                <Link to={`/product/${it.productId}`} key={i} className='flex gap-3 p-3'>
                  <img src={it.image} alt='' className='h-20 w-16 rounded object-cover' />
                  <div className='text-sm'>
                    <p className='line-clamp-2 font-medium'>{it.name}</p>
                    <p className='mt-1 text-xs text-gray-500'>Qty {it.quantity}{it.size && it.size !== 'One Size' ? ` · Size ${it.size}` : ''} · {money(it.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className='flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex-1 sm:max-w-md'><Tracker status={o.status} /></div>
              <div className='flex items-center gap-3'>
                <span className='text-sm font-semibold'>{o.status}</span>
                {o.status === 'Order Placed' && <button onClick={() => cancel(o._id)} className='rounded border border-deal px-3 py-1 text-xs font-semibold text-deal hover:bg-red-50'>Cancel</button>}
                {o.status === 'Delivered' && <Link to={`/product/${o.items[0].productId}`} className='rounded border border-brand px-3 py-1 text-xs font-semibold text-brand'>Rate product</Link>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders
