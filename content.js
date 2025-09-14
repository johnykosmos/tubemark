
let lastVideoId = null;
let currentVideoId = null;
let intervalId = null;

function addTrackerSwitch() {
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


    checkbox.onchange = () => {
        const tracking = checkbox.checked;

        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        if (tracking) {
            status.textContent = "Tracking ON";
            const video = document.querySelector("video");
            const videoTitle = document.title.replace(" - YouTube", "");
            browser.runtime.sendMessage({
                type: "NEW_VIDEO",
                id: currentVideoId,
                title: videoTitle,
                time: video ? video.currentTime : 0
            });

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
    };

    document.body.appendChild(wrapper);
}

document.addEventListener("fullscreenchange", () => {
    const switchElement = document.getElementById("trackingSwitchWrapper");
    if (switchElement && document.fullscreenElement) {
        switchElement.style.visibility = "hidden";
    } else {
        switchElement.style.visibility = "visible";
    }
});

addTrackerSwitch();

const observer = new MutationObserver(() => {
    const params = new URLSearchParams(window.location.search);
    currentVideoId = params.get("v");
    if (lastVideoId !== currentVideoId) {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        lastVideoId = currentVideoId;
        const checkbox = document.getElementById("trackingSwitch");
        const status = document.getElementById("trackingStatus");
        checkbox.checked = false;
        status.textContent = "Tracking OFF";
    }
});

observer.observe(document, {
    childList: true,
    subtree: true
});
