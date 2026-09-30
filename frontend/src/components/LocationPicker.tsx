import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "./ui/button";
import { MapPin, Navigation, Crosshair, Loader2 } from "lucide-react";

// Fix for default marker icons in Leaflet + Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationData {
    address: string;
    district: string;
    area: string;
    coordinates: { latitude: number; longitude: number };
    accuracy: number;
}

interface LocationPickerProps {
    onLocationSelect: (data: LocationData) => void;
    initialLocation?: string;
}
const MapEvents = ({ onUpdate }: { onUpdate: (lat: number, lon: number) => void }) => {
    useMapEvents({
        click(e) {
            onUpdate(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};
const RecenterMap = ({ position }: { position: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 16, { animate: true });
        }
    }, [position, map]);
    return null;
};

const MapContent = React.memo(({
    position,
    defaultCenter,
    handleLocationUpdate
}: {
    position: [number, number] | null;
    defaultCenter: [number, number];
    handleLocationUpdate: (lat: number, lon: number) => void;
}) => {
    return (
        <MapContainer
            center={position || defaultCenter}
            zoom={13}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onUpdate={handleLocationUpdate} />
            <RecenterMap position={position} />
            {position && <Marker position={position} icon={DefaultIcon} />}
        </MapContainer>
    );
});

interface LocationPickerProps {
    onLocationSelect: (data: LocationData) => void;
    initialLocation?: string;
    searchQuery?: string; // New prop for external search
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLocation, searchQuery }) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Ref to track if update came from map interaction or external search
    const isInternalUpdate = React.useRef(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Default center (Delhi)
    const defaultCenter = React.useMemo<[number, number]>(() => [28.6139, 77.209], []);

    const handleLocationUpdate = React.useCallback(async (lat: number, lon: number, accuracy: number = 0, skipReverseGeocode = false) => {
        setPosition([lat, lon]);

        if (skipReverseGeocode) {
            // Just update coords without fetching address (useful when address is already known/searched)
            onLocationSelect({
                address: searchQuery || "Pinned Location", // Fallback
                district: "",
                area: "",
                coordinates: { latitude: lat, longitude: lon },
                accuracy,
            });
            return;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.address) {
                const addr = data.address;
                const specificLocation = addr.house_number || addr.building || addr.amenity || addr.shop || addr.tourism || addr.historic || "";
                const road = addr.road || addr.street || addr.pedestrian || "";
                const area = addr.neighbourhood || addr.suburb || addr.residential || addr.village || "";
                const city = addr.city || addr.town || addr.municipality || "";
                const postcode = addr.postcode || "";

                const institution = addr.university || addr.hospital || addr.school || addr.public_building || addr.college || "";

                let preciseAddressParts = [];
                if (institution) preciseAddressParts.push(institution);
                if (specificLocation && specificLocation !== institution) preciseAddressParts.push(specificLocation);
                if (addr.house_number) preciseAddressParts.push(addr.house_number);
                if (road) preciseAddressParts.push(road);
                if (area) preciseAddressParts.push(area);
                if (city) preciseAddressParts.push(city);
                if (postcode) preciseAddressParts.push(postcode);

                const preciseAddress = preciseAddressParts.join(", ");
                const district = addr.city_district || addr.suburb || addr.district || city;

                isInternalUpdate.current = true; // Mark as internal
                onLocationSelect({
                    address: preciseAddress || data.display_name,
                    district: district,
                    area: area || district,
                    coordinates: { latitude: lat, longitude: lon },
                    accuracy,
                });
                setTimeout(() => { isInternalUpdate.current = false; }, 1000);
            }
        } catch (err) {
            console.error("Error fetching address:", err);
        }
    }, [onLocationSelect, searchQuery]);

    // Effect to handle external search query
    useEffect(() => {
        if (!searchQuery || isInternalUpdate.current) return;

        const timer = setTimeout(async () => {
            // Don't search if query is very short
            if (searchQuery.length < 4) return;

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
                );
                const data = await response.json();

                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);

                    // Update position directly
                    setPosition([lat, lon]);

                    // We also need to update parent with these NEW coords, 
                    // but we should pass the SAME address back to avoid overwriting user input loop
                    // or better: do NOT call onLocationSelect here, just move map?
                    // Ideally we want coordinates to sync.

                    onLocationSelect({
                        address: searchQuery, // Keep current input text
                        district: "", // We can't easily extract district from forward geocode without another call
                        area: "",
                        coordinates: { latitude: lat, longitude: lon },
                        accuracy: 0
                    });
                }
            } catch (err) {
                console.error("Geocoding error:", err);
            }
        }, 1500); // Debounce 1.5s to avoid rapid jumping

        return () => clearTimeout(timer);
    }, [searchQuery, onLocationSelect]);


    const locateUser = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                handleLocationUpdate(latitude, longitude, accuracy);
                setIsLocating(false);
            },
            (err) => {
                setError("Unable to retrieve your location");
                setIsLocating(false);
                console.error(err);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    if (!isMounted) return <div className="h-[250px] w-full bg-muted animate-pulse rounded-2xl border" />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Track Exact Location</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Click on the map or use the auto-track button</p>
                </div>
                <Button
                    type="button"
                    onClick={locateUser}
                    disabled={isLocating}
                    className="bg-primary hover:bg-primary/90 text-white gap-2 h-10 px-4 rounded-xl shadow-lg shadow-primary/20"
                >
                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                    {isLocating ? "Locating..." : "Auto-Track My Location"}
                </Button>
            </div>

            {error && (
                <div className="px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-medium">
                    {error}
                </div>
            )}

            <div className="h-[250px] w-full rounded-2xl border border-border overflow-hidden relative shadow-inner bg-muted/20">
                <MapContent
                    position={position}
                    defaultCenter={defaultCenter}
                    handleLocationUpdate={handleLocationUpdate}
                />

                <div className="absolute bottom-3 right-3 z-[1000] pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md border border-border shadow-2xl rounded-lg p-2 text-[10px] font-bold text-primary uppercase tracking-tighter">
                        OpenStreetMap Neural Node
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;
