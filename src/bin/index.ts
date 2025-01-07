import http from 'http';

import envVars from '@src/config/environment';

import app from '../index';

import io from '@src/web-socket/index';

const server = http.createServer(app);

io.listen(server);

server.listen(envVars.port, () => {
  console.log(`Port : ${envVars.port} Listen start at ${new Date().toISOString()}`);
});

process.on('uncaughtException', (error) => {
  console.log({ error })
})

process.on('unhandledRejection', (error) => {
  console.log({ error })
})
