const { Server } = require('socket.io');
const { createClient } = require('redis');

function setupSocket(server) {
  // Redis client for caching
// const redisClient = createClient({
//   host: "127.0.0.2",
//   port: 4000,
// });
// redisClient.connect().catch(console.error);

const queues = {};

  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust this in production to restrict origins
      methods: ["GET", "POST"]
    }
  });

  // WebSocket Setup for Real-Time Game Connections
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('playGame', (data) => {
      console.log(data);

      try {
        const queueKey = `${data.game}:${data.amount}:${data.type}`;
        // console.log(queueKey)

        if (data.type === 1) {
          // Handle single game matchmaking (2-player)
          const queue = queues[queueKey] || [];

          
          if (queue.length === 0) {
            // Add this player to the queue if no opponent is found
            queues[queueKey] = [socket.id];
            console.log(socket.id +"is added")
            socket.emit('waiting', 'Waiting for another player...');
          } else {
            // Match the player with an opponent
            const opponentId = queue.shift();
            queues[queueKey] = queue;
            console.log('creating room and addig both player')
            // Create a room and notify both players
            const room = `${data.game}-${data.amount}-${data.type}-${Date.now()}`;
            socket.join(room);
            io.sockets.sockets.get(opponentId)?.join(room);

            io.to(room).emit('gameStart', { roomId: room, gameType:data.game, tier:data.amount, mode:data.type });
            console.log(`Game started in room: ${room} for ${data.game} (Tier: ${data.amount})`);
          }
        } else if (data.type ===2 ) {
          // Handle tournament mode (2-player or 4-player)
          const queue = queues[queueKey] || [];
          
          if (queue.length < 4) {
            // Add the player to the tournament queue
            queue.push(socket.id);
            queues[queueKey] = queue;

            socket.emit('waiting', 'Waiting for more players...');
          }

          if (queues[queueKey].length === 4) {
            // Create tournament room and match players
            const room = `${data.game}-${data.amount}-2-${Date.now()}`;
            const playersToMatch = queues[queueKey].splice(0, 4); // Match 4 players

            // Join the room and notify all players
            playersToMatch.forEach((playerId) => {
              io.sockets.sockets.get(playerId)?.join(room);
            });

            io.to(room).emit('gameStart', { roomId: room, gameType, tier, mode, players: playersToMatch });
            console.log(`Tournament started in room: ${room} for ${data.game} (Tier: ${data.amount})`);
          }
        }
      } catch (error) {
        console.error('Error in matchmaking:', error);
        socket.emit('error', 'An error occurred while finding a match.');
      }
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);

      // Remove the user from any pending queue
      try {
        const keys = await redisClient.keys('queue:*');
        for (const key of keys) {
          await redisClient.lrem(key, 1, socket.id);
        }
      } catch (error) {
        console.error('Error removing disconnected user from queue:', error);
      }
    });
  });

  return io;
}

module.exports = setupSocket;