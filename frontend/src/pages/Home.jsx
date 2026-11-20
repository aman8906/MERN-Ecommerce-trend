import React from 'react'
import HeroCarousel from '../components/HeroCarousel'
import CategoryGrid from '../components/CategoryGrid'
import PriceStrip from '../components/PriceStrip'
import TrendingNow from '../components/TrendingNow'
import PromoBanners from '../components/PromoBanners'
import DealsOfTheDay from '../components/DealsOfTheDay'
import CategoryShowcase from '../components/CategoryShowcase'
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
      <PriceStrip />
      <TrendingNow />
      <PromoBanners />
      <DealsOfTheDay />
      <CategoryShowcase />
      <LatestCollection />
      <BestSeller />
      <RecentlyViewed />
      <OurPolicy />
      <NewsLetterBox />
    </div>
  )
}

export default Home