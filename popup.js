
const videoList = document.getElementById("video-list");

browser.storage.local.get("videos").then((data) => {
    for (let videoId in data.videos) {
        const video = data.videos[videoId];
        const a = document.createElement("a");
        const videoMark = document.createElement("p");
        a.href = `https://www.youtube.com/watch?v=${video.id}`;
        a.target = "_blank";
        a.textContent = video.title;
        videoMark.appendChild(a);
        videoList.appendChild(videoMark);       
    }
});

