const { createEmbed } = require('../utils/embedUtils');
const { cleanup } = require('../utils/playerManager');
const { clearQueue } = require('../utils/queueManager');

function stopCommand(message) {
    if (!message.member.voice.channel) {
        return message.channel.send({ 
            embeds: [createEmbed('error', '❌ You must be in a voice channel to stop the music.')] 
        });
    }

    if (!message.guild.me.voice.channel) {
        return message.channel.send({ 
            embeds: [createEmbed('error', '❌ I am not in a voice channel.')] 
        });
    }

    // Clear the queue
    clearQueue(message.guild.id);
    
    // Cleanup player and connection
    cleanup(message.guild.id);
    
    message.channel.send({ 
        embeds: [createEmbed('info', '⏹️ Music stopped and bot disconnected.')] 
    });
}

module.exports = { stopCommand };
