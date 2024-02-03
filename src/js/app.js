import NoSleepScottjgilroy, {
  createNoSleepVideo,
} from "@scottjgilroy/no-sleep";
import NoSleepFork from "@zakj/no-sleep";
import NoSleep from "nosleep.js";

let alternateApi = false;
let noSleep = new NoSleep();

function updateSwitchStatus() {
  let enabled = alternateApi ? noSleep.enabled : noSleep.isEnabled;
  if (noSleep._wakeLock) {
    enabled = !noSleep._wakeLock.released;
  }
  if (enabled) {
    console.log("noSleep is enabled");
    document.getElementById("preventSleepSwitch").checked = true;
    document.getElementById("hero").classList.add("is-success");
    document
      .getElementById("favicon")
      .setAttribute(
        "href",
        "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>☕️</text></svg>"
      );
  } else {
    console.log("noSleep is disabled");
    document.getElementById("preventSleepSwitch").checked = false;
    document.getElementById("hero").classList.remove("is-success");
    document
      .getElementById("favicon")
      .setAttribute(
        "href",
        "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>😴</text></svg>"
      );
  }
}

let updatedTimerId = null;

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("noSleepImplementation")
    .addEventListener("change", async function (event) {
      // Disable before switching
      await noSleep.disable();

      // Dispose of the previous instance if possible
      if (noSleep.dispose) {
        noSleep.dispose();
      }

      const options = {
        videoTitle: "Demo @scottjgilroy/no-sleep",
        onLogEvent: (eventText, level, eventType, eventData) => {
          if (!noSleep.isEnabled) {
            updateSwitchStatus();
          }

          if (eventType === "video timeupdate") {
            // Update the progress bars to visualize the video progress
            const progress = eventData.currentTime;
            const duration = eventData.duration;
            const videoProgress = document.getElementById("videoProgress");

            if (progress > videoProgress.value) {
              videoProgress.classList.add("progress-animated");
            } else {
              videoProgress.classList.remove("progress-animated");
            }
            videoProgress.value = progress;
            videoProgress.max = duration;

            if (eventData.updatedTime !== undefined) {
              const videoProgressUpdated = document.getElementById(
                "videoProgressUpdated"
              );
              videoProgressUpdated.classList.remove("hidden");

              if (updatedTimerId) {
                clearTimeout(updatedTimerId);
              }
              updatedTimerId = setTimeout(() => {
                videoProgressUpdated.classList.add("hidden");
                updatedTimerId = null;
              }, 20);

              videoProgressUpdated.value = progress;
              videoProgressUpdated.max = duration;
            }
          } else {
            console.log("onLogEvent", eventText, level, eventType, eventData);
          }
        },
      };

      alternateApi = false;
      switch (event.target.value) {
        case "original":
          // Switch to the original NoSleep.js implementation
          noSleep = new NoSleep();
          break;
        case "fork":
          // Switch to the @zakj/no-sleep implementation
          noSleep = new NoSleepFork();
          alternateApi = true;
          break;
        case "fork-scottjgilroy":
          // Switch to the @scottjgilroy/no-sleep implementation
          noSleep = new NoSleepScottjgilroy(options);
          break;
        case "fork-scottjgilroy-video":
          // Switch to the @scottjgilroy/no-sleep implementation
          noSleep = createNoSleepVideo(options);
          break;
      }
      noSleep.enable().then(updateSwitchStatus);
    });

  document
    .getElementById("preventSleepSwitch")
    .addEventListener("click", (evt) => {
      const preventSleep = evt.target.checked;

      if (preventSleep) {
        noSleep.enable().then(updateSwitchStatus);
      } else {
        noSleep.disable();
        updateSwitchStatus();
      }
    });

  document.addEventListener("visibilitychange", () => {
    if (noSleep._wakeLock && noSleep._wakeLock.released) {
      // We lost the wakelock because the tab was minimised
      document.getElementById("warning-modal").classList.add("is-active");
    }
  });

  function closeModal($el) {
    $el.classList.remove("is-active");
  }

  function closeAllModals() {
    (document.querySelectorAll(".modal") || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll(".js-modal-trigger") || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);
    console.log($target);

    $trigger.addEventListener("click", () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (
    document.querySelectorAll(
      ".modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button"
    ) || []
  ).forEach(($close) => {
    const $target = $close.closest(".modal");

    $close.addEventListener("click", () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener("keydown", (event) => {
    const e = event || window.event;

    if (e.keyCode === 27) {
      // Escape key
      closeAllModals();
    }
  });

  document
    .getElementById("busyForValue")
    .addEventListener("input", function () {
      // Get the number of seconds from the input field
      const seconds = Number(this.value);

      if (isNaN(seconds)) {
        console.error("Invalid number of seconds");
        return;
      }

      // Update the text to be plural if necessary
      document.getElementById("busyForValueText").textContent =
        seconds === 1 ? "second" : "seconds";
    });

  document
    .getElementById("simulateBusyButton")
    .addEventListener("click", function (event) {
      // Get the number of seconds from the input field
      const seconds = document.getElementById("busyForValue").value;

      console.log("Simulating busy for " + seconds + " seconds");
      const button = event.target;

      // Disable the button and show the spinner
      button.setAttribute("disabled", "disabled");
      button.classList.add("is-loading");

      // Use setTimeout to delay the start of the busy loop
      setTimeout(() => {
        // Start the busy loop
        const end = Date.now() + seconds * 1000;
        while (Date.now() < end) {
          // This will block the main thread, simulating a busy app
        }

        // After the loop, enable the button and hide the spinner
        button.removeAttribute("disabled");
        button.classList.remove("is-loading");
      }, 50);
    });

  let elapsedTime = 0;
  let intervalId = null;

  function startStopwatch() {
    // Clear any existing interval
    if (intervalId !== null) {
      clearInterval(intervalId);
    }

    // Reset the elapsed time to 0
    elapsedTime = 0;

    // Start a new interval
    intervalId = setInterval(() => {
      elapsedTime++;
      document.getElementById("stopwatch").textContent = elapsedTime;
    }, 1000);
  }

  function resetStopwatch() {
    // Reset the elapsed time to 0
    elapsedTime = 0;
    document.getElementById("stopwatch").textContent = elapsedTime;
  }

  // Define the events that should reset the stopwatch
  const userEvents = ["click", "keydown", "mousemove", "touchstart"];

  // Add an event listener for each event
  userEvents.forEach((event) => {
    document.addEventListener(event, resetStopwatch);
  });

  // Start the stopwatch
  startStopwatch();

  noSleep.enable().then(updateSwitchStatus);
});
