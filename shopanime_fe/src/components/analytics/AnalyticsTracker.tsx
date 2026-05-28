import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../../lib/analytics';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {return;}
    const path = `${location.pathname}${location.search}`;
    trackEvent('page_view', { source: 'router' }, { path });
    if (location.pathname === '/') {
      trackEvent('landing_view', { source: 'home' }, { path });
    }
  }, [location.pathname, location.search]);

  return null;
}
