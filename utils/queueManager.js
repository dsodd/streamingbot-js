// Queue structure to store guild-specific queues
const queues = new Map();

function getQueue(guildId) {
    if (!queues.has(guildId)) {
        queues.set(guildId, []);
    }
    return queues.get(guildId);
}

function addToQueue(guildId, song) {
    const queue = getQueue(guildId);
    queue.push(song);
    return queue;
}

function removeFromQueue(guildId) {
    const queue = getQueue(guildId);
    return queue.shift();
}

function clearQueue(guildId) {
    queues.set(guildId, []);
}

function getQueueLength(guildId) {
    return getQueue(guildId).length;
}

function getQueueList(guildId) {
    return getQueue(guildId);
}

module.exports = {
    getQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getQueueLength,
    getQueueList
}; 