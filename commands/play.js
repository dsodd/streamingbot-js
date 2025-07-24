const { createEmbed } = require('../utils/embedUtils');
const { getYoutubeVideo, getYoutubePlaylist, detectPlatform } = require('../utils/youtubeApi');
const { addToQueue, getQueueList } = require('../utils/queueManager');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType
} = require('@discordjs/voice');
const { spawn } = require('child_process');

let connection = null;
let player = null;
let inactivityTimeout = null;
let currentYtProcess = null;
let currentFfmpegProcess = null;

async function playCommand(message, args) {
    if (!args.length) {
        return message.channel.send('❌ You need to provide a YouTube link or search query.');
    }

    const query = args.join(' ');
    const platform = detectPlatform(query);

    let videos = [];
    
    switch (platform) {
        case 'youtube':
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
            break;
            
        case 'spotify':
            message.channel.send('🎵 Spotify support is coming soon!');
            return;
            
        case 'soundcloud':
            message.channel.send('🎵 SoundCloud support is coming soon!');
            return;
            
        default:
            // Treat as YouTube search query
            const video = await getYoutubeVideo(query);
            if (!video) {
                return message.channel.send('❌ No video found for your query.');
            }
            videos.push(video);
    }

    // Add videos to queue
    videos.forEach(video => addToQueue(message.guild.id, video));

    // Send confirmation message
    if (videos.length === 1) {
        message.channel.send({ 
            embeds: [createEmbed('success', `🎵 Added to queue: ${videos[0].title}`)] 
        });
    }

    if (!player) {
        playNextSong(message);
    }
}

function playNextSong(message) {
    const queue = getQueueList(message.guild.id);
    if (queue.length === 0) {
        startInactivityTimer();
        return;
    }

    clearInactivityTimer();

    const video = queue[0]; // Get the first song without removing it yet
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
            '--no-part', 
            video.url
        ], { stdio: ['ignore', 'pipe', 'pipe'] });

        currentYtProcess = ytProcess;

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

        currentFfmpegProcess = ffmpegProcess;

        ffmpegProcess.stderr.on('data', (data) => console.error(`🔴 FFmpeg ERROR: ${data}`));

        ytProcess.stdout.pipe(ffmpegProcess.stdin);

        // Add listeners to ensure processes are cleaned up
        ytProcess.on('close', (code) => {
            console.log(`yt-dlp process closed with code ${code}`);
            if (currentYtProcess === ytProcess) currentYtProcess = null;
        });
        ffmpegProcess.on('close', (code) => {
            console.log(`ffmpeg process closed with code ${code}`);
            if (currentFfmpegProcess === ffmpegProcess) currentFfmpegProcess = null;
        });

    } catch (error) {
        console.error(`❌ Stream processing error: ${error.message}`);
        // Ensure processes are killed on error
        if (ytProcess) ytProcess.kill();
        if (ffmpegProcess) ffmpegProcess.kill();
        currentYtProcess = null;
        currentFfmpegProcess = null;
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
        // Ensure processes are killed when player is idle and moves to next song
        if (currentYtProcess) {
            currentYtProcess.kill();
            currentYtProcess = null;
        }
        if (currentFfmpegProcess) {
            currentFfmpegProcess.kill();
            currentFfmpegProcess = null;
        }
        // Remove the current song from queue
        queue.shift();
        playNextSong(message);
    });

    player.on('error', (error) => {
        console.error(`❌ Player error: ${error.message}`);
        message.channel.send('❌ Error playing audio.');
        // Ensure processes are killed on player error
        if (currentYtProcess) {
            currentYtProcess.kill();
            currentYtProcess = null;
        }
        if (currentFfmpegProcess) {
            currentFfmpegProcess.kill();
            currentFfmpegProcess = null;
        }
        // Remove the current song from queue
        queue.shift();
        playNextSong(message);
    });

    connection.on('error', (error) => {
        console.error(`❌ Connection error: ${error.message}`);
        // Ensure processes are killed on connection error
        if (currentYtProcess) {
            currentYtProcess.kill();
            currentYtProcess = null;
        }
        if (currentFfmpegProcess) {
            currentFfmpegProcess.kill();
            currentFfmpegProcess = null;
        }
        disconnectBot();
    });

    const embed = createEmbed('info', null, video);
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
    // Ensure processes are killed when bot disconnects
    if (currentYtProcess) {
        currentYtProcess.kill();
        currentYtProcess = null;
    }
    if (currentFfmpegProcess) {
        currentFfmpegProcess.kill();
        currentFfmpegProcess = null;
    }
    if (connection) {
        connection.destroy();
        connection = null;
    }
    if (player) {
        player.stop();
        player = null;
    }
}

module.exports = { playCommand };
