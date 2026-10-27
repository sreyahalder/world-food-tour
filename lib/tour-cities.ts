export const tourCities = ['New York', 'Jersey City'] as const;
export function isTourCity(city: unknown): city is (typeof tourCities)[number] {
  return tourCities.some(supported => supported === city);
}
