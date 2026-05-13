module.exports = {
  apps: [
    {
      name: 'flarehub-api',
      script: '/var/www/flarehub/flarehub-backend/dist/server.js',
      cwd: '/var/www/flarehub/flarehub-backend',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--experimental-vm-modules',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/flarehub/error.log',
      out_file:   '/var/log/flarehub/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
