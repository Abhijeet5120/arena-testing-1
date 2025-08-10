import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, Region } from '@/api/entities';

const RegionContext = createContext({
  region: null,
  currencySymbol: '$',
  setRegion: () => {},
});

export const useRegion = () => useContext(RegionContext);

export const RegionProvider = ({ children }) => {
  const [region, setRegion] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    const fetchUserRegion = async () => {
      try {
        const user = await User.me();
        if (user && user.region_id) {
          const regions = await Region.list();
          const userRegion = regions.find(r => r.id === user.region_id);
          
          if (userRegion) {
            setRegion(userRegion);
            setCurrencySymbol(userRegion.currency_symbol);
          } else {
             console.warn('User region not found, using default');
          }
        }
      } catch (error) {
        // User not logged in, keep defaults
        console.warn('User not logged in or error fetching user data for region context');
      }
    };
    fetchUserRegion();
  }, []);

  return (
    <RegionContext.Provider value={{ region, currencySymbol, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
};