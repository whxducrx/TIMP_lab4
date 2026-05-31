import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickComponent({ onMapClick }) {
    const map = useMap();
    
    React.useEffect(() => {
        const handleClick = (e) => {
            onMapClick(e.latlng);
        };
        map.on('click', handleClick);
        return () => {
            map.off('click', handleClick);
        };
    }, [map, onMapClick]);
    
    return null;
}

// Управляет центром и zoom при изменении
function MapCenterUpdater({ center, zoom }) {
    const map = useMap();
    
    React.useEffect(() => {
        if (center) {
            map.setView(center, zoom, { animate: true, duration: 0.5 });
        }
    }, [center, zoom, map]);
    
    return null;
}

function MapWithSearch({ placement, onPlacementChange, onError }) {
    const [searchInput, setSearchInput] = useState(placement);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mapCenter, setMapCenter] = useState([55.7558, 37.6173]);
    const [mapZoom, setMapZoom] = useState(10);
    const [showMap, setShowMap] = useState(false);
    const mapRef = useRef(null);

    // Альтернативный поиск через Nominatim с лучшей обработкой ошибок
    const searchPlace = async (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`,
                {
                    signal: controller.signal,
                    headers: {
                        'Accept-Language': 'ru'
                    }
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                onError('Место не найдено');
                setSuggestions([]);
            } else {
                setSuggestions(data);
                setShowSuggestions(true);
                onError(null);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                onError('Превышено время ожидания');
            } else if (error.message.includes('Failed to fetch')) {
                onError('Ошибка сети');
            } else {
                onError(`Ошибка поиска: ${error.message}`);
            }
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    // Выбор места из списка
    const handleSelectPlace = (place) => {
        const placeName = place.display_name;
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);

        setSearchInput(placeName);
        onPlacementChange(placeName);
        setSelectedCoords({ lat, lng });
        setMapCenter([lat, lng]);
        setMapZoom(15);  // ← Приближаем к выбранной точке
        setShowMap(true);  
        setSuggestions([]);
        setShowSuggestions(false);
        onError(null);
    };

    // Обработка клика на карте
    const handleMapClick = async (latlng) => {
        setSelectedCoords(latlng);
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'ru'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                const address = data.address || {};
                const placeName = address.city || 
                                 address.town || 
                                 address.village || 
                                 address.municipality ||
                                 address.county ||
                                 `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;

                setSearchInput(placeName);
                onPlacementChange(placeName);
                onError(null);
            }
        } catch (error) {
            setSearchInput(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
            onPlacementChange(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
        }
    };

    // Обработка ввода
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        onPlacementChange(value);

        if (value.trim()) {
            const timer = setTimeout(() => {
                searchPlace(value);
            }, 600);

            return () => clearTimeout(timer);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    return (
        <div className="mb-3">
            <label htmlFor="placement" className="form-label">
                Место <span className="text-danger">*</span>
            </label>

            <div className="mb-2">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowMap(!showMap)}
                >
                    {showMap ? 'Скрыть карту' : 'Показать карту'}
                </button>
                {selectedCoords && (
                    <small className="text-muted ms-2">
                        Координаты: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
                    </small>
                )}
            </div>

            {/* Интерактивная карта */}
            {showMap && (
                <div className="mb-3" style={{ border: '2px solid #7c3aed', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        style={{ height: '400px', width: '100%' }}
                        ref={mapRef}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='OpenStreetMap contributors'
                        />
                        <MapClickComponent onMapClick={handleMapClick} />
                        <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
                        {selectedCoords && (
                            <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
                                <Popup>
                                    <div>
                                        <strong>Выбранное место</strong>
                                        <br />
                                        {selectedCoords.lat.toFixed(4)}°, {selectedCoords.lng.toFixed(4)}°
                                    </div>
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                    <div className="p-2 bg-light border-top">
                    </div>
                </div>
            )}

            {/* Поле ввода с поиском */}
            <div className="position-relative">
                <input
                    type="text"
                    className="form-control"
                    id="placement"
                    name="placement"
                    value={searchInput}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Введите название места"
                    disabled={loading}
                />

                {/* Индикатор загрузки */}
                {loading && (
                    <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Поиск...</span>
                        </div>
                    </div>
                )}

                {/* Список предложений */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                        {suggestions.map((place, index) => (
                            <button
                                type="button"
                                key={index}
                                className="list-group-item list-group-item-action"
                                onClick={() => handleSelectPlace(place)}
                                style={{ textAlign: 'left' }}
                            >
                                <strong>{place.display_name.split(',').slice(0, 2).join(',')}</strong>
                                <br />
                                <small className="text-muted">
                                    {place.type}
                                </small>
                            </button>
                        ))}
                    </div>
                )}
            </div>

          
        </div>
    );
}

export default MapWithSearch;
