function stopCommand(message) {
    if (!message.member.voice.channel) {
        return message.channel.send('❌ You must be in a voice channel to stop the music.');
    }

    if (!message.guild.me.voice.channel) {
        return message.channel.send('❌ I am not in a voice channel.');
    }

    disconnectBot();
    message.channel.send('⏹️ Music stopped and bot disconnected.');
}

function disconnectBot() {
    if (global.connection) {
        global.connection.destroy();
        global.connection = null;
    }
    if (global.player) {
        global.player.stop();
        global.player = null;
    }
    global.queue = [];
}

module.exports = { stopCommand };
