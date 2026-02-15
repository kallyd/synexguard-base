module.exports = {
  apps: [
    {
      name: 'synexguard-api',
      cwd: __dirname,
      script: 'C:/Users/joaom/AppData/Local/Programs/Python/Python314/python.exe',
      args: ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'],
      interpreter: 'none',
    },
  ],
};
