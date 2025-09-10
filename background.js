

browser.runtime.onMessage.addListener((message, _) => {
    if (message.type === "NEW_VIDEO") {
        browser.storage.local.get("videos").then((data) => {
            const videos = data.videos || {};
            videos[message.id] = {
                id: message.id,
                title: message.title,
                time: message.currentTime || 0
            };
            browser.storage.local.set({videos: videos});
        });
    }
});

