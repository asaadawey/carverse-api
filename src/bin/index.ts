import http from 'http';
// import https from 'https';

import envVars from 'src/config/environment';

import app from 'src';

import io from 'src/web-socket/index';


async function main() {
  const server = http.createServer(await app());

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
}

//@ts-ignore
main().finally((stack: any) => {
  console.log({ stack })
})


