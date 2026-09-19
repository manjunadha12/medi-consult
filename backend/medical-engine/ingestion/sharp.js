import sharp from 'sharp';

/**
 * Preprocesses input images for high-accuracy OCR using Sharp
 */
export async function preprocessImage(inputBuffer) {
  try {
    const meta = await sharp(inputBuffer).metadata();
    let pipeline = sharp(inputBuffer);

    // Auto-orient based on EXIF tag
    pipeline = pipeline.rotate();

    // Upscale low-res mobile scans
    if (meta.width && meta.width < 1500) {
      pipeline = pipeline.resize({ width: 2200, withoutEnlargement: false, fit: 'inside' });
    }

    // Convert to high-contrast grayscale and normalize dynamically
    const processed = await pipeline
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.2, m1: 1.0, m2: 2.0 })
      .png()
      .toBuffer();

    return processed;
  } catch (err) {
    console.warn("[INGESTION_SHARP_WARN] Image preprocessing fallback to raw buffer:", err.message);
    return inputBuffer;
  }
}

/**
 * Creates adaptive contrast variations for multi-pass OCR
 */
export async function createContrastPass(inputBuffer) {
  try {
    return await sharp(inputBuffer)
      .grayscale()
      .linear(1.4, -20)
      .sharpen()
      .png()
      .toBuffer();
  } catch (e) {
    return inputBuffer;
  }
}
