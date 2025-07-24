const { playCommand } = require('../commands/play');
const { queueCommand } = require('../commands/queue');
const { pauseCommand } = require('../commands/pause');
const { resumeCommand } = require('../commands/resume');
const { skipCommand } = require('../commands/skip');
const { stopCommand } = require('../commands/stop');

const prefix = '!';

module.exports = async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    console.log(`📩 Received command: ${command}, Args: ${args.join(' ')}`);

    switch (command) {
        case 'play':
            await playCommand(message, args);
            break;
        case 'queue':
            queueCommand(message);
            break;
        case 'pause':
            pauseCommand(message);
            break;
        case 'resume':
            resumeCommand(message);
            break;
        case 'skip':
            skipCommand(message);
            break;
        case 'stop':
            stopCommand(message);
            break;
    }
};
