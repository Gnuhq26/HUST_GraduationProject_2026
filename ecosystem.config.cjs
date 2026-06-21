/** PM2 production config — API only; frontend served by Nginx from frontend/dist */
module.exports = {
  apps: [
    {
      name: 'buildify-backend',
      cwd: './backend',
      script: 'dist/src/main.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
