import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { money } from '../utils/format'

const CartTotal = () => {
  const { getCartAmount, getCartMrp, getDeliveryFee, config } = useContext(ShopContext);
  const subtotal = getCartAmount();
  const mrp = getCartMrp();
  const savings = mrp - subtotal;
  const fee = getDeliveryFee();
  const toFree = config.freeDeliveryAbove - subtotal;

  return (
    <div className='w-full rounded-lg border bg-white p-4'>
      <p className='mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500'>Price details</p>
      <div className='flex flex-col gap-2 text-sm'>
        {savings > 0 && (
          <div className='flex justify-between text-gray-600'><span>Total MRP</span><span className='line-through'>{money(mrp)}</span></div>
        )}
        {savings > 0 && (
          <div className='flex justify-between text-good'><span>Discount</span><span>- {money(savings)}</span></div>
        )}
        <div className='flex justify-between text-gray-600'><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className='flex justify-between text-gray-600'>
          <span>Delivery</span>
          <span className={fee === 0 && subtotal > 0 ? 'font-medium text-good' : ''}>{subtotal === 0 ? money(0) : fee === 0 ? 'FREE' : money(fee)}</span>
        </div>
        <hr />
        <div className='flex justify-between text-lg font-bold'><span>Total</span><span>{money(subtotal + fee)}</span></div>
        {savings > 0 && (
          <p className='rounded bg-green-50 px-3 py-2 text-xs font-medium text-good'>You will save {money(savings)} on this order 🎉</p>
        )}
        {subtotal > 0 && toFree > 0 && (
          <p className='rounded bg-brand-soft px-3 py-2 text-xs text-brand'>Add items worth {money(toFree)} more for FREE delivery</p>
        )}
      </div>
    </div>
  )
}

export default CartTotal
