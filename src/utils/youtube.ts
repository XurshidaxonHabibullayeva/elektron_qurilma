/**
 * Extracts the YouTube video ID from various types of YouTube URLs.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

/**
 * Returns an embeddable YouTube URL from a standard YouTube URL.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeId(url)
  if (!videoId) return null
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Checks if a URL is a YouTube URL.
 */
export function isYouTubeUrl(url: string): boolean {
  return !!getYouTubeId(url)
}
