const { createEmbed } = require('../utils/embedUtils');
const { getQueueList, getQueueLength } = require('../utils/queueManager');

function queueCommand(message) {
    const queue = getQueueList(message.guild.id);
    
    if (!queue.length) {
        return message.channel.send({ 
            embeds: [createEmbed('info', '📭 The queue is empty!')] 
        });
    }

    // Create a formatted list of songs
    const queueList = queue.map((song, index) => {
        return `${index + 1}. [${song.title}](${song.url}) - ${song.channelTitle}`;
    }).join('\n');

    // Split the queue list into chunks if it's too long (Discord has a 4096 character limit)
    const chunks = [];
    let currentChunk = '';
    const lines = queueList.split('\n');

    for (const line of lines) {
        if ((currentChunk + line + '\n').length > 4096) {
            chunks.push(currentChunk);
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    // Send the first chunk with queue information
    const embed = createEmbed('info', `📋 Current Queue (${getQueueLength(message.guild.id)} songs):\n\n${chunks[0]}`);
    message.channel.send({ embeds: [embed] });

    // Send remaining chunks if any
    for (let i = 1; i < chunks.length; i++) {
        message.channel.send({ 
            embeds: [createEmbed('info', chunks[i])] 
        });
    }
}

module.exports = { queueCommand }; 