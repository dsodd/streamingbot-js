const axios = require('axios');
const { google } = require('googleapis');
require('dotenv').config();

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

function detectPlatform(url) {
    if (!url) return 'search';
    
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        if (hostname === 'youtu.be' || hostname === 'www.youtube.com' || hostname === 'music.youtube.com') {
            return 'youtube';
        } else if (hostname === 'open.spotify.com') {
            return 'spotify';
        } else if (hostname === 'soundcloud.com') {
            return 'soundcloud';
        }
    } catch (error) {
        // If URL parsing fails, treat as search query
        return 'search';
    }
    
    return 'search';
}

async function getYoutubeVideo(query) {
    try {
        // If it's a direct YouTube URL, return it directly
        if (query.includes('youtube.com/watch?v=') || query.includes('youtu.be/')) {
            // Get video details using the video ID
            const videoId = query.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
            if (videoId) {
                const response = await youtube.videos.list({
                    id: videoId,
                    part: 'snippet'
                });
                
                if (response.data.items.length > 0) {
                    const video = response.data.items[0];
                    return {
                        title: video.snippet.title,
                        url: query,
                        channelTitle: video.snippet.channelTitle
                    };
                }
            }
            return {
                title: 'YouTube Video',
                url: query,
                channelTitle: 'Unknown'
            };
        }

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
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            channelTitle: video.snippet.channelTitle
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

module.exports = { getYoutubeVideo, getYoutubePlaylist, detectPlatform };
