import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import CartTotal from '../components/CartTotal';
import { money } from '../utils/format';

const Cart = () => {
  const { cartItems, productCache, updateQuantity, navigate, token, getCartCount } = useContext(ShopContext);

  const lines = [];
  for (const [id, sizes] of Object.entries(cartItems))
    for (const [size, quantity] of Object.entries(sizes))
      if (quantity > 0) lines.push({ id, size, quantity, product: productCache[id] });

  if (lines.length === 0)
    return (
      <div className='py-24 text-center'>
        <p className='text-6xl'>🛒</p>
        <p className='mt-3 text-xl font-semibold'>Your cart is empty</p>
        <p className='mt-1 text-sm text-gray-500'>Add items you love and they will show up here.</p>
        <Link to='/' className='mt-5 inline-block rounded-lg bg-brand px-8 py-3 text-sm font-bold text-white'>Start shopping</Link>
      </div>
    );

  const checkout = () => (token ? navigate('/place-order') : navigate('/login', { state: { from: '/place-order' } }));

  return (
    <div className='py-4 sm:py-8'>
      <h1 className='mb-4 text-xl font-bold sm:text-2xl'>My Cart <span className='text-base font-normal text-gray-500'>({getCartCount()} items)</span></h1>
      <div className='grid gap-6 lg:grid-cols-[1fr_380px]'>
        <div className='space-y-3'>
          {lines.map(({ id, size, quantity, product }) =>
            !product ? (
              <div key={id + size} className='skeleton h-28 rounded-lg' />
            ) : (
              <div key={id + size} className='flex gap-4 rounded-lg border bg-white p-3'>
                <Link to={`/product/${id}`}><img className='h-24 w-20 rounded object-cover sm:h-28 sm:w-24' src={product.image[0]} alt='' /></Link>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <Link to={`/product/${id}`} className='line-clamp-2 text-sm font-medium text-gray-800 sm:text-base'>{product.name}</Link>
                  {size !== 'One Size' && <p className='mt-0.5 text-xs text-gray-500'>Size: <b>{size}</b></p>}
                  <div className='mt-1 flex items-baseline gap-2'>
                    <span className='font-bold'>{money(product.price)}</span>
                    {product.mrp > product.price && <span className='text-xs text-gray-400 line-through'>{money(product.mrp)}</span>}
                    {product.discountPercent > 0 && <span className='text-xs font-semibold text-good'>{product.discountPercent}% off</span>}
                  </div>
                  {product.stock < quantity && <p className='mt-1 text-xs font-medium text-deal'>{product.stock === 0 ? 'Out of stock' : `Only ${product.stock} available`}</p>}
                  <div className='mt-auto flex items-center justify-between pt-2'>
                    <div className='flex items-center overflow-hidden rounded-full border'>
                      <button onClick={() => updateQuantity(id, size, quantity - 1)} className='px-3 py-1 text-lg hover:bg-gray-100'>−</button>
                      <span className='w-8 text-center text-sm font-semibold'>{quantity}</span>
                      <button onClick={() => updateQuantity(id, size, quantity + 1)} disabled={quantity >= Math.min(10, product.stock)} className='px-3 py-1 text-lg hover:bg-gray-100 disabled:opacity-30'>+</button>
                    </div>
                    <button onClick={() => updateQuantity(id, size, 0)} className='text-xs font-semibold text-deal'>REMOVE</button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
        <div className='h-fit space-y-3 lg:sticky lg:top-36'>
          <CartTotal />
          <button onClick={checkout} className='w-full rounded-lg bg-brand py-3.5 text-sm font-bold text-white hover:bg-brand-dark'>
            {token ? 'PLACE ORDER' : 'LOGIN & CHECKOUT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
