/** Detects how a lesson video must be played. */
export function detectVideo(url = "") {
  const u = String(url || "").trim();
  if (!u) return { type: "empty" };
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { type: "youtube", embed: `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1` };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (m) return { type: "vimeo", embed: `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}&` : "?"}title=0&byline=0&portrait=0` };
  if (/iframe\.mediadelivery\.net|player\.mediadelivery\.net/.test(u)) return { type: "bunny", embed: u };
  if (/\.m3u8(\?|#|$)/i.test(u)) return { type: "hls", src: u };
  return { type: "file", src: u };
}
