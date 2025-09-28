
const tabs = document.querySelectorAll(".tab-button"); 
const tabsContent = document.querySelectorAll(".tab-content");
const videoList = document.getElementById("video-list");
const markList = document.getElementById("marks-list");
let activeTab = -1;

function convertTimeDigit(time) {
    return ((time < 10) ? ":0" : ":") + time;
}

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

function setTabActive(element, index) {
    if (activeTab !== -1) {
        tabs[activeTab].classList.remove("active");
        tabsContent[activeTab].style.display = "none";
    }

    element.classList.add("active"); 
    tabsContent[index].style.display = "block"
    activeTab = index;
}

function createVideoTile(videoData, isMark = false) {
    const thumbUrl = `https://img.youtube.com/vi/${videoData.id}/hqdefault.jpg`;
    const a = document.createElement("a");
    const tile = document.createElement("div");
    tile.className = "video-tile";
    tile.style.backgroundImage = `url(${thumbUrl})`;
    a.href = `https://www.youtube.com/watch?v=${videoData.id}&t=${Math.floor(videoData.time)}`;
    a.target = "_blank";

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

    const title = document.createElement("span");
    title.className = "video-title";
    title.textContent = videoData.title;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-tile-button";
    removeButton.textContent = "-";
    removeButton.onclick = () => {
        if (isMark) {
            browser.runtime.sendMessage({
                type: "REMOVE_MARK",
                id: videoData.id,
                timestamp: videoData.time
            });
        } else {
            browser.runtime.sendMessage({
                type: "REMOVE_VIDEO",
                id: videoData.id
            });
        }
        tile.remove();
    };

    a.appendChild(progressWrapper);
    a.appendChild(title);
    tile.appendChild(a);
    tile.appendChild(removeButton);

    return tile;       
}

if (activeTab === -1) setTabActive(tabs[0], 0);
tabs.forEach((element, index) => {
    element.onclick = () => setTabActive(element, index); 
});

browser.storage.local.get("videos").then((data) => {
    const videos = data.videos || {};
    let hasVideos = false; 
    let hasMarks = false;
    for (let videoId in videos) {
        const video = videos[videoId];
        if (video.time !== -1) {
            videoList.appendChild(createVideoTile(video));
            hasVideos = true;
        }
        video.timestamps.forEach((timestamp) => {
            const markData = {
                id: video.id,
                title: video.title,
                time: timestamp,
                duration: video.duration
            };
            markList.appendChild(createVideoTile(markData, isMark=true));
            hasMarks = true;
        });
    }

    if (!hasVideos) {
        const msg = document.createElement("p");
        msg.className = "empty-message";
        msg.textContent = "No saved videos yet.";
        videoList.appendChild(msg);
    }

    if (!hasMarks) {
        const msg = document.createElement("p");
        msg.className = "empty-message";
        msg.textContent = "No marked moments yet.";
        markList.appendChild(msg);
    }
});

