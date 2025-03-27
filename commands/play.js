const { createEmbed } = require('../utils/embedTemplate');
const { getYoutubeVideo } = require('../utils/youtubeApi');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType
} = require('@discordjs/voice');
const { spawn } = require('child_process');

async function playCommand(message, args) {
    if (!args.length) {
        return message.channel.send('❌ You need to provide a YouTube link or search query.');
    }

    const query = args.join(' ');
    const video = await getYoutubeVideo(query);
    if (!video) {
        return message.channel.send('❌ No video found for your query.');
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.channel.send('❌ You must be in a voice channel to play music.');
    }

    console.log(`🎵 Fetching stream for: ${video.url}`);

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

        if (!ytProcess.stdout || !ffmpegProcess.stdout) {
            throw new Error('No valid audio stream.');
        }

        ytProcess.stdout.pipe(ffmpegProcess.stdin);
    } catch (error) {
        console.error(`❌ Stream processing error: ${error.message}`);
        return message.channel.send('❌ Error processing the audio stream.');
    }

    let resource, player, connection;

    try {
        resource = createAudioResource(ffmpegProcess.stdout, { inputType: StreamType.OggOpus });

        player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play }
        });

        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        connection.subscribe(player);
        player.play(resource);
    } catch (error) {
        console.error(`❌ Playback error: ${error.message}`);
        return message.channel.send('❌ Error playing audio.');
    }

    player.on('stateChange', (oldState, newState) => {
        console.log(`🎵 Player state changed: ${oldState.status} → ${newState.status}`);
    });

    player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
        ytProcess.kill();
        ffmpegProcess.kill();
    });

    player.on('error', (error) => {
        console.error(`❌ Player error: ${error.message}`);
        message.channel.send('❌ Error playing audio.');
        connection.destroy();
        ytProcess.kill();
        ffmpegProcess.kill();
    });

    connection.on('error', (error) => {
        console.error(`❌ Connection error: ${error.message}`);
        connection.destroy();
        ytProcess.kill();
        ffmpegProcess.kill();
    });

    const embed = createEmbed('🎵 Now Playing', `[${video.title}](${video.url})`);
    message.channel.send({ embeds: [embed] });
}

module.exports = { playCommand };
