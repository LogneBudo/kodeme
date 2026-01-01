import { useState, useCallback } from "react";

export interface MapillaryImage {
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

interface UseMapillaryImagesReturn {
  images: MapillaryImage[];
  loading: boolean;
  error: string;
  fetchImages: (latitude: number, longitude: number, radiusMeters: number) => Promise<void>;
  getThumbnailUrl: (image: MapillaryImage) => string;
}

export function useMapillaryImages(): UseMapillaryImagesReturn {
  const [images, setImages] = useState<MapillaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchImages = useCallback(async (latitude: number, longitude: number, radiusMeters: number) => {
    setLoading(true);
    setError("");
    setImages([]);

    try {
      const apiKey = import.meta.env.VITE_MAPILLARY_TOKEN;
      if (!apiKey) {
        setError("Mapillary API not configured");
        setLoading(false);
        return;
      }

      // Calculate bbox: minLon, minLat, maxLon, maxLat
      const bboxStr = `${longitude - radiusMeters / 111000},${latitude - radiusMeters / 111000},${longitude + radiusMeters / 111000},${latitude + radiusMeters / 111000}`;
      
      const url = new URL("https://graph.mapillary.com/images");
      url.searchParams.append("access_token", apiKey);
      url.searchParams.append("fields", "id,geometry,thumb_256_url,thumb_1024_url,properties");
      url.searchParams.append("bbox", bboxStr);
      url.searchParams.append("limit", "100");

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const data: MapillaryResponse = await response.json();
      
      // Handle both response formats: data[] or features[]
      const fetchedImages = data.data || data.features || [];

      if (!fetchedImages || fetchedImages.length === 0) {
        const errorResponse = data as MapillaryResponse & { error?: { message: string } };
        if (errorResponse.error) {
          setError(`API Error: ${errorResponse.error.message}`);
        } else {
          setError("No street view images found in this location");
        }
        setImages([]);
      } else {
        setImages(fetchedImages);
      }
    } catch (err) {
      console.error("Mapillary API Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch images");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getThumbnailUrl = useCallback((image: MapillaryImage): string => {
    // Use the actual URL returned by the API
    if (image.thumb_256_url) {
      return image.thumb_256_url;
    }
    if (image.thumb_1024_url) {
      return image.thumb_1024_url;
    }
    
    // Fallback (shouldn't happen if API is working)
    return `https://d1cuyjqbdcqw44.cloudfront.net/${image.id}/thumb-256.jpg`;
  }, []);

  return {
    images,
    loading,
    error,
    fetchImages,
    getThumbnailUrl,
  };
}
