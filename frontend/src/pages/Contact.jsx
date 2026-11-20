import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsLetterBox from '../components/NewsLetterBox'
import { SITE } from '../config/site'

const Contact = () => {
  return (
    <div>
      <div className='pt-10 text-2xl text-center'>
        <Title text1={'CONTACT'} text2={'US'} />
      </div>
      <div className='my-10 flex flex-col justify-center gap-10 md:flex-row'>
        <img className='w-full rounded-xl md:max-w-[480px]' src={assets.contact_img} alt="Contact" />
        <div className='flex flex-col items-start justify-center gap-5'>
          <p className='text-xl font-semibold text-gray-700'>We are here to help</p>
          <p className='text-gray-500'>{SITE.address}</p>
          <p className='text-gray-500'>
            Phone: <a className='text-brand' href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a><br />
            Email: <a className='text-brand' href={`mailto:${SITE.email}`}>{SITE.email}</a><br />
            Hours: {SITE.hours}
          </p>
          <p className='text-gray-500'>For order help, please keep your order number ready. You can also track orders under <b>My Orders</b>.</p>
          <div className='flex flex-wrap gap-3'>
            <a href={`mailto:${SITE.email}`} className='rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark'>Email us</a>
            {SITE.whatsapp && <a href={`https://wa.me/${SITE.whatsapp}`} target='_blank' rel='noopener noreferrer' className='rounded-lg border border-brand px-6 py-3 text-sm font-semibold text-brand hover:bg-brand-light'>WhatsApp</a>}
          </div>
        </div>
      </div>
      <NewsLetterBox />
    </div>
  )
}

export default Contact