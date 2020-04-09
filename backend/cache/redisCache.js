const redis = require("redis");

/**
 * @redis make the connection as a client
 */
var redisClient = redis.createClient(process.env.REDIS_PORT);

/**
 * @check wheather connnection has been successful or not
 */
redisClient.on("error", function (err) {
	console.log("Error RedisClient" + err);
});

redisClient.on('connect', function() {
	console.log('RedisClient connected');
});

module.exports =  redisClient;