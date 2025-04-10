const { createEmbed } = require('../utils/embedTemplate');
const { getYoutubeVideo, getYoutubePlaylist } = require('../utils/youtubeApi');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType
} = require('@discordjs/voice');
const { spawn } = require('child_process');

let queue = [];
let connection = null;
let player = null;
let inactivityTimeout = null;

async function playCommand(message, args) {
    if (!args.length) {
        return message.channel.send('❌ You need to provide a YouTube link or search query.');
    }

    const query = args.join(' ');

    let videos = [];
    if (query.includes('playlist?list=')) {
        videos = await getYoutubePlaylist(query);
        if (!videos.length) {
            return message.channel.send('❌ No videos found in this playlist.');
        }
        message.channel.send(`📜 Playlist found! Adding ${videos.length} songs to the queue.`);
    } else {
        const video = await getYoutubeVideo(query);
        if (!video) {
            return message.channel.send('❌ No video found for your query.');
        }
        videos.push(video);
    }

    queue.push(...videos);

    if (!player) {
        playNextSong(message);
    }
}

function playNextSong(message) {
    if (queue.length === 0) {
        startInactivityTimer();
        return;
    }

    clearInactivityTimer();

    const video = queue.shift();
    console.log(`🎵 Fetching stream for: ${video.url}`);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.channel.send('❌ You must be in a voice channel to play music.');
    }

    let ytProcess, ffmpegProcess;

    try {
        ytProcess = spawn('yt-dlp', [
            '-f', 'bestaudio',
            '-o', '-',
            '--quiet',
            '--no-warnings',
            video.url
        ], { stdio: ['ignore', 'pipe', 'pipe'] });

        ytProcess.stderr.on('data', (data) => console.error(`🔴 yt-dlp ERROR: ${data}`));

        ffmpegProcess = spawn('ffmpeg', [
            '-i', 'pipe:0',
            '-vn',
            '-map', '0:a:0',
            '-loglevel', 'warning',
            '-c:a', 'libopus',
            '-b:a', '96k',
            '-f', 'ogg',
            'pipe:1'
        ], { stdio: ['pipe', 'pipe', 'pipe'] });

        ffmpegProcess.stderr.on('data', (data) => console.error(`🔴 FFmpeg ERROR: ${data}`));

        ytProcess.stdout.pipe(ffmpegProcess.stdin);
    } catch (error) {
        console.error(`❌ Stream processing error: ${error.message}`);
        return message.channel.send('❌ Error processing the audio stream.');
    }

    const resource = createAudioResource(ffmpegProcess.stdout, { inputType: StreamType.OggOpus });

    if (!player) {
        player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
    }

    if (!connection) {
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        connection.subscribe(player);
    }

    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('🎵 Track finished. Checking queue...');
        playNextSong(message);
    });

    player.on('error', (error) => {
        console.error(`❌ Player error: ${error.message}`);
        message.channel.send('❌ Error playing audio.');
        playNextSong(message);
    });

    connection.on('error', (error) => {
        console.error(`❌ Connection error: ${error.message}`);
        disconnectBot();
    });

    const embed = createEmbed('🎵 Now Playing', `[${video.title}](${video.url})`);
    message.channel.send({ embeds: [embed] });
}

function startInactivityTimer() {
    console.log('⌛ No more songs in queue. Starting 10-minute inactivity timer.');
    inactivityTimeout = setTimeout(() => {
        console.log('⏳ Inactivity timeout reached. Disconnecting bot.');
        disconnectBot();
    }, 10 * 60 * 1000); // 10 minutes
}

function clearInactivityTimer() {
    if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
        inactivityTimeout = null;
    }
}

function disconnectBot() {
    if (connection) {
        connection.destroy();
        connection = null;
    }
    if (player) {
        player.stop();
        player = null;
    }
    queue = [];
}

module.exports = { playCommand };
