// Store references to all time elements that need updating
const timeElements = new Map();

// Register a time element for updates
export function registerTimeElement(elementId, timestamp, formatFunction) {
  timeElements.set(elementId, {
    timestamp: new Date(timestamp),
    element: document.getElementById(elementId),
    formatFunction,
  });
}

// Update all registered time elements
export function updateAllTimes() {
  timeElements.forEach((data, id) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = data.formatFunction(data.timestamp);
    } else {
      // Clean up if element no longer exists
      timeElements.delete(id);
    }
  });
}

// Start periodic updates
export function startTimeUpdates() {
  // Update times every minute
  setInterval(updateAllTimes, 60000);
}
