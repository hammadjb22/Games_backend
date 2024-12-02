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
    // console.log('A user connected:', socket.id);
    
    socket.on('playGame', (data) => {
      // console.log(data)
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
            const room = `${socket.id}-${opponentId}-${data.type}-${Date.now()}`;
            socket.join(room);
            io.sockets.sockets.get(opponentId)?.join(room);
             // Assign colors to the players
            socket.emit('assignColorAndLead', {color:'black',lead:'black'}); // Assign black to the current player
            io.to(opponentId).emit('assignColorAndLead', {color:'white',lead:'black'}); // Assign white to the opponent

            io.to(room).emit('matchMake', { roomId: room, gameType:data.game, tier:data.amount, mode:data.type });
            io.to(room).emit('gameStart', { chessState:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',roomId: room, gameType:data.game, tier:data.amount, mode:data.type });
            // console.log(`Game started in room: ${room} for ${data.game} (Tier: ${data.amount})`);

            // Real-time state updates
            socket.on('updateChessState', (state) => {
              console.log("chess state update in room by :"+socket.id)
              // Broadcast the updated chess state to the opponent
              socket.to(room).emit('chessStateUpdate', state);
            });

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
            io.to(room).emit('matchMake', { roomId: room, gameType, tier, mode, players: playersToMatch });
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
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    
      // Remove the user from any pending queue in the `queues` object
      for (const queueKey in queues) {
        const queue = queues[queueKey];
        const index = queue.indexOf(socket.id);
        if (index !== -1) {
          queue.splice(index, 1); // Remove the player from the queue
          console.log(`User ${socket.id} removed from queue: ${queueKey}`);
        }
    
        // Clean up empty queues
        if (queues[queueKey].length === 0) {
          delete queues[queueKey];
          console.log(`Queue ${queueKey} deleted as it's empty.`);
        }
      }
    });
  });

  return io;
}

module.exports = setupSocket;