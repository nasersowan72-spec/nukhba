import React, { useEffect, useRef, useState } from "react";
import { detectVideo } from "../lib/video.js";
import { useI18n } from "../i18n/index.jsx";

/**
 * Plays YouTube / Vimeo / Bunny embeds, HLS streams (hls.js outside Safari) and MP4 files.
 * Reports playback position so students resume where they stopped.
 */
export default function VideoPlayer({ url, title, startAt = 0, onPosition, onEnded }) {
  const { t } = useI18n();
  const source = detectVideo(url);
  const videoRef = useRef(null);
  const lastSaved = useRef(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    const video = videoRef.current;
    if (!video || (source.type !== "hls" && source.type !== "file")) return undefined;
    let hls;
    let cancelled = false;
    const seek = () => { if (startAt > 5 && video.duration && startAt < video.duration - 5) video.currentTime = startAt; };
    video.addEventListener("loadedmetadata", seek, { once: true });

    if (source.type === "hls" && !video.canPlayType("application/vnd.apple.mpegurl")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { setError(true); return; }
        hls = new Hls({ enableWorker: true });
        hls.loadSource(source.src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setError(true); });
      });
    } else {
      video.src = source.src;
    }
    return () => { cancelled = true; video.removeEventListener("loadedmetadata", seek); if (hls) hls.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const frame = { aspectRatio: "16 / 9", background: "#000", borderRadius: 20 };

  if (source.type === "empty" || error) {
    return (
      <div className="w-full flex items-center justify-center text-center px-6 mute" style={frame}>
        {source.type === "empty" ? t("learn.noVideo") : t("learn.videoError")}
      </div>
    );
  }

  if (source.embed) {
    return (
      <div className="w-full overflow-hidden" style={frame}>
        <iframe src={source.embed} title={title} className="w-full h-full" style={{ border: 0 }}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden" style={frame}>
      <video
        ref={videoRef} controls playsInline preload="metadata" controlsList="nodownload" className="w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={(e) => {
          const now = e.currentTarget.currentTime;
          if (onPosition && Math.abs(now - lastSaved.current) >= 15) { lastSaved.current = now; onPosition(Math.floor(now)); }
        }}
        onEnded={() => onEnded && onEnded()}
        onError={() => setError(true)}
      />
    </div>
  );
}
