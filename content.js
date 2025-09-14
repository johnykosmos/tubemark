
let lastVideoId = null;
let intervalId = null;
let switchElement = null;

function addTrackerButton(videoId) {
    if (document.getElementById("trackingSwitchWrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "trackingSwitchWrapper";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "trackingSwitch";

    const slider = document.createElement("span");
    slider.className = "slider";

    const status = document.createElement("span");
    status.id = "trackingStatus";
    status.textContent = "Tracking OFF";

    const label = document.createElement("label");
    label.className = "switch";
    label.appendChild(checkbox);
    label.appendChild(slider);

    wrapper.appendChild(label);
    wrapper.appendChild(status);

    checkbox.addEventListener("change", () => {
        const tracking = checkbox.checked;
        if (tracking) {
            status.textContent = "Tracking ON";
            const video = document.querySelector("video");
            const videoTitle = document.title.replace(" - YouTube", "");
            browser.runtime.sendMessage({
                type: "NEW_VIDEO",
                id: videoId,
                title: videoTitle,
                time: video ? video.currentTime : 0
            });

            intervalId = setInterval(() => {
                browser.runtime.sendMessage({
                    type: "UPDATE_VIDEO",
                    id: videoId,
                    time: (video) ? video.currentTime : 0
                });
            } , 10000);
        } else {
            status.textContent = "Tracking OFF";
            clearInterval(intervalId);
            browser.runtime.sendMessage({
                    type: "REMOVE_VIDEO",
                    id: videoId
                });
            return;
        }
    });

    document.body.appendChild(wrapper);
    return wrapper;
}

// HIDE SWITCH ON FULLSCREEN
document.addEventListener("fullscreenchange", () => {
    if (switchElement && document.fullscreenElement) {
        switchElement.style.visibility = "hidden";
    } else {
        switchElement.style.visibility = "visible";
    }
});

const observer = new MutationObserver(() => {
    const params = new URLSearchParams(window.location.search);
    const currentVideoId = params.get("v");
    if (lastVideoId !== currentVideoId) {
        if (intervalId) {
            clearInterval(intervalId);
        }

        lastVideoId = currentVideoId;
        switchElement = addTrackerButton(currentVideoId);
        console.log("Detected video change to id:", currentVideoId);
    }
});

observer.observe(document, {
    childList: true,
    subtree: true
});
