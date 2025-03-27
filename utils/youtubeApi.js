const axios = require('axios');

async function getYoutubeVideo(query) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const video = response.data.items[0];

        if (!video) return null;

        return {
            title: video.snippet.title,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`
        };
    } catch (error) {
        console.error('❌ YouTube API error:', error.message);
        return null;
    }
}

module.exports = { getYoutubeVideo };
