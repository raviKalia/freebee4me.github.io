import { useCallback, useEffect, useState } from 'react';
import { getTrade } from '../services/tradeService';
import type { Trade, DemoRole } from '../types/trade';
import TradeChat from '../components/TradeChat';
import TradeStatus from '../components/TradeStatus';
export default function TradePage() {
 const [role, setRole] = useState<DemoRole>('demo-recipient');
 const [trade, setTrade] = useState<Trade | null>(null);
 const [error, setError] = useState('');
 const refresh = useCallback(() => {
  getTrade('demo-trade', role).then(setTrade).catch(e => setError(String(e)));
 }, [role]);
 useEffect(() => { setTrade(null); setError(''); refresh(); }, [refresh]);
 return <section className="info-page">
  <span className="eyebrow">COMMUNITY SHARING</span><h2>Trade & chat</h2>
  <p className="lead">Demo: switch between donor and recipient to test the privacy and chat rules.</p>
  <label className="demo-switch">Test as:
   <select value={role} onChange={e => setRole(e.target.value as DemoRole)}>
    <option value="demo-recipient">Recipient</option>
    <option value="demo-donor">Donor</option>
   </select>
  </label>
  {error && <p role="alert">{error}</p>}
  {trade && <>
   <div className="trade-grid">
    <div className="trade-panel">
     <TradeStatus trade={trade} role={role} refresh={refresh} setError={setError} />
     <h3>Pickup information</h3>
     <p><strong>Approximate area:</strong> {trade.pickupArea}</p>
     {trade.donorDetails ? <div>
      <p><strong>Donor:</strong> {trade.donorDetails.displayName}</p>
      <p><strong>Phone:</strong> {trade.donorDetails.phone}</p>
      <p><strong>Address:</strong> {[
       trade.donorDetails.street, trade.donorDetails.unit,
       trade.donorDetails.city, trade.donorDetails.province,
       trade.donorDetails.postalCode].filter(Boolean).join(', ')}</p>
     </div> : <p>Donor details and full address are hidden until the request is accepted.</p>}
    </div>
    <TradeChat trade={trade} role={role} refresh={refresh} setError={setError} />
   </div>
  </>}
 </section>;
}
