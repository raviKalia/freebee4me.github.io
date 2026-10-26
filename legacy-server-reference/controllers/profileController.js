import { profiles } from '../data/profiles.js';
export function getProfile(req, res) {
  res.json(profiles.get(req.params.id) || null);
}
export function updateProfile(req, res) {
  // DEMO ONLY: add authentication and field validation before production.
  const profile = { ...req.body, id: req.params.id };
  profiles.set(req.params.id, profile);
  res.json(profile);
}
export function updatePhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Choose a JPEG, PNG or WebP image under 2 MB.' });
  const profile = profiles.get(req.params.id) || {};
  profile.photoUrl = `/uploads/${req.file.filename}`;
  profiles.set(req.params.id, profile);
  res.json({ photoUrl: profile.photoUrl });
}
