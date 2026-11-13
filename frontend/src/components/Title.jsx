import React from 'react'

const Title = ({text1, text2}) => {
  return (
    <div className='inline-flex items-center gap-2 mb-3'>
        <p className='text-gray-500'>
            {text1}
            &nbsp;
            <span className='font-semibold text-brand'>{text2}</span>
        </p>
        <p className='w-8 sm:w-12 h-[2px] bg-brand'></p>
    </div>
  )
}

export default Title
