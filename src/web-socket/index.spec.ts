import { Server } from 'socket.io';
import Client from 'socket.io-client';
import { createServer } from 'http';
import { ClientToServerEvents } from 'web-socket';
import { ServerToClientEvents } from 'web-socket';

describe('my awesome project', () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    const httpServer = createServer();
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    httpServer.listen(() => {
      clientSocket = new Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('should work', (done) => {
    clientSocket.on('hello', (arg) => {
      expect(arg).toBe('world');
      done();
    });
    serverSocket.emit('hello', 'world');
  });

  test('should work (with ack)', (done) => {
    serverSocket.on('hi', (cb) => {
      cb('hola');
    });
    clientSocket.emit('hi', (arg) => {
      expect(arg).toBe('hola');
      done();
    });
  });
});
