/**
 * VideoViewportController - Handles viewport-based video playback
 * Automatically plays videos when they enter the viewport and pauses when they leave
 */

export class VideoViewportController {
  private observer!: IntersectionObserver;
  private videos: NodeListOf<HTMLVideoElement>;

  constructor(sectionSelector: string = ".image-with-text-section") {
    this.videos = document.querySelectorAll(`${sectionSelector} video`);
    this.initializeObserver();
    this.observeVideos();
  }

  private initializeObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;

          if (entry.isIntersecting) {
            // Video entered viewport - play
            this.playVideo(video);
          } else {
            // Video left viewport - pause
            this.pauseVideo(video);
          }
        });
      },
      {
        threshold: 0.5, // Video needs to be 50% visible
      }
    );
  }

  private playVideo(video: HTMLVideoElement): void {
    video.play().catch((error) => {
      console.warn("Video playback failed:", error);
    });
  }

  private pauseVideo(video: HTMLVideoElement): void {
    video.pause();
  }

  private observeVideos(): void {
    this.videos.forEach((video) => {
      this.observer.observe(video);
    });
  }

  /**
   * Cleanup method to disconnect observer
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Static method to initialize the controller when DOM is ready
   */
  static init(sectionSelector?: string): VideoViewportController {
    return new VideoViewportController(sectionSelector);
  }
}

// Note: Initialization is handled in theme.ts
