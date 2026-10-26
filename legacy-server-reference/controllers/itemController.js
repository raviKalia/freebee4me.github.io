import { items } from '../data/items.js';
import { distanceKm } from '../utils/distance.js';
export function listItems(req, res) {
  const { search = '', category = 'All', city = '', postalCode = '', lat, lng, radius = '25' } = req.query;
  let result = items.filter(item =>
    item.status === 'Available' &&
    (!search || `${item.title} ${item.description}`.toLowerCase().includes(String(search).toLowerCase())) &&
    (category === 'All' || item.category === category)
  );
  if (lat !== undefined && lng !== undefined) {
    const latitude = Number(lat), longitude = Number(lng), km = Number(radius);
    if (![latitude, longitude, km].every(Number.isFinite) || km < 0)
      return res.status(400).json({ error: 'Invalid location or radius.' });
    result = result.filter(item =>
      distanceKm(latitude, longitude, item.latitude, item.longitude) <= km);
  } else if (city || postalCode) {
    result = result.filter(item =>
      (city && item.city.toLowerCase().includes(String(city).toLowerCase())) ||
      (postalCode && item.postalCode.toLowerCase().startsWith(String(postalCode).toLowerCase())));
  }
  res.json(result);
}
