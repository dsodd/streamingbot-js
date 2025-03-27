const { EmbedBuilder } = require('discord.js');

function createEmbed(type, message) {
    let color;

    switch (type) {
        case 'success': color = '#57F287'; break;
        case 'error': color = '#ED4245'; break;
        case 'info': color = '#5865F2'; break;
        default: color = '#FFFFFF';
    }

    return new EmbedBuilder().setColor(color).setDescription(message);
}

module.exports = { createEmbed };
