const { playCommand } = require('../commands/play');

const prefix = '!';

module.exports = async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    console.log(`📩 Received command: ${command}, Args: ${args.join(' ')}`);

    if (command === 'play') {
        await playCommand(message, args);
    }
};
