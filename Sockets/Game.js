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
      // console.log(data.userInfo)
      socket.userInfo = data.userInfo; // Save user info for this socket
      socket.gameInfo = data.gameInfo; // Save game info for this socket
      try {
        const queueKey = `${data.gameInfo.game}:${data.gameInfo.amount}:${data.gameInfo.type}`;
        // console.log(queueKey)

        if (data.gameInfo.type === 1) {
          // Handle single game matchmaking (2-player)
          const queue = queues[queueKey] || [];


          if (queue.length === 0) {
            // Add this player to the queue if no opponent is found
            queues[queueKey] = [socket.id];
            // console.log(socket.id + "is added")
            socket.emit('waiting', 'Waiting for another player...');
          } else {
            // Match the player with an opponent
            const opponentId = queue.shift();
            const opponentSocket = io.sockets.sockets.get(opponentId)

            queues[queueKey] = queue;
            console.log('creating room and addig both player')
            // Create a room and notify both players
            const room = `${socket.id}-${opponentId}-${data.gameInfo.type}-${Date.now()}`;
            socket.join(room);
            opponentSocket?.join(room);
            // Assign colors to the players
            // socket.emit('assignColorAndLead', { color: 'black', lead: 'black' }); // Assign black to the current player
            // io.to(opponentId).emit('assignColorAndLead', { color: 'white', lead: 'black' }); // Assign white to the opponent

            io.to(room).emit('matchMake', {
              matchId: room,
              playerWhite: {
                userInfo: opponentSocket.userInfo
              },
              playerBlack: {
                userInfo: socket.userInfo
              },
              startingPlayer: "white",
              gameInfo:opponentSocket.gameInfo
            });

            // console.log(`Game started in room: ${room} for ${data.game} (Tier: ${data.amount})`);
           
            // Real-time state updates
            socket.on('makeMove', ({matchId,state,userData}) => {
              console.log("chess state update in room by :" +userData.name )
              // Broadcast the updated chess state to the opponent
              socket.to(room).emit('updateMove', state);
            });
            opponentSocket.on('makeMove', ({matchId,state,userData}) => {
              console.log("chess state update in room by opponent :" + userData.name)
              // Broadcast the updated chess state to the opponent
              console.log(userData)
              opponentSocket.to(room).emit('updateMove', state);
            });
            

          }
        } else if (data.gameInfo.type === 2) {
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