import { useState, useEffect } from 'react';
import { airportsService, Airport } from '../services';
import { ApiError } from '../services/types/api.types';

interface UseAirportsReturn {
  airports: Airport[];
  airportsByCode: Map<string, Airport>;
  airportOptions: string[];
  isLoading: boolean;
  error: string | null;
  getAirportByCode: (code: string) => Airport | undefined;
  searchAirports: (query: string) => Airport[];
}

/**
 * Custom hook to fetch and manage airports data
 */
export const useAirports = (): UseAirportsReturn => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airportsByCode, setAirportsByCode] = useState<Map<string, Airport>>(
    new Map()
  );
  const [airportOptions, setAirportOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await airportsService.getAll();
        setAirports(data);

        // Create map for quick lookup by code
        const codeMap = new Map<string, Airport>();
        data.forEach((airport) => {
          codeMap.set(airport.code, airport);
        });
        setAirportsByCode(codeMap);

        // Create options array with format: "CODE - City, Country" or just "CODE"
        const options = data.map((airport) => {
          return `${airport.code} - ${airport.city}, ${airport.country}`;
        });
        setAirportOptions(options);
      } catch (err) {
        const apiError = err as ApiError;
        setError(
          typeof apiError.message === 'string'
            ? apiError.message
            : 'Failed to load airports'
        );
        console.error('Error fetching airports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAirports();
  }, []);

  const getAirportByCode = (code: string): Airport | undefined => {
    return airportsByCode.get(code);
  };

  const searchAirports = (query: string): Airport[] => {
    if (!query) return airports;
    const lowerQuery = query.toLowerCase();
    return airports.filter(
      (airport) =>
        airport.code.toLowerCase().includes(lowerQuery) ||
        airport.name.toLowerCase().includes(lowerQuery) ||
        airport.city.toLowerCase().includes(lowerQuery) ||
        airport.country.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    airports,
    airportsByCode,
    airportOptions,
    isLoading,
    error,
    getAirportByCode,
    searchAirports,
  };
};


