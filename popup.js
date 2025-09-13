
const videoList = document.getElementById("video-list");

function getFancyTimeString(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return (minutes) + ((seconds < 10) ? ":0" : ":") + seconds % 60;
}

browser.storage.local.get("videos").then((data) => {
    const videos = data.videos || {};
    for (let videoId in videos) {
        const video = videos[videoId];
        const a = document.createElement("a");
        const videoMark = document.createElement("p");
        a.href = `https://www.youtube.com/watch?v=${video.id}&t=${Math.floor(video.time)}`;
        a.target = "_blank";
        a.textContent = video.title + "    " + getFancyTimeString(video.time);
        videoMark.appendChild(a);
        videoList.appendChild(videoMark);       
    }
});

