// Simple compression utilities for drawing data
// This helps reduce the size of drawing data stored in the database

export function compressDrawingData(drawingData: any): string {
  if (!drawingData) return "";

  try {
    // Convert to JSON string
    const jsonString = JSON.stringify(drawingData);

    // Simple compression: remove unnecessary whitespace and compress paths
    let compressed = jsonString
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/,\s+/g, ",") // Remove spaces after commas
      .replace(/:\s+/g, ":") // Remove spaces after colons
      .replace(/\s+}/g, "}") // Remove spaces before closing braces
      .replace(/\s+]/g, "]") // Remove spaces before closing brackets
      .replace(/{\s+/g, "{") // Remove spaces after opening braces
      .replace(/\[\s+/g, "["); // Remove spaces after opening brackets

    // Further compression for path data
    if (drawingData.paths && Array.isArray(drawingData.paths)) {
      // Compress path coordinates by rounding to 2 decimal places
      compressed = compressed.replace(/"(\d+\.\d{3,})"/g, (match, num) => {
        return `"${parseFloat(num).toFixed(2)}"`;
      });
    }

    return compressed;
  } catch (error) {
    console.error("Failed to compress drawing data:", error);
    return JSON.stringify(drawingData);
  }
}

export function decompressDrawingData(compressedData: string): any {
  if (!compressedData) return null;

  try {
    return JSON.parse(compressedData);
  } catch (error) {
    console.error("Failed to decompress drawing data:", error);
    return null;
  }
}

// Estimate compression ratio
export function getCompressionRatio(original: any, compressed: string): number {
  const originalSize = JSON.stringify(original).length;
  const compressedSize = compressed.length;
  return originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;
}
