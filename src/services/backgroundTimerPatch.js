const PATCH_FLAG = "__trackfitAccurateIntervalsPatched";

if (typeof window !== "undefined" && !window[PATCH_FLAG]) {
  window[PATCH_FLAG] = true;

  const nativeSetInterval = window.setInterval.bind(window);

  window.setInterval = (callback, delay = 0, ...args) => {
    if (delay !== 1000 || typeof callback !== "function") {
      return nativeSetInterval(callback, delay, ...args);
    }

    let lastTick = Date.now();

    return nativeSetInterval(() => {
      const now = Date.now();
      const elapsedTicks = Math.max(1, Math.floor((now - lastTick) / 1000));
      lastTick += elapsedTicks * 1000;

      // Catch up after screen lock/minimisation without allowing an accidental
      // multi-day runaway loop if the tab was abandoned.
      const safeTicks = Math.min(elapsedTicks, 6 * 60 * 60);
      for (let tick = 0; tick < safeTicks; tick += 1) {
        callback(...args);
      }
    }, delay);
  };
}
