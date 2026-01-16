import { useState } from "react";
import { MapPin, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import styles from "./MapillaryTest.module.css";

interface MapillaryImage {
  id: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  thumb_256_url?: string;
  thumb_1024_url?: string;
  properties?: {
    captured_at?: number;
    organization_id?: string;
    sequence_id?: string;
    compass_angle?: number;
    [key: string]: unknown;
  };
}

interface MapillaryResponse {
  data?: MapillaryImage[];
  features?: MapillaryImage[];
}

export default function MapillaryTest() {
  const [activeTab, setActiveTab] = useState<"coords" | "address">("coords");
  const [address, setAddress] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [radius, setRadius] = useState<string>("1000");
  const [imageUrlFormat, setImageUrlFormat] = useState<string>("cloudfront");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [results, setResults] = useState<MapillaryImage[]>([]);
  const [error, setError] = useState<string>("");
  const [rawResponse, setRawResponse] = useState<MapillaryResponse | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ url: string; bbox: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const getThumbnailUrl = (image: MapillaryImage): string => {
    // First, try to use the actual URL returned by the API
    if (image.thumb_256_url) {
      return image.thumb_256_url;
    }
    if (image.thumb_1024_url) {
      return image.thumb_1024_url;
    }

    // Fallback to alternative formats if API didn't provide URL
    switch (imageUrlFormat) {
      case "cloudfront":
        return `https://d1cuyjqbdcqw44.cloudfront.net/${image.id}/thumb-256.jpg`;
      case "images":
        return `https://images.mapillary.com/${image.id}/thumb-256.jpg`;
      case "cdn":
        return `https://cdn.mapillary.com/${image.id}/thumb-256.jpg`;
      case "direct":
        return `https://graph.mapillary.com/${image.id}/images?fields=thumb_256_url`;
      default:
        return `https://d1cuyjqbdcqw44.cloudfront.net/${image.id}/thumb-256.jpg`;
    }
  };

  const geocodeAddress = async () => {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setGeocodingLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json() as { lat?: string; lon?: string; display_name?: string }[];

      if (!data || data.length === 0) {
        setError(`Address not found: "${address}"`);
        setGeocodingLoading(false);
        return;
      }

      const result = data[0];
      setLatitude(result.lat || "");
      setLongitude(result.lon || "");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to geocode address");
    } finally {
      setGeocodingLoading(false);
    }
  };

  const getGeolocation = () => {
    setGeoLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      (error) => {
        setError(`Geolocation error: ${error.message}`);
        setGeoLoading(false);
      }
    );
  };

  const testMapillaryAPI = async () => {
    if (!latitude || !longitude) {
      setError("Please provide latitude and longitude");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const rad = parseInt(radius, 10);

      if (isNaN(lat) || isNaN(lon) || isNaN(rad)) {
        setError("Invalid coordinates or radius");
        setLoading(false);
        return;
      }

      // Mapillary API v4 endpoint
      const apiKey = import.meta.env.VITE_MAPILLARY_TOKEN;
      if (!apiKey) {
        setError("VITE_MAPILLARY_TOKEN not configured");
        setLoading(false);
        return;
      }

      // Calculate bbox: minLon, minLat, maxLon, maxLat
      const bboxStr = `${lon - rad / 111000},${lat - rad / 111000},${lon + rad / 111000},${lat + rad / 111000}`;
      
      const url = new URL("https://graph.mapillary.com/images");
      url.searchParams.append("access_token", apiKey);
      url.searchParams.append("fields", "id,geometry,thumb_256_url,thumb_1024_url,properties");
      url.searchParams.append("bbox", bboxStr);
      url.searchParams.append("limit", "100");

      // Log debug info
      console.log("Mapillary API Request:", {
        location: { latitude: lat, longitude: lon },
        radius: `${rad}m`,
        bbox: bboxStr,
        url: url.toString(),
      });

      setDebugInfo({ url: url.toString(), bbox: bboxStr });
      setRawResponse(null);

      const response = await fetch(url.toString());

      console.log("Response Status:", response.status, response.statusText);
      console.log("Response Headers:", {
        contentType: response.headers.get("content-type"),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error Response Body:", errorData);
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const data: MapillaryResponse = await response.json();
      console.log("Full API Response Object:", data);
      
      // Handle both response formats: data[] or features[]
      const images = data.data || data.features || [];
      console.log("Images Count:", images.length);
      console.log("Images:", images);
      
      setRawResponse(data);
      setResults(images);

      if (!images || images.length === 0) {
        // Check if API returned an error in the response
        const errorResponse = data as MapillaryResponse & { error?: { message: string } };
        if (errorResponse.error) {
          setError(`API Error: ${errorResponse.error.message}`);
        } else {
          setError("No images found in this location");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch from Mapillary API");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabClick = (tab: "coords" | "address") => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.titleRow}>
              <div className={styles.titleIcon}>
                <MapPin size={20} color="white" />
              </div>
              <h1 className={styles.title}>Mapillary Test</h1>
            </div>
            <p className={styles.subtitle}>Test Mapillary API returns based on geolocation</p>
          </div>
        </div>

        <div className={styles.testPanel}>
          {/* Input Section */}
          <div className={styles.inputSection}>
            <h2 className={styles.sectionTitle}>Test Parameters</h2>

            {/* Tabs */}
            <div className={styles.tabContainer}>
              <button 
                className={styles.tab}
                data-active={activeTab === "coords" ? "true" : "false"}
                onClick={() => handleTabClick("coords")}
              >
                📍 Coordinates
              </button>
              <button 
                className={styles.tab}
                data-active={activeTab === "address" ? "true" : "false"}
                onClick={() => handleTabClick("address")}
              >
                🏘️ Address
              </button>
            </div>

            {/* Coordinates Tab */}
            {activeTab === "coords" && (
            <div className={styles.inputGroup}>
              <div className={styles.inputRow}>
                <div className={styles.inputField}>
                  <label>Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g., 40.7128"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    disabled={geoLoading || geocodingLoading}
                  />
                </div>
                <div className={styles.inputField}>
                  <label>Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g., -74.0060"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    disabled={geoLoading || geocodingLoading}
                  />
                </div>
                <div className={styles.inputField}>
                  <label>Radius (meters)</label>
                  <input
                    type="text"
                    placeholder="e.g., 1000"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    disabled={geoLoading || geocodingLoading}
                  />
                </div>
              </div>

              <div className={styles.buttonRow}>
                <button
                  onClick={getGeolocation}
                  disabled={geoLoading || loading}
                  className={styles.primaryButton}
                >
                  {geoLoading ? (
                    <>
                      <Loader2 size={16} /> Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin size={16} /> Use My Location
                    </>
                  )}
                </button>
              </div>
            </div>
            )}

            {/* Address Tab */}
            {activeTab === "address" && (
            <div className={styles.inputGroup}>
              <div className={styles.inputRow}>
                <div className={styles.inputField}>
                  <label>Address</label>
                  <input
                    type="text"
                    placeholder="e.g., Times Square, New York"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={geocodingLoading || geoLoading}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        geocodeAddress();
                      }
                    }}
                  />
                </div>
                <div className={styles.inputField}>
                  <label>Radius (meters)</label>
                  <input
                    type="text"
                    placeholder="e.g., 1000"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    disabled={geocodingLoading || geoLoading}
                  />
                </div>
              </div>

              <div className={styles.buttonRow}>
                <button
                  onClick={geocodeAddress}
                  disabled={geocodingLoading || loading || !address.trim()}
                  className={styles.primaryButton}
                >
                  {geocodingLoading ? (
                    <>
                      <Loader2 size={16} /> Geocoding...
                    </>
                  ) : (
                    <>
                      <MapPin size={16} /> Geocode Address
                    </>
                  )}
                </button>
              </div>
            </div>
            )}

            {/* Shared Test API button */}
            <div className={styles.sharedButtonRow}>
              <button
                onClick={testMapillaryAPI}
                disabled={geoLoading || loading || geocodingLoading || !latitude || !longitude}
                className={styles.primaryButton}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} /> Testing...
                  </>
                ) : (
                  "Test API"
                )}
              </button>

              {/* Image URL Format Selector */}
              {results.length > 0 && (
                <div className={styles.inputField}>
                  <label>Thumbnail Format</label>
                  <select 
                    value={imageUrlFormat}
                    onChange={(e) => setImageUrlFormat(e.target.value)}
                    className={styles.selectField}
                  >
                    <option value="cloudfront">CloudFront CDN</option>
                    <option value="images">images.mapillary.com</option>
                    <option value="cdn">cdn.mapillary.com</option>
                    <option value="direct">Direct API</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Raw Response Inspector */}
          {rawResponse && (
            <div className={styles.responseBox}>
              <h3 className={styles.responseTitle}>📋 Raw API Response Inspector</h3>
              <details className={styles.details}>
                <summary>Click to expand full JSON response</summary>
                <pre className={styles.responsePre}>{JSON.stringify(rawResponse, null, 2)}</pre>
              </details>
            </div>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <div className={styles.debugBox}>
              <h3 className={styles.debugTitle}>🔍 API Request Debug Info</h3>
              <div className={styles.debugContent}>
                <div>
                  <strong>URL:</strong>
                  <code className={styles.debugCode}>{debugInfo.url}</code>
                </div>
                <div>
                  <strong>Bbox:</strong>
                  <code className={styles.debugCode}>{debugInfo.bbox}</code>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div className={styles.resultsSection}>
              <h2 className={styles.sectionTitle}>Results ({results.length} images found)</h2>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Total Images</span>
                  <span className={styles.statValue}>{results.length}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Center Lat</span>
                  <span className={styles.statValue}>{latitude}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Center Lon</span>
                  <span className={styles.statValue}>{longitude}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Search Radius</span>
                  <span className={styles.statValue}>{radius}m</span>
                </div>
              </div>

              <div className={styles.imageGrid}>
                {results.map((image) => {
                  const thumbnailUrl = getThumbnailUrl(image);
                  const mapillaryUrl = `https://www.mapillary.com/app/?focus=photo&pKey=${image.id}`;
                  
                  return (
                  <div key={image.id} className={styles.imageCard}>
                    <img 
                      src={thumbnailUrl} 
                      alt={`Mapillary image ${image.id}`}
                      className={styles.thumbnail}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect fill="%23e5e7eb" width="256" height="256"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className={styles.imageInfo}>
                      <div className={styles.idSection}>
                        <strong>ID:</strong>
                        <code>{image.id.substring(0, 12)}...</code>
                        <button
                          onClick={() => copyToClipboard(image.id)}
                          className={styles.copyButton}
                          title="Copy full ID"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      <div className={styles.coordSection}>
                        <strong>Coordinates:</strong>
                        <code>
                          {image.geometry.coordinates[1].toFixed(6)}, {image.geometry.coordinates[0].toFixed(6)}
                        </code>
                      </div>

                      {image.properties?.captured_at && (
                        <div className={styles.metaSection}>
                          <strong>Captured:</strong>
                          <span>{new Date(image.properties.captured_at).toLocaleString()}</span>
                        </div>
                      )}

                      {(image.thumb_256_url || image.thumb_1024_url) && (
                        <div className={styles.metaSection}>
                          <strong>Thumbnail URL:</strong>
                          <code className={styles.urlCode}>{(image.thumb_256_url || image.thumb_1024_url)?.substring(0, 50)}...</code>
                        </div>
                      )}

                      {image.properties?.compass_angle !== undefined && (
                        <div className={styles.metaSection}>
                          <strong>Compass Angle:</strong>
                          <span>{image.properties.compass_angle.toFixed(1)}°</span>
                        </div>
                      )}

                      {image.properties?.sequence_id && (
                        <div className={styles.metaSection}>
                          <strong>Sequence ID:</strong>
                          <code className={styles.smallCode}>{image.properties.sequence_id.substring(0, 12)}...</code>
                        </div>
                      )}
                      
                      <div className={styles.actionSection}>
                        <a 
                          href={mapillaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionLink}
                        >
                          View on Mapillary →
                        </a>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>

              {/* Raw JSON View */}
              <div className={styles.jsonSection}>
                <h3>Full API Response</h3>
                <pre className={styles.jsonPre}>
                  {JSON.stringify(rawResponse || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
