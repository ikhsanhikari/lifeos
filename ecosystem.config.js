module.exports = {
  apps: [
    {
      name: 'lifeos-api',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
    },
    {
      name: 'lifeos-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3011',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
      },
    },
  ],
};
