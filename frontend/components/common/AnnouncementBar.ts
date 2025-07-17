import { BaseCarousel } from "./BaseCarousel";

export class AnnouncementBar extends BaseCarousel {
  constructor() {
    super(".js-flickity", {
      cellAlign: "center",
      contain: true,
      pageDots: false,
      autoPlay: true,
      pauseAutoPlayOnHover: true,
      wrapAround: true,
      prevNextButtons: false,
    });

    // Only initialize if the element exists
    const element = document.querySelector(".js-flickity");
    if (element) {
      this.init();
    }
  }
}
