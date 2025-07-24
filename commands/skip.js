const { createEmbed } = require('../utils/embedUtils');
const { getPlayer } = require('../utils/playerManager');
const { getQueueList, removeFromQueue } = require('../utils/queueManager');
const { AudioPlayerStatus } = require('@discordjs/voice');

function skipCommand(message) {
    const player = getPlayer(message.guild.id);
    const queue = getQueueList(message.guild.id);
    
    if (!player || player.state.status === AudioPlayerStatus.Idle) {
        return message.channel.send({ 
            embeds: [createEmbed('error', '❌ No music is playing.')] 
        });
    }

    // Remove the current song from queue
    removeFromQueue(message.guild.id);
    
    // Stop the current playback
    player.stop();
    
    message.channel.send({ 
        embeds: [createEmbed('info', '⏭️ Skipped the current song.')] 
    });
}

module.exports = { skipCommand };
