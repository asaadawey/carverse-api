import http from 'http';

import envVars from 'src/config/environment';

import app from 'src';

import io from 'src/web-socket/index';

const server = http.createServer(app);

io.listen(server);

server.listen(envVars.port, () => {
  console.log(`Port : ${envVars.port} Listen start at ${new Date().toISOString()}`);
});
