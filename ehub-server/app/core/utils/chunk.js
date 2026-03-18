/**
 * Chunk array into smaller batches for bulk DB operations.
 * Avoids deadlock and timeout with large datasets.
 */
export const chunkArray = (arr, size = 10) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};
