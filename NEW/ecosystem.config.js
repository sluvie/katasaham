module.exports = {
  apps: [
    {
      name: 'katasaham-backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'katasaham-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './client',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
