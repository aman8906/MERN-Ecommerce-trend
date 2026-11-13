import React from 'react'
import HeroCarousel from '../components/HeroCarousel'
import CategoryGrid from '../components/CategoryGrid'
import TrendingNow from '../components/TrendingNow'
import DealsOfTheDay from '../components/DealsOfTheDay'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import RecentlyViewed from '../components/RecentlyViewed'
import OurPolicy from '../components/OurPolicy'
import NewsLetterBox from '../components/NewsLetterBox'

const Home = () => {
  return (
    <div className='flex flex-col gap-8 py-3 sm:gap-12 sm:py-5'>
      <HeroCarousel />
      <CategoryGrid />
      <TrendingNow />
      <DealsOfTheDay />
      <LatestCollection />
      <BestSeller />
      <RecentlyViewed />
      <OurPolicy />
      <NewsLetterBox />
    </div>
  )
}

export default Home
