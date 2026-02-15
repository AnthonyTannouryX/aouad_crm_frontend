// src/admin/components/LocationPicker.jsx
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Fix marker icons in Vite/React builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickToSet({ onPick }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng);
        },
    });
    return null;
}

// keeps map centered when value changes
function Recenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (!center) return;
        map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }, [center?.lat, center?.lng]); // eslint-disable-line
    return null;
}

export default function LocationPicker({
    value, // {lat,lng} | null
    onChange,
    defaultCenter = { lat: 25.2048, lng: 55.2708 }, // Dubai
    height = 260,
}) {
    const center = value || defaultCenter;

    return (
        <div
            style={{
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
            }}
        >
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={value ? 14 : 11}
                style={{ height }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Recenter center={center} />

                <ClickToSet
                    onPick={({ lat, lng }) => {
                        onChange({ lat, lng });
                    }}
                />

                {value && <Marker position={[value.lat, value.lng]} />}
            </MapContainer>
        </div>
    );
}
