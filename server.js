const app = require('./api/index');
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', function () {
  console.log('Maze Game API Server running on port ' + PORT);
  console.log('Local dev: http://localhost:' + PORT);
});
