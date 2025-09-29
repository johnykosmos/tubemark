
/**
 * Background script that handles all the data layer services.
 *
 * Listens for messages from content scripts or popup, updates extension
 * storage, and responds with a standardized object:
 *   { success: boolean, data?: any, error?: string }
 *
 * Message types:
 *   - NEW_VIDEO     → Save a new video entry
 *   - UPDATE_VIDEO  → Update playback time for a video
 *   - CHECK_VIDEO   → Check if video exists in storage and return its time
 *   - REMOVE_VIDEO  → Remove a video or the whole entry if got no marks
 *   - MARK_VIDEO    → Add a timestamp mark to a video
 *   - REMOVE_MARK   → Remove a timestamp mark or delete the whole entry if empty
 *
 * Data layout: 
 * {
 *     "videos": {
 *        "VIDEO_ID_1": {
 *            "id": string           // YouTube video ID
 *            "title": string        // video title (or empty if unknown)
 *            "time": number         // last watched timestamp in seconds; 
 *                                   // -1 if marked removed
 *            "duration": number     // video duration in seconds
 *            "timestamps": [        // array of marks saved for this video
 *                {
 *                   "title":string  // mark title
 *                   "time": number  // timestamp in seconds
 *                },
 *                ...
 *            ]
 *        },
 *        "VIDEO_ID_2": { ... }
 *    }
 *}
*/

browser.runtime.onMessage.addListener((message, _) => {
    return browser.storage.local.get("videos").then((data) => {
        const videos = data.videos || {};

        switch (message.type) {
            /**
             * Add a new video entry to storage.
             * If video already exists, keep its timestamps.
             */
            case "NEW_VIDEO":
                videos[message.id] = {
                    id: message.id,
                    title: message.title,
                    time: message.time || 0,
                    timestamps: videos[message.id]?.timestamps || [],
                    duration: message.duration ?? 0
                };
                return browser.storage.local.set({ videos }).then(() => {
                    return { success: true, data: null };
                });

            /**
             * Update the saved playback time for an existing video.
             */
            case "UPDATE_VIDEO":
                videos[message.id].time = message.time || 0;
                return browser.storage.local.set({ videos }).then(() => {
                    return { success: true, data: null };
                });

            /**
             * Check if a video exists in storage and is not marked removed.
             * Returns its last saved playback time if available.
             */
            case "CHECK_VIDEO":
                const videoExist = (message.id in videos && videos[message.id].time !== -1); 
                return {
                    success: videoExist,
                    data: videoExist ? { time: videos[message.id].time } : null
                };

            /**
             * Remove a video from storage:
             *  - If it has a time, mark as removed (time = -1)
             *  - If it has no timestamps, delete entry entirely
             */
            case "REMOVE_VIDEO":
                if (videos[message.id]?.time !== -1) {
                    videos[message.id].time = -1;
                } else if (videos[message.id]?.timestamps.length === 0) {
                    delete videos[message.id]; 
                }
                return browser.storage.local.set({ videos }).then(() => {
                    return { success: true, data: null };
                });

            /**
             * Add a new timestamp mark to a video.
             * If the video doesn’t exist yet, create an entry for it.
             */
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
                return browser.storage.local.set({ videos }).then(() => {
                    return { success: true, data: null };
                });

            /**
             * Remove a timestamp mark from a video.
             * If no marks remain and video is also removed, delete it entirely.
             */
            case "REMOVE_MARK": 
                if (videos[message.id]?.timestamps.length !== 0) {
                    const timestampId = videos[message.id].timestamps
                        .indexOf(message.timestamp);
                    videos[message.id].timestamps.splice(timestampId, 1);
                } else if (videos[message.id]?.time !== -1) {
                    delete videos[message.id];
                }
                return browser.storage.local.set({ videos }).then(() => {
                    return { success: true, data: null };
                });
        }
    }).catch(err => {
        // Catch unexpected errors and return structured failure
        return { success: false, error: err.message };
    });
});

