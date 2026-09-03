import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/**
 * A build-time optimized image, flattened to plain data so it can cross the
 * boundary into a React component (which cannot use Astro's <Image />).
 */
export interface ResponsiveImage {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
}

interface Options {
  alt: string;
  /** Candidate widths for the srcset. */
  widths: number[];
  format?: 'webp' | 'avif' | 'png';
}

/**
 * Optimizes an image from src/assets and returns its sources.
 * WebP by default — it keeps the portrait's transparency.
 */
export async function responsiveImage(
  source: ImageMetadata,
  { alt, widths, format = 'webp' }: Options,
): Promise<ResponsiveImage> {
  const image = await getImage({ src: source, widths, format });

  return {
    src: image.src,
    srcSet: image.srcSet.attribute,
    width: Number(image.attributes.width ?? source.width),
    height: Number(image.attributes.height ?? source.height),
    alt,
  };
}
