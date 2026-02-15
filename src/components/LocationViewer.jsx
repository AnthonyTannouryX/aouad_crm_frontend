import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function LocationViewer({ lat, lng, height = 260 }) {
    const has = Number.isFinite(lat) && Number.isFinite(lng);

    if (!has) {
        return (
            <div className="ld-map">
                <div className="ld-mapEmpty">Map not set</div>
            </div>
        );
    }

    return (
        <div className="ld-map" style={{ overflow: "hidden", borderRadius: 14 }}>
            <MapContainer
                center={[lat, lng]}
                zoom={14}
                style={{ height }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[lat, lng]} />
            </MapContainer>
        </div>
    );
}
