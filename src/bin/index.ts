import http from 'http';

import envVars from 'config/environment';

import app from 'app';

import io from 'web-socket/index';

const server = http.createServer(app);

io.listen(server);

server.listen(envVars.port, () => {
  console.log(`Port : ${envVars.port} Listen start at ${new Date().toISOString()}`);
});
