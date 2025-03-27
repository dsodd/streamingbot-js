export async function pauseCommand(message) {
    const queue = message.client.player.nodes.get(message.guild.id);
    if (!queue || queue.node.isPaused()) return message.channel.send('❌ No music is playing or already paused.');

    queue.node.pause();
    message.channel.send('⏸️ Paused the music.');
}
