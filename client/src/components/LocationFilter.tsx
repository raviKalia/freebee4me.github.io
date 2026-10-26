import type { Coordinates } from '../types';

type Props = {
	city: string;
	postalCode: string;
	radius: string;
	coords: Coordinates | null;
	setCity: (value: string) => void;
	setPostalCode: (value: string) => void;
	setRadius: (value: string) => void;
	setCoords: (value: Coordinates | null) => void;
	setMessage: (value: string) => void;
};

export default function LocationFilter(props: Props) {
	// Find the user's current location.
	function findMyLocation() {
		if (!navigator.geolocation) {
			props.setMessage('Location is not supported. Enter your city instead.');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				props.setCoords({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				});

				props.setMessage('Showing items near your current location.');
			},
			() => {
				props.setMessage('Location unavailable. Enter your city or postal code instead.');
			},
		);
	}

	// Clear the current location and entered area.
	function clearLocation() {
		props.setCoords(null);
		props.setCity('');
		props.setPostalCode('');
	}

	return (
		<>
			<label>
				City
				<input placeholder="Toronto" value={props.city} onChange={(e) => { props.setCity(e.target.value); props.setCoords(null); }} />
			</label>

			<label>
				Postal code
				<input placeholder="M9W" value={props.postalCode} onChange={(e) => { props.setPostalCode(e.target.value); props.setCoords(null); }} />
			</label>

			<label>
				Within
				<select value={props.radius} onChange={(e) => props.setRadius(e.target.value)}>
					{['5', '10', '25', '50', '100'].map((n) => (
						<option key={n} value={n}>
							{n} km
						</option>
					))}
				</select>
			</label>

			<button className="locate" type="button" onClick={findMyLocation}>
				⌖ Use my location
			</button>

			{props.coords && (
				<button className="clear" type="button" onClick={clearLocation}>
					Clear current location
				</button>
			)}
		</>
	);
}
