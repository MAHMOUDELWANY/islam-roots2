import React, { useEffect, useRef, useState } from "react";

interface MotionRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}

export const MotionReveal: React.FC<MotionRevealProps> = ({ children, className = "", stagger = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 12% 0px", threshold: 0.06 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const content = stagger
    ? React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        const existingStyle = (child.props as { style?: React.CSSProperties }).style;
        return React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
          style: { ...existingStyle, ["--stagger-index" as string]: index } as React.CSSProperties,
        });
      })
    : children;

  return (
    <div ref={ref} className={`ir-reveal ${stagger ? "ir-stagger" : ""} ${className}`} data-revealed={revealed}>
      {content}
    </div>
  );
};
