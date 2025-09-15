

browser.runtime.onMessage.addListener((message, _) => {
    return browser.storage.local.get("videos").then((data) => {
        const videos = data.videos || {};
        switch (message.type) {
            case "NEW_VIDEO":
                videos[message.id] = {
                    id: message.id,
                    title: message.title,
                    time: message.time || 0
                };
                return browser.storage.local.set({videos: videos});
            case "UPDATE_VIDEO":
                videos[message.id].time = message.time || 0;
                return browser.storage.local.set({videos: videos});
            case "CHECK_VIDEO":
                return (message.id in videos) ? 
                    {time: videos[message.id].time} : null;
            case "REMOVE_VIDEO":
                delete videos[message.id]; 
                return browser.storage.local.set({videos: videos});
        } 
    });
});

