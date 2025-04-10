const axios = require('axios');
const { google } = require('googleapis');
require('dotenv').config();

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

async function getYoutubeVideo(query) {
    try {
        const response = await youtube.search.list({
            q: query,
            part: 'snippet',
            maxResults: 1,
            type: 'video'
        });

        if (!response.data.items.length) return null;

        const video = response.data.items[0];
        return {
            title: video.snippet.title,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`
        };
    } catch (error) {
        console.error('❌ YouTube API Error:', error);
        return null;
    }
}

async function getYoutubePlaylist(playlistUrl) {
    try {
        const playlistId = new URL(playlistUrl).searchParams.get('list');
        if (!playlistId) return [];

        const response = await youtube.playlistItems.list({
            playlistId,
            part: 'snippet',
            maxResults: 20
        });

        return response.data.items.map(item => ({
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
        }));
    } catch (error) {
        console.error('❌ YouTube API Playlist Error:', error);
        return [];
    }
}

module.exports = { getYoutubeVideo, getYoutubePlaylist };
