const { EmbedBuilder } = require('discord.js');

function createEmbed(type, message, videoInfo = null) {
    let color;

    switch (type) {
        case 'success': color = '#57F287'; break;
        case 'error': color = '#ED4245'; break;
        case 'info': color = '#5865F2'; break;
        default: color = '#FFFFFF';
    }

    const embed = new EmbedBuilder().setColor(color);

    if (videoInfo) {
        // Extract video ID from URL
        const videoId = videoInfo.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        
        if (videoId) {
            embed
                .setTitle(videoInfo.title)
                .setDescription(`Uploaded by: ${videoInfo.channelTitle || 'Unknown'}`)
                //.setThumbnail(`https://i.ytimg.com/vi/${videoId}/hq720.jpg`)
                .setURL(videoInfo.url)
                .setImage(`https://i.ytimg.com/vi/${videoId}/hq720.jpg`);
        }
    } else {
        embed.setDescription(message);
    }

    return embed;
}

module.exports = { createEmbed };
