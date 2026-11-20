import React, { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../api'

const NewsLetterBox = () => {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.post('/newsletter/subscribe', { email })
      toast[data.success ? 'success' : 'error'](data.message)
      if (data.success) setEmail('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not subscribe right now')
    }
    setBusy(false)
  }

  return (
    <section className='rounded-2xl bg-brand-soft px-4 py-10 text-center sm:py-14'>
      <p className='text-2xl font-bold text-gray-900'>Get offers and new arrivals first</p>
      <p className='mt-2 text-sm text-gray-500'>Join our newsletter for deals, trending picks and new launches. No spam, unsubscribe any time.</p>
      <form onSubmit={onSubmitHandler} className='mx-auto mt-6 flex w-full max-w-xl items-center overflow-hidden rounded-full border border-brand/30 bg-white'>
        <input
          className='w-full bg-transparent px-5 py-3 text-sm outline-hidden'
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='Your email address'
          required
        />
        <button disabled={busy} type='submit' className='m-1 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60'>
          {busy ? '...' : 'Subscribe'}
        </button>
      </form>
    </section>
  )
}

export default NewsLetterBox