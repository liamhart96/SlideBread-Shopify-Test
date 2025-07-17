import "vite/modulepreload-polyfill";

import "@/components/header/HeaderNav";
import "@/components/header/CartCounter";
import "@/components/header/CartDrawer";
import "@/components/header/MainNavDrawer";
import { AnnouncementBar } from "@/components/common/AnnouncementBar";

// Initialize components
new AnnouncementBar();
