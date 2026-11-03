import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'product';
  jsonLd?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'Yorder — Real stores, real stock, counted by hand',
  description = 'Every item on Yorder sits on a real shelf in a real store near you. Try at your door in 98 minutes. Rider waits 10 minutes while you try — pay only for what you keep.',
  canonical,
  ogImage = '/assets/hero-drop.jpg',
  ogType = 'website',
  jsonLd,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    document.title = title;

    // 2. Helper to set/create meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    setMeta('og:image', ogImage, true);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);

    // 3. Update Canonical Tag
    if (canonical) {
      let linkEl = document.querySelector('link[rel="canonical"]');
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.setAttribute('rel', 'canonical');
        document.head.appendChild(linkEl);
      }
      linkEl.setAttribute('href', canonical);
      setMeta('og:url', canonical, true);
      setMeta('twitter:url', canonical);
    }

    // 4. Update dynamic JSON-LD Schema
    const existingSchema = document.getElementById('dynamic-jsonld');
    if (existingSchema) {
      existingSchema.remove();
    }
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'dynamic-jsonld';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, ogImage, ogType, jsonLd]);

  return null;
};
