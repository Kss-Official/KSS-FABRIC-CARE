import React from 'react';
import { PageHeroBanner } from './PageHeroBanner';

export const ABOUT_HERO_BG = '/assets/about-hero.png';

export const AboutHeroBanner = (props) => (
  <PageHeroBanner
    bgImage={props?.bgImage || ABOUT_HERO_BG}
    eyebrow={props?.eyebrow || 'ABOUT US'}
    heading={props?.heading || 'About Us'}
    subtitle={props?.subtitle || 'Trusted Laundry & Dry Cleaning Care, Delivered to Your Door'}
    altText={props?.altText || 'About FabriCare - Premium Laundry & Dry Cleaning'}
    {...props}
  />
);

export default AboutHeroBanner;
