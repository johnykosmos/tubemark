

browser.runtime.onMessage.addListener((message, _) => {
    return browser.storage.local.get("videos").then((data) => {
        const videos = data.videos || {};
        switch (message.type) {
            case "NEW_VIDEO":
                videos[message.id] = {
                    id: message.id,
                    title: message.title,
                    time: message.time || 0,
                    timestamps: videos[message.id]?.timestamps || [],
                    duration: message.duration ?? 0
                };
                return browser.storage.local.set({videos: videos}).then(() => {
                    return { success: true, data: null };
                });
            case "UPDATE_VIDEO":
                videos[message.id].time = message.time || 0;
                return browser.storage.local.set({videos: videos}).then(() => {
                    return { success: true, data: null };
                });
            case "CHECK_VIDEO":
                const videoExist = (message.id in videos && videos[message.id].time !== -1); 
                return { success: videoExist, data: videoExist ? {time: videos[message.id].time} : null };
            case "REMOVE_VIDEO":
                if (videos[message.id]?.time !== -1) {
                    videos[message.id].time = -1;
                } else if (videos[message.id]?.timestamps.length === 0) {
                    delete videos[message.id]; 
                }
                return browser.storage.local.set({videos: videos}).then(() => {
                    return { success: true, data: null };
                });
            case "MARK_VIDEO":
                if (!videos[message.id]) {
                    videos[message.id] = {
                        id: message.id,
                        title: "",
                        time: -1,
                        timestamps: [],
                        duration: message.duration ?? 0
                    };
                }
                videos[message.id].timestamps.push({
                    title: message.title,
                    time: message.time || 0
                });
                return browser.storage.local.set({videos: videos}).then(() => {
                    return { success: true, data: null };
                });;
            case "REMOVE_MARK": 
                if (videos[message.id]?.timestamps.length !== 0) {
                    const timestampId = videos[message.id].timestamps
                        .indexOf(message.timestamp);
                    videos[message.id].timestamps.splice(timestampId, 1);
                } else if (videos[message.id]?.time !== -1) {
                    delete videos[message.id];
                }
                return browser.storage.local.set({videos: videos}).then(() => {
                    return { success: true, data: null };
                });;
        }
    }).catch(err => {
        return { success: false, error: err.message };
    });
});

