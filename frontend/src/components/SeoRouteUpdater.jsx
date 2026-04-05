import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { applySeoToDocument } from '../utils/seo';

export default function SeoRouteUpdater() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search || ''}`;
    applySeoToDocument(currentPath);
  }, [location.pathname, location.search]);

  return null;
}
