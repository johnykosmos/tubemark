

browser.runtime.onMessage.addListener((message, _) => {
    switch (message.type) {
        case "NEW_VIDEO":
            browser.storage.local.get("videos").then((data) => {
                const videos = data.videos || {};
                videos[message.id] = {
                    id: message.id,
                    title: message.title,
                    time: message.time || 0
                };
                browser.storage.local.set({videos: videos});
            });
            break;
        case "UPDATE_VIDEO":
            browser.storage.local.get("videos").then((data) => {
                const videos = data.videos || {};
                videos[message.id].time = message.time || 0;
                browser.storage.local.set({videos: videos});
            });
            break;
        case "REMOVE_VIDEO":
            browser.storage.local.get("videos").then((data) => {
                const videos = data.videos || {};
                delete videos[message.id]; 
                browser.storage.local.set({videos: videos});
            });
            break;
    } 
});

