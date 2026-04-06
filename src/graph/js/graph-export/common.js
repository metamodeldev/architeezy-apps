/**
 * Common utilities for graph export.
 *
 * @module graph-export/common
 * @package
 */

/**
 * Triggers a browser download of the given blob with the specified filename.
 *
 * @param {Blob} blob - The data to download.
 * @param {string} filename - The suggested filename for the download.
 * @returns {void}
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
