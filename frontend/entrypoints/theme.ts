import "vite/modulepreload-polyfill";

import "@/components/header/HeaderNav";
import "@/components/header/CartCounter";
import "@/components/header/CartDrawer";
import "@/components/header/MainNavDrawer";
import { AnnouncementBar } from "@/components/common/AnnouncementBar";
import { VideoViewportController } from "@/components/common/VideoViewportController";

// Initialize components
document.addEventListener("DOMContentLoaded", () => {
  VideoViewportController.init();
  new AnnouncementBar(".announcement-bar", {
    loop: true,
    autoplay: {
      delay: 5000,
    },
  });
});
