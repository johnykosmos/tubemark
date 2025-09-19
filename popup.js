
const tabs = document.querySelectorAll(".tab-button"); 
const tabsContent = document.querySelectorAll(".tab-content");
const videoList = document.getElementById("video-list");
const markList = document.getElementById("marks-list");
let activeTab = -1;

function getFancyTimeString(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return (minutes) + ((seconds < 10) ? ":0" : ":") + seconds % 60;
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

function createVideoTile(videoData) {
    const thumbUrl = `https://img.youtube.com/vi/${videoData.id}/hqdefault.jpg`;
    const a = document.createElement("a");
    const tile = document.createElement("div");
    tile.className = "video-tile";
    tile.style.backgroundImage = `url(${thumbUrl})`;
    a.href = `https://www.youtube.com/watch?v=${videoData.id}&t=${Math.floor(videoData.time)}`;
    a.target = "_blank";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";

    const fillPercent = videoData.duration ? videoData.time / videoData.duration * 100 : 0;
    progressFill.style.width = fillPercent + "%";
    progressBar.appendChild(progressFill);

    const title = document.createElement("span");
    title.className = "video-title";
    title.textContent = videoData.title;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-tile-button";
    removeButton.textContent = "-";

    a.appendChild(progressBar);
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
    for (let videoId in videos) {
        const video = videos[videoId];
        videoList.appendChild(createVideoTile(video));

        video.timestamps.forEach((timestamp) => {
            const markData = {
                id: video.id,
                title: video.title,
                time: timestamp,
                duration: video.duration
            };
            markList.appendChild(createVideoTile(markData));
        });
    }
});

