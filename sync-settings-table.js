const Setting = require('./dist/models/Setting').default;

Setting.sync({ force: false })
  .then(() => {
    console.log('Settings table created successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
