const { createEmbed } = require('../utils/embedUtils');
const { getPlayer } = require('../utils/playerManager');
const { AudioPlayerStatus } = require('@discordjs/voice');

function resumeCommand(message) {
    const player = getPlayer(message.guild.id);
    
    if (!player || player.state.status === AudioPlayerStatus.Idle) {
        return message.channel.send({ 
            embeds: [createEmbed('error', '❌ No music is playing.')] 
        });
    }

    if (player.state.status !== AudioPlayerStatus.Paused) {
        return message.channel.send({ 
            embeds: [createEmbed('error', '❌ Music is not paused.')] 
        });
    }

    player.unpause();
    message.channel.send({ 
        embeds: [createEmbed('info', '▶️ Resumed the music.')] 
    });
}

module.exports = { resumeCommand };
