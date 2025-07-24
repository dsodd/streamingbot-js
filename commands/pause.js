const { createEmbed } = require('../utils/embedUtils');
const { getPlayer } = require('../utils/playerManager');
const { AudioPlayerStatus } = require('@discordjs/voice');

function pauseCommand(message) {
    const player = getPlayer(message.guild.id);
    
    if (!player || player.state.status === AudioPlayerStatus.Idle) {
        return message.channel.send({ 
            embeds: [createEmbed('error', '❌ No music is playing.')] 
        });
    }

    if (player.state.status === AudioPlayerStatus.Paused) {
        return message.channel.send({ 
            embeds: [createEmbed('error', '❌ Music is already paused.')] 
        });
    }

    player.pause();
    message.channel.send({ 
        embeds: [createEmbed('info', '⏸️ Paused the music.')] 
    });
}

module.exports = { pauseCommand };
