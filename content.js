
let lastVideoId = null;

const observer = new MutationObserver(() => {
    const params = new URLSearchParams(window.location.search);
    const currentVideoId = params.get("v");
    if (lastVideoId !== currentVideoId) {
        lastVideoId = currentVideoId;
        console.log("Detected video change to id:", currentVideoId);

        const video = document.querySelector("video");
        const videoTitle = document.title.replace(" - YouTube", "");
        const currentTime = video.currentTime;
        browser.runtime.sendMessage({
            type: "NEW_VIDEO",
            id: currentVideoId,
            title: videoTitle,
            time: currentTime
        });

    }
});

observer.observe(document, {
    childList: true,
    subtree: true
});
