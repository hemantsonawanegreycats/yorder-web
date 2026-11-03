import React from 'react';
import { HeroBanner } from '../components/home/HeroBanner';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { NewArrivals } from '../components/home/NewArrivals';
import { ShowroomsPreview } from '../components/home/ShowroomsPreview';
import { SEO } from '../components/common/SEO';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      <SEO
        title="Yorder — Real stores, real stock, counted by hand"
        description="Every item on Yorder sits on a real shelf in a real store near you. Try sneakers, streetwear, watches, and tech at your door in 98 minutes. Pay only for what you keep."
        canonical="https://yorder.com/"
        ogImage="/assets/hero-drop.jpg"
      />
      <HeroBanner />
      <CategoryGrid />
      <NewArrivals />
      <ShowroomsPreview />
    </div>
  );
};
