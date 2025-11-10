/**
 * Content script injected into YouTube video pages.
 *
 * Responsibilities:
 *  - Add a control bar with:
 *      - Mark button → save timestamped moments
 *      - Tracking switch → save and track current video + playback time
 *  - Open a popup to name timestamp marks
 *  - Track playback position every 10s while tracking is active
 *  - Restore saved video state when revisiting
 *  - Hide controls in fullscreen mode and on pages with no videos
 *  - Detect video changes via MutationObserver
 */

let lastVideoId = null;
let currentVideoId = null;
let intervalId = null;
let alreadySavedVideo = false;
let checkbox;

/**
 * Creates and injects the popup for saving timestamp marks.
 * Popup contains:
 *  - Header
 *  - Input for custom mark title
 *  - Cancel / Save buttons
 */
function createMarkPopup() {
    const popup = document.createElement("div");
    popup.id = "mark-popup";
    popup.className = "popup";

    const header = document.createElement("h2");
    header.textContent = "Save your mark with a title.";
    popup.appendChild(header);

    const input = document.createElement("input");
    popup.appendChild(input);

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "action-buttons"; 

    // Cancel button hides the popup
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
        popup.classList.add("hidden");
    });

    // Save button sends a MARK_VIDEO message
    const saveBtn = document.createElement("button");
    saveBtn.className = "save";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
        const video = document.querySelector("video");
        const timestamp = video ? video.currentTime : 0;
        let title = input.value.trim();

        // Set default title if nothing typed
        if (title === "") {
            title = "Marked Moment in " + document.title.replace(" - YouTube", "");      
        }

        browser.runtime.sendMessage({
            type: "MARK_VIDEO",
            id: currentVideoId,
            title: title,
            time: timestamp,
            duration: video ? video.duration : 0
        }).then((response) => {
            if (response.success) {
                popup.classList.add("hidden");
                input.value = "";
            }
        });
    });

    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(saveBtn);
    popup.appendChild(buttonsDiv);
    document.body.appendChild(popup);
}

/**
 * Opens the mark popup, or creates it if it doesn’t exist yet.
 */
function openMarkPopup() {
    const popup = document.getElementById("mark-popup");
    if (!popup) {
        createMarkPopup();
    } else {
        popup.classList.remove("hidden");
    }
}

/**
 * Toggles tracking (saving playback progress every 10s).
 * - When ON: starts periodic updates to background
 * - When OFF: stops updates and removes video entry
 */
function updateTrackerSwitch() {
    const status = document.getElementById("trackingStatus");
    const tracking = checkbox.checked;

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    if (tracking) {
        status.textContent = "Tracking ON";
        const videoTitle = document.title.replace(" - YouTube", "");

        // Save video entry once at start
        if (!alreadySavedVideo) {
            waitForVideo().then((video) => {
                browser.runtime.sendMessage({
                    type: "NEW_VIDEO",
                    id: currentVideoId,
                    title: videoTitle,
                    time: video ? video.currentTime : 0,
                    duration: video ? video.duration : 0
                });
            });
        }

        // Periodically update playback position every 10s
        intervalId = setInterval(() => {
            const video = document.querySelector("video");
            // If ended - stop tracking
            if (video.currentTime !== video.duration) {
                browser.runtime.sendMessage({
                    type: "UPDATE_VIDEO",
                    id: currentVideoId,
                    time: (video) ? video.currentTime : 0
                });
            } else {
                browser.runtime.sendMessage({
                    type: "REMOVE_VIDEO",
                    id: currentVideoId
                }).then((response) => {
                    if (response.success) {
                        status.textContent = "Tracking OFF";
                        checkbox.checked = false;
                        updateTrackerSwitch();
                    }
                });
            }
        }, 10000);

    } else {
        // Stop tracking → remove video
        browser.runtime.sendMessage({
            type: "REMOVE_VIDEO",
            id: currentVideoId
        }).then((response) => {
            if (response.success) {
                status.textContent = "Tracking OFF";
            }
        });
    }
}

/**
 * Creates and injects the floating controls UI:
 *  - ⭐ Mark button
 *  - Tracking switch (toggle + status label)
 *
 * @returns {HTMLElement} wrapper element
 */
function createControls() {
    if (document.getElementById("controlWrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "controlWrapper";
    wrapper.id = "controlWrapper";
    wrapper.style.display = "none";

    // ⭐ Mark button
    const markButton = document.createElement("button");
    markButton.className = "mark-button";
    markButton.textContent = "⭐ Mark";
    markButton.onclick = openMarkPopup;

    // Tracking switch UI
    const switchWrapper = document.createElement("div");
    switchWrapper.id = "trackingSwitchWrapper";

    checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "trackingSwitch";
    checkbox.onchange = updateTrackerSwitch;

    const slider = document.createElement("span");
    slider.className = "slider";

    const status = document.createElement("span");
    status.id = "trackingStatus";
    status.textContent = "Tracking OFF";

    const label = document.createElement("label");
    label.className = "switch";
    label.appendChild(checkbox);
    label.appendChild(slider);

    switchWrapper.appendChild(label);
    switchWrapper.appendChild(status);

    wrapper.appendChild(markButton);
    wrapper.appendChild(switchWrapper);

    document.body.appendChild(wrapper);

    return wrapper;
}

/**
 * Waits until a <video> element appears in the DOM.
 * Used because YouTube dynamically replaces video elements.
 *
 * @param {number} interval - Polling interval in ms
 * @param {number} maxTimeout - Max total wait time in ms
 * @returns {Promise<HTMLVideoElement|null>}
 */
function waitForVideo(interval = 500, maxTimeout = 10000) {
    return new Promise((resolve) => {
        let passedIntervals = 0;
        const waitId = setInterval(() => {
            const video = document.querySelector("video");
            if (video) {
                clearInterval(waitId);
                resolve(video);
            } else {
                if (maxTimeout < passedIntervals) {
                    clearInterval(waitId);
                    resolve(null);
                }
                passedIntervals += interval;
            }
        }, interval);
    });
}

// Inject controls into the page
const wrapper = createControls();

/**
 * Hide controls in fullscreen mode, restore them otherwise.
 */
document.addEventListener("fullscreenchange", () => {
    if (wrapper && document.fullscreenElement) {
        wrapper.style.visibility = "hidden";
    } else {
        wrapper.style.visibility = "visible";
    }
});

/**
 * Observe changes in <title> → YouTube navigation without full reload.
 * When video ID changes:
 *  - Reset tracking interval
 *  - Show/hide controls
 *  - Ask background if video is already saved
 *  - Restore saved playback position if available
 */
const observer = new MutationObserver(() => {
    const params = new URLSearchParams(window.location.search);
    currentVideoId = params.get("v");

    if (lastVideoId !== currentVideoId) {
        lastVideoId = currentVideoId;

        // Clear old interval if switching videos
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        // If not a video page → hide controls
        if (!currentVideoId) {
            wrapper.style.display = "none"; 
            return;
        } else {
            wrapper.style.display = "";       
        }

        // Ask background whether this video is already tracked
        browser.runtime.sendMessage({
            type: "CHECK_VIDEO",
            id: currentVideoId
        }).then((response) => {
            if (response?.success && response.data.time !== -1) {
                alreadySavedVideo = true;
                checkbox.checked = true;

                // Restore saved playback time if it is
                waitForVideo().then((video) => {
                    if (video) {
                        video.currentTime = response.data.time;
                    } 
                });
            } else {
                alreadySavedVideo = false;
                checkbox.checked = false;
            }

            // Start/stop tracking according to checkbox state
            updateTrackerSwitch();
        });
    }
});

// Observe <title> changes (single-page navigation)
observer.observe(document.querySelector("title"), {
    childList: true,
});

