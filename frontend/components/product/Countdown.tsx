import { useEffect, useState } from "react";
import React from "react";
import { createRoot, Root } from "react-dom/client";

declare global {
  interface Window {
    ReactDOM: {
      render(element: React.ReactNode, container: Element): void;
      unmountComponentAtNode(container: Element | null): void;
    };
  }
}

interface CountdownProps {
  endDate: string;
}

function Countdown({ endDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const distance = end - now;

    if (distance < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    };
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        return null;
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      };
    };

    // Initial calculation
    const newTimeLeft = calculateTimeLeft();
    if (newTimeLeft) {
      setTimeLeft(newTimeLeft);
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (!newTimeLeft) {
        clearInterval(timer);
        return;
      }
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const padNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div>
      <div className="mb-3 text-center font-medium">Limited time offer:</div>
      <div className="flex justify-center space-x-4">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{padNumber(timeLeft.days)}</span>
          <span className="text-xs text-gray-500">Days</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{padNumber(timeLeft.hours)}</span>
          <span className="text-xs text-gray-500">Hours</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{padNumber(timeLeft.minutes)}</span>
          <span className="text-xs text-gray-500">Minutes</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">{padNumber(timeLeft.seconds)}</span>
          <span className="text-xs text-gray-500">Seconds</span>
        </div>
      </div>
    </div>
  );
}

class CountdownElement extends HTMLElement {
  private root: Root | null = null;

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
    }
  }

  connectedCallback() {
    const endDate = this.getAttribute("end-date");
    if (!endDate) return;

    const container = document.createElement("div");
    this.appendChild(container);

    this.root = createRoot(container);
    this.root.render(<Countdown endDate={endDate} />);
  }
}

customElements.define("countdown-timer", CountdownElement);
