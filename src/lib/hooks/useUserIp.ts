import { useState, useEffect } from 'react';

export function useUserIp() {
  const [userIp, setUserIp] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIp() {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log('Got IP from ipify:', data.ip);
        setUserIp(data.ip);
      } catch (error) {
        console.error('Error fetching IP:', error);
        setUserIp(null);
      }
    }

    fetchIp();
  }, []);

  return { userIp };
} 