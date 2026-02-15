module.exports = {
  apps: [
    {
      name: 'synexguard-frontend',
      cwd: __dirname,
      script: 'npm',
      args: ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173'],
      interpreter: 'none',
    },
  ],
};
