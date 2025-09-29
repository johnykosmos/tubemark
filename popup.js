/**
 * Popup script for the extension.
 *
 * Responsibilities:
 *  - Manage tab switching (to distinct Videos and Marks)
 *  - Render saved videos and timestamp marks from storage
 *  - Allow removing videos or marks (updates background state via messages)
 *  - Show an empty message if no items exist in either marks or videos
 */

const tabs = document.querySelectorAll(".tab-button"); 
const tabsContent = document.querySelectorAll(".tab-content");
const videoList = document.getElementById("video-list");
const markList = document.getElementById("marks-list");
let activeTab = -1; // starting index

/**
 * Converts single time unit into digital format (:00).
 */
function convertTimeDigit(time) {
    return ((time < 10) ? ":0" : ":") + time;
}

/**
 * Converts seconds into a human-friendly time string (hh:mm:ss or mm:ss).
 */
function getFancyTimeString(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    let timeString = "";
    if (time >= 3600) {
        const hours = Math.floor(time / 3600);
        timeString = hours + convertTimeDigit(minutes % 60); 
    } else {
        timeString = minutes;
    }
    return timeString + convertTimeDigit(seconds);
}

/**
 * Switches the active tab in the popup UI.
 * @param {HTMLElement} element - The clicked tab button
 * @param {number} index - The tab index to activate
 */
function setTabActive(element, index) {
    if (activeTab !== -1) {
        tabs[activeTab].classList.remove("active");
        tabsContent[activeTab].style.display = "none";
    }
    element.classList.add("active"); 
    tabsContent[index].style.display = "block"
    activeTab = index;
}

/**
 * Updates the visibility of the "empty list" message.
 * Hides it when there are tiles in the list, shows it otherwise.
 */
function updateListEmptyText(list) {
    const emptyMsg = list.querySelector(".empty-message");
    if (list.querySelector(".video-tile")) {
        emptyMsg.classList.add("hidden"); 
    } else {
        emptyMsg.classList.remove("hidden");
    }
}

/**
 * Creates a video/mark tile DOM element with thumbnail, progress bar, title, and remove button.
 *
 * @param {Object} videoData - The video or mark data
 * @param {string} videoData.id - YouTube video ID
 * @param {string} videoData.title - Video or timestamp title
 * @param {number} videoData.time - Saved playback position or mark time
 * @param {number} videoData.duration - Full video duration
 * @param {boolean} [isMark=false] - Whether this tile represents a timestamp mark instead of a full video
 *
 * @returns {HTMLElement} - The constructed tile element
 */
function createVideoTile(videoData, isMark = false) {
    const thumbUrl = `https://img.youtube.com/vi/${videoData.id}/hqdefault.jpg`;
    const a = document.createElement("a");
    const tile = document.createElement("div");
    tile.className = "video-tile";
    tile.style.backgroundImage = `url(${thumbUrl})`;
    a.href = `https://www.youtube.com/watch?v=${videoData.id}&t=${Math.floor(videoData.time)}`;
    a.target = "_blank";

    // Progress bar and time display
    const progressWrapper = document.createElement("div");
    progressWrapper.className = "progress-wrapper";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    const fillPercent = videoData.duration ? videoData.time / videoData.duration * 100 : 0;
    progressFill.style.width = fillPercent + "%";
    progressBar.appendChild(progressFill);

    const time = document.createElement("span");
    time.className = "video-time";
    time.textContent = getFancyTimeString(videoData.time);

    progressWrapper.appendChild(progressBar);
    progressWrapper.appendChild(time);

    // Title text
    const title = document.createElement("span");
    title.className = "video-title";
    title.textContent = videoData.title;

    // Remove button
    const removeButton = document.createElement("button");
    removeButton.className = "remove-tile-button";
    removeButton.textContent = "-";
    removeButton.onclick = () => {
        if (isMark) {
            // Ask background to remove mark
            browser.runtime.sendMessage({
                type: "REMOVE_MARK",
                id: videoData.id,
                timestamp: videoData.time
            }).then((response) => {
                if (response.success) {
                    updateListEmptyText(markList)
                }
            });
        } else {
            // Ask background to remove video
            browser.runtime.sendMessage({
                type: "REMOVE_VIDEO",
                id: videoData.id
            }).then((response) => {
                if (response.success) {
                    updateListEmptyText(videoList)
                }
            });
        }
        // Remove tile from DOM
        tile.remove();
    };

    a.appendChild(progressWrapper);
    a.appendChild(title);
    tile.appendChild(a);
    tile.appendChild(removeButton);

    return tile;       
}

// Initialize first tab as active
if (activeTab === -1) setTabActive(tabs[0], 0);

// Tab click handlers
tabs.forEach((element, index) => {
    element.onclick = () => setTabActive(element, index); 
});

/**
 * Load saved videos and marks from storage, build their tiles,
 * and append them to the appropriate lists in the popup.
 */
browser.storage.local.get("videos").then((data) => {
    const videos = data.videos || {};
    for (let videoId in videos) {
        const video = videos[videoId];
        if (video.time !== -1) {
            videoList.appendChild(createVideoTile(video));
        }
        video.timestamps.forEach((timestamp) => {
            const markData = {
                id: video.id,
                title: timestamp.title,
                time: timestamp.time,
                duration: video.duration
            };
            markList.appendChild(createVideoTile(markData, true));
        });
    }

    // Adjust empty-message if there is no data
    updateListEmptyText(videoList);
    updateListEmptyText(markList);
});

