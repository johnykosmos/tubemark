
let lastVideoId = null;
let currentVideoId = null;
let intervalId = null;
let alreadySavedVideo = false;
let checkbox;

function markVideo() {
    const video = document.querySelector("video");
    const videoTitle = document.title.replace(" - YouTube", "");
    browser.runtime.sendMessage({
        type: "MARK_VIDEO",
        id: currentVideoId,
        title: videoTitle,
        time: video ? video.currentTime : 0,
        duration: video ? video.duration : 0
    });
}

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
        intervalId = setInterval(() => {
            const video = document.querySelector("video");
            browser.runtime.sendMessage({
                type: "UPDATE_VIDEO",
                id: currentVideoId,
                time: (video) ? video.currentTime : 0
            });
        } , 10000);
    } else {
        status.textContent = "Tracking OFF";
        browser.runtime.sendMessage({
            type: "REMOVE_VIDEO",
            id: currentVideoId
        });
    }
}

function createControls() {
    if (document.getElementById("controlWrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "controlWrapper";
    wrapper.id = "controlWrapper";
    wrapper.style.display = "none";

    const markButton = document.createElement("button");
    markButton.className = "mark-button";
    markButton.textContent = "⭐ Mark";
    markButton.onclick = markVideo;

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

const wrapper = createControls();

document.addEventListener("fullscreenchange", () => {
    if (wrapper && document.fullscreenElement) {
        wrapper.style.visibility = "hidden";
    } else {
        wrapper.style.visibility = "visible";
    }
});

const observer = new MutationObserver(() => {
    const params = new URLSearchParams(window.location.search);
    currentVideoId = params.get("v");

    if (lastVideoId !== currentVideoId) {
        lastVideoId = currentVideoId;
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        if (!currentVideoId) {
            wrapper.style.display = "none"; 
            return;
        } else {
            wrapper.style.display = "";       
        }

        browser.runtime.sendMessage({
            type: "CHECK_VIDEO",
            id: currentVideoId
        }).then((response) => {
            if (response && response.time !== -1) {
                alreadySavedVideo = true;
                checkbox.checked = true;
                waitForVideo().then((video) => {
                    if (video) {
                        video.currentTime = response.time;
                    } 
                });
            } else {
                alreadySavedVideo = false;
                checkbox.checked = false;
            }
            updateTrackerSwitch();
        });
    }
});

observer.observe(document.querySelector("title"), {
    childList: true,
});
