import { ExternalLink, Loader2 } from "lucide-react";
import type { MapillaryImage } from "../../hooks/useMapillaryImages";
import styles from "./MapillaryGallery.module.css";

interface MapillaryGalleryProps {
  images: MapillaryImage[];
  loading: boolean;
  error?: string;
  getThumbnailUrl: (image: MapillaryImage) => string;
  maxImages?: number;
}

export default function MapillaryGallery({
  images,
  loading,
  error,
  getThumbnailUrl,
  maxImages = 12,
}: MapillaryGalleryProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.spinner} />
          <span>Loading street view images...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return null;
  }

  const displayImages = images.slice(0, maxImages);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📸 Street View Images ({images.length} found)</h3>
      </div>
      <div className={styles.gallery}>
        {displayImages.map((image) => {
          const thumbnailUrl = getThumbnailUrl(image);
          const mapillaryUrl = `https://www.mapillary.com/app/?focus=photo&pKey=${image.id}`;
          
          return (
            <div key={image.id} className={styles.imageCard}>
              <img
                src={thumbnailUrl}
                alt={`Street view ${image.id}`}
                className={styles.thumbnail}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="200"%3E%3Crect fill="%23e5e7eb" width="256" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="12" fill="%23999"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className={styles.overlay}>
                <a
                  href={mapillaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewLink}
                  title="View on Mapillary"
                >
                  <ExternalLink size={16} />
                  View
                </a>
              </div>
              {image.properties?.captured_at && (
                <div className={styles.caption}>
                  {new Date(image.properties.captured_at).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {images.length > maxImages && (
        <div className={styles.moreInfo}>
          +{images.length - maxImages} more images available
        </div>
      )}
    </div>
  );
}
