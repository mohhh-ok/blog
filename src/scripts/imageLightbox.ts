import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

export const initImageLightbox = () => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: ".prose, .hero-image",
    children: "img",
    pswpModule: () => import("photoswipe"),
    bgOpacity: 0.92,
    wheelToZoom: true,
    initialZoomLevel: "fit",
    secondaryZoomLevel: 2,
    maxZoomLevel: 8,
  });

  const isSvgUrl = (src: string) => {
    try {
      const decoded = decodeURIComponent(src);
      return /\.svg([?#&]|$)/i.test(decoded) || /[?&]f=svg\b/i.test(src);
    } catch {
      return /[?&]f=svg\b/i.test(src);
    }
  };

  lightbox.addFilter("domItemData", (itemData, element) => {
    if (element instanceof HTMLImageElement) {
      const src = element.currentSrc || element.src;
      const nw = element.naturalWidth;
      const nh = element.naturalHeight;
      const cw = element.clientWidth || 800;
      const ch = element.clientHeight || 600;
      const isSvg = isSvgUrl(src);
      let w: number;
      let h: number;
      if (isSvg || !nw || !nh) {
        const aspect = (nw && nh ? nw / nh : cw / ch) || 4 / 3;
        w = 4000;
        h = Math.round(w / aspect);
      } else {
        w = nw;
        h = nh;
      }
      itemData.src = src;
      itemData.width = w;
      itemData.height = h;
      itemData.msrc = src;
      itemData.alt = element.alt;
    }
    return itemData;
  });

  lightbox.init();
};
