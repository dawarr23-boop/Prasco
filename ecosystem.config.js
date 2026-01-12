module.exports = {
  apps: [
    {
      name: 'prasco',
      script: './dist/server.js',
      instances: 1, // Nur 1 Instanz für RPi3 (kein Cluster wegen 1GB RAM)
      exec_mode: 'fork',
      max_memory_restart: '400M', // Restart bei >400MB (RPi3 hat nur 1GB total)
      node_args: '--max-old-space-size=512', // Begrenze Node.js Heap auf 512MB
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      // Performance-Optimierungen
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
