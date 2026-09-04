'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  motion,
  SpringOptions,
  useMotionValue,
  useSpring,
  AnimatePresence,
  Transition,
  Variant,
} from 'motion/react';

export type CursorProps = {
  children: React.ReactNode;
  className?: string;
  springConfig?: SpringOptions;
  attachToParent?: boolean;
  transition?: Transition;
  variants?: {
    initial: Variant;
    animate: Variant;
    exit: Variant;
  };
  onPositionChange?: (x: number, y: number) => void;
};

export function Cursor({
  children,
  className,
  springConfig,
  attachToParent,
  variants,
  transition,
  onPositionChange,
}: CursorProps) {
  const cursorX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const cursorY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(!attachToParent);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Abaikan kursor custom pada perangkat sentuh (touchscreen)
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    if (!attachToParent) {
      document.body.style.cursor = 'none';
    }

    let isInside = !attachToParent;

    const updatePosition = (e: MouseEvent) => {
      if (!isInside && attachToParent) return;
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      onPositionChange?.(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', updatePosition, { passive: true });

    if (attachToParent) {
      const parent = placeholderRef.current?.parentElement;
      if (parent) {
        parent.style.cursor = 'none';

        const handleMouseEnter = (e: MouseEvent) => {
          isInside = true;
          cursorX.set(e.clientX);
          cursorY.set(e.clientY);
          setIsVisible(true);
        };
        const handleMouseLeave = () => {
          isInside = false;
          setIsVisible(false);
        };

        parent.addEventListener('mouseenter', handleMouseEnter);
        parent.addEventListener('mouseleave', handleMouseLeave);

        return () => {
          parent.style.cursor = '';
          parent.removeEventListener('mouseenter', handleMouseEnter);
          parent.removeEventListener('mouseleave', handleMouseLeave);
          window.removeEventListener('mousemove', updatePosition);
        };
      }
    } else {
      return () => {
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', updatePosition);
      };
    }
    
    return () => {
      window.removeEventListener('mousemove', updatePosition);
    };
  }, [cursorX, cursorY, attachToParent, onPositionChange]);

  const defaultSpring = { stiffness: 500, damping: 28, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig || defaultSpring);
  const cursorYSpring = useSpring(cursorY, springConfig || defaultSpring);

  return (
    <>
      <span ref={placeholderRef} style={{ display: 'none' }} />
      {mounted && createPortal(
        <motion.div
          ref={cursorRef}
          className={className}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            x: cursorXSpring,
            y: cursorYSpring,
            pointerEvents: 'none',
            zIndex: 9999,
            // center the cursor relative to the mouse
            translateX: '-50%',
            translateY: '-50%'
          }}
        >
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={variants}
                transition={transition}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>,
        document.body
      )}
    </>
  );
}
