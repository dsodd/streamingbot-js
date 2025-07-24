const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType
} = require('@discordjs/voice');
const { spawn } = require('child_process');

// Store player states per guild
const players = new Map();
const connections = new Map();
const currentProcesses = new Map();

function getPlayer(guildId) {
    if (!players.has(guildId)) {
        const player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play }
        });
        players.set(guildId, player);
    }
    return players.get(guildId);
}

function getConnection(guildId) {
    return connections.get(guildId);
}

function setConnection(guildId, connection) {
    connections.set(guildId, connection);
}

function getCurrentProcesses(guildId) {
    if (!currentProcesses.has(guildId)) {
        currentProcesses.set(guildId, { ytProcess: null, ffmpegProcess: null });
    }
    return currentProcesses.get(guildId);
}

function setCurrentProcesses(guildId, ytProcess, ffmpegProcess) {
    currentProcesses.set(guildId, { ytProcess, ffmpegProcess });
}

function clearCurrentProcesses(guildId) {
    const processes = getCurrentProcesses(guildId);
    if (processes.ytProcess) {
        processes.ytProcess.kill();
    }
    if (processes.ffmpegProcess) {
        processes.ffmpegProcess.kill();
    }
    currentProcesses.set(guildId, { ytProcess: null, ffmpegProcess: null });
}

function createStream(videoUrl) {
    const ytProcess = spawn('yt-dlp', [
        '-f', 'bestaudio',
        '-o', '-',
        '--quiet',
        '--no-warnings',
        '--no-part', 
        videoUrl
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    const ffmpegProcess = spawn('ffmpeg', [
        '-i', 'pipe:0',
        '-vn',
        '-map', '0:a:0',
        '-loglevel', 'warning',
        '-c:a', 'libopus',
        '-b:a', '96k',
        '-f', 'ogg',
        'pipe:1'
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    ytProcess.stdout.pipe(ffmpegProcess.stdin);

    return { ytProcess, ffmpegProcess, stream: ffmpegProcess.stdout };
}

function createVoiceConnection(voiceChannel) {
    return joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
}

function cleanup(guildId) {
    clearCurrentProcesses(guildId);
    const connection = getConnection(guildId);
    if (connection) {
        connection.destroy();
        connections.delete(guildId);
    }
    const player = getPlayer(guildId);
    if (player) {
        player.stop();
        players.delete(guildId);
    }
}

module.exports = {
    getPlayer,
    getConnection,
    setConnection,
    getCurrentProcesses,
    setCurrentProcesses,
    clearCurrentProcesses,
    createStream,
    createVoiceConnection,
    cleanup
}; 