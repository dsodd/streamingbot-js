export async function resumeCommand(message) {
    const queue = message.client.player.nodes.get(message.guild.id);
    if (!queue || !queue.node.isPaused()) return message.channel.send('❌ No music is paused.');

    queue.node.resume();
    message.channel.send('▶️ Resumed the music.');
}
