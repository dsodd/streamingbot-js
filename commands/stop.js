export async function stopCommand(message) {
    const queue = message.client.player.nodes.get(message.guild.id);
    if (!queue) return message.channel.send('❌ No music is playing.');

    queue.delete();
    message.channel.send('⏹️ Music stopped.');
}
