'use client';

import { useEffect } from 'react';

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // --- 1. Privacy Cleaner ---
    // Clear storage on every load to prevent tracking
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      } catch {
        // Silent fail
      }
    }

    // --- 2. Anti-Tamper (Keyboard) ---
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // --- 3. Anti-Tamper (Mouse) ---
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // --- 4. DevTools Detection Trap ---
    // If DevTools is open, debugger will pause execution here, annoying the attacker.
    const loop = setInterval(() => {
      const startTime = performance.now();
      debugger; 
      if (performance.now() - startTime > 100) {
        // DevTools detected (execution paused)
        document.body.innerHTML = '<div style="background:black;color:red;height:100vh;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:24px;">SECURITY ALERT: DEVTOOLS DETECTED <br/> SYSTEM LOCKED</div>';
      }
    }, 1000);
    
    // --- 5. Console Wiper ---
    const clearConsole = setInterval(() => {
      console.clear();
      console.log('%c STOP ', 'color: red; font-size: 50px; font-weight: bold;');
      console.log('%c This is a restricted area.', 'font-size: 20px;');
    }, 2000);

    // Initial Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(loop);
      clearInterval(clearConsole);
    };
  }, []);

  return <>{children}</>;
}
