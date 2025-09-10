
let lastVideoId = null;

const observer = new MutationObserver(() => {
    const params = new URLSearchParams(window.location.search);
    const currentVideoId = params.get("v");
    if (lastVideoId !== currentVideoId) {
        lastVideoId = currentVideoId;
        console.log("Detected new video of id:", currentVideoId);
    }
});

observer.observe(document, {
    childList: true,
    subtree: true
});
