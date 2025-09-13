
let lastVideoId = null;
let intervalId = null;

const observer = new MutationObserver(() => {
    const params = new URLSearchParams(window.location.search);
    const currentVideoId = params.get("v");
    if (lastVideoId !== currentVideoId) {
        if (intervalId) {
            clearInterval(intervalId);
        }

        lastVideoId = currentVideoId;
        console.log("Detected video change to id:", currentVideoId);

        /*browser.runtime.sendMessage({
            type: "CHECK_VIDEO",
            id: currentVideoId,
        });*/


        const video = document.querySelector("video");
        const videoTitle = document.title.replace(" - YouTube", "");
        browser.runtime.sendMessage({
            type: "NEW_VIDEO",
            id: currentVideoId,
            title: videoTitle,
            time: (video) ? video.currentTime : 0

        });

        intervalId = setInterval(() => {
            browser.runtime.sendMessage({
                type: "UPDATE_VIDEO",
                id: currentVideoId,
                time: (video) ? video.currentTime : 0
            });
        } , 10000);
    }
});

observer.observe(document, {
    childList: true,
    subtree: true
});
