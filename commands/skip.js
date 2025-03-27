export async function skipCommand(message) {
    const queue = message.client.player.nodes.get(message.guild.id);
    if (!queue || !queue.currentTrack) return message.channel.send('❌ No music is playing.');

    queue.node.skip();
    message.channel.send('⏭️ Skipped the track.');
}
