var db = module.exports = {},
		MongoClient = require('mongodb').MongoClient,
		generic_pool = require('generic-pool'),
		dbConfig = require('../database/todoConfig');

function now() {
	return (new Date()).getTime();
}

/**
 * Connection Pool for mongoDB
 */
var pool = db.pool = generic_pool.Pool({
	name: 'mongo-node-pool',
	min: dbConfig.min_connection,
	max: dbConfig.max_connection || 10,
	idleTimeoutMillis: 30000,
	reapIntervalMillis: 3000,
	priorityRange: 3,
	create: function (cb) {
		MongoClient.connect(dbConfig.url, {
			server: {poolSize: 1}
		}, function (err, db) {
			if (err) {
				cb(err);
			} else {
				cb(null, db);
			}
		});
	},
	destroy: function (db) {
		if (db && typeof db === 'object') {
			db.close(function (err) {
				if (err) {
					console.log("MongoDB close()", err.toString());
				}
			});
		}
	},
	validate: function (conn) {
		return conn && typeof conn === 'object';
	},
	log: function (info) {
		console.log('MONGODB_POOL', info);
	}
});

db.close = pool.release;

/**
 * get MongoDB DB Connection
 * Ref: http://mongodb.github.io/node-mongodb-native/api-generated/db.html
 */
db.connect = function (err, cb) {
	//record the connect start time.
	var start = now();
	pool.acquire(function (err, client) {
		if (err){
			console.log("database connection error is"+ err);
			cb(err);
		} else{
			var end = now();
			console.log("[acquire] a connection for db:"+client.serverConfig.name +" cost time "+(end - start)+"ms");
			cb(err, client);
			pool.release(client);
		}
	});
};

/**
 * get MongoDB DB Collection
 * Ref: http://mongodb.github.io/node-mongodb-native/api-generated/db.html
 */
db.collection = function (collectionName, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db.serverConfig.name+" when execute method [collection] the error is "+err);
			cb(err,{});
		} else {
			db.collection(collectionName, function (err, col) {
				pool.release(db);

				if (err) {
					console.log("execute method [collection] for collection:"+collectionName+" of db :"+db.serverConfig.name+" is failure!");
					cb(err);
				} else {
					var end = now();
					console.log("execute method [collection] for collection:"+collectionName+" of db :"+db.serverConfig.name+" cost time :"+(end-start)+"ms");
					cb(err, col);
				}
			});
		}
	});
};


/**
 * cb(err,docArray)
 * */
db.insert = function (collectionName, doc, opt, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [insert]");
			cb(err,{});
		} else {
			var col = db.collection(collectionName);
			col.insert(doc, opt, function (err, result) {
				pool.release(db);

				if(err){
					console.log("execute method [insert] the record:"+doc+" to collection:"+collectionName+" of db :"+db.serverConfig.name+" is failure!");
				}
				var end = now();
				console.log("execute method [insert] the record:"+doc+" to collection:"+collectionName+" of db :"+db.serverConfig.name+" cost time :"+(end-start)+"ms");
				cb(err, result);
			});
		}
	});
};

/**
 *condition is a query object to find records that need to be updated
 *doc  is the replacement object
 *options [safe/multi/upsert/raw]
 *cb cb(err,updateCount)
 * */
db.update = function (collectionName, condition, doc, options, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [update]");
			cb(err,0);
		} else {
			var col = db.collection(collectionName);
			col.update(condition, doc, options, function (err, updateCount) {
				if(err){
					console.log("execute method [update] the record:"+doc+",condition : "+JSON.stringify(condition)+" , collection:"+collectionName+" for db :"+db.serverConfig.name+" is failure!");
				}
				var end = now();
				console.log("execute method [update] the record:"+doc+",condition : "+JSON.stringify(condition)+" , collection:"+collectionName+" for db :"+db.serverConfig.name+" cost time :"+(end-start)+"ms");
				cb(err, updateCount);
				pool.release(db);
			});
		}
	});
};

/**
 * condition (object) – query object to locate the object to modify
 * sort (array) – if multiple docs match, choose the first one in the specified sort order as the object to manipulate
 * doc (object) –the fields/vals to be updated
 * options [wtimeout/fsync/journal/remove /upsert/new]
 * cb cb(err,updateCount)
 * see: http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#findandmodify
 * */
db.findAndModify = function (collectionName, condition, sort, doc, options, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [findAndModify]");
			cb(err,[]);
		} else {
			var col = db.collection(collectionName);
			col.findAndModify(condition, sort, doc, options, function (err, docs) {
				if(err){
					console.log("execute method [findAndModify] for condition :"+JSON.stringify(condition)+" , collection : "+collectionName+" , doc :"+doc+",sort :" +sort+" of db :" +db.serverConfig.name+" is failure");
				}
				var end = now();
				console.log("execute method [findAndModify] for condition :"+JSON.stringify(condition)+" , collection : "+collectionName+" , doc :"+doc+",sort :" +sort+" of db :" +db.serverConfig.name+" cost time :"+(end - start)+"ms");
				cb(err, docs);
				pool.release(db);
			});
		}
	});
};

/**
 * count
 * cb(err,count)
 * */
db.count = function (collectionName, condition, opt, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [count]");
			cb(err,0);
		} else {
			var col = db.collection(collectionName);
			col.count(condition, opt, function (err, count) {
				if(err){
					console.log("execute method [count] for condition :"+JSON.stringify(condition)+" , collection : "+collectionName+" of db :" +db.serverConfig.name+" is failure");
				}
				var end = now();
				console.log("execute method [count] for condition :"+JSON.stringify(condition)+" , collection : "+collectionName+" of db :" +db.serverConfig.name+" cost time : "+(end - start)+" ms");
				cb(err, count);
				pool.release(db);
			});
		}
	});
};

/**
 * distinct
 * cb(err,docs)
 * */
db.distinct = function (collectionName, key, condition, opt, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [distinct]");
			cb(err, []);
		} else {
			var col = db.collection(collectionName);
			col.distinct(key, condition, opt, function (err, docs) {
				if(err){
					console.log("execute method [distinct] for condition :"+JSON.stringify(condition)+" ,key : "+key+", collection : "+collectionName+" of db :" +db.serverConfig.name+" is failure");
				}
				var end = now();
				console.log("execute method [distinct] for condition :"+JSON.stringify(condition)+" ,key : "+key+", collection : "+collectionName+" of db :" +db.serverConfig.name.name+" cost time :"+(end - start)+" ms");
				cb(err, docs ? docs : []);
				pool.release(db);
			});
		}
	});
};


/**
 * find find(query[, options], callback)
 * see: http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#find
 * cb(err,docs)
 * */
db.find = function (collectionName, condition, opts, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [find]");
			cb(err,[]);
		} else {
			var col = db.collection(collectionName);
			col.find(condition, opts).toArray(function (err, docs) {
				if(err){
					console.log("execute method [find] for condition :"+JSON.stringify(condition)+" , collection : "+collectionName+" of db :" +db.serverConfig.name+" is failure");
				}
				var end = now();
				console.log("execute method [find] for condition :"+JSON.stringify(condition)+" , collection : "+collectionName+" of db :" +db.serverConfig.name+" cost time : "+(end - start)+" ms");
				cb(err, docs);
				pool.release(db);
			});
		}
	});
};

/**
 * findOne findOne(query[, options], callback)
 * cb(err,doc)
 * */
db.findOne = function (collectionName, condition, opts, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [findOne]");
			cb(err,{});
		} else {
			var col = db.collection(collectionName);
			col.findOne(condition, opts, function (err, doc) {
				if(err){
					console.log("execute method [findOne] for condition :"+condition+" , collection : "+collectionName+" of db :" +db.serverConfig.name+" is failure");
				}
				var end = now();
				console.log("execute method [findOne] for condition :"+condition+" , collection : "+collectionName+" of db :" +db.serverConfig.name+" cost time :"+(end - start)+" ms");
				cb(err, doc);
				pool.release(db);
			});
		}
	});
};

/**
 * aggregate remove(condition [, options], callback)
 * see: http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#remove
 * cb(err,numberOfRemovedDocs)
 * */
db.remove = function (collectionName, condition, opts, cb) {
	var start = now();

	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [remove]");
			cb(err, 0);
		} else {
			var col = db.collection(collectionName);

			col.remove(condition, opts, function (err, numberOfRemovedDocs) {
				var end = now();

				pool.release(db);

				if (err) {
					console.log("execute method [remove] for condition :"+condition+" , collection : "+collectionName+" of db :" +db.serverConfig.name+" is failure");
				}

				console.log("execute method [remove] for condition :" + condition + " , collection : " + collectionName + " of db :" + db.serverConfig.name + " cost time :" + (end - start) + " ms.");

				cb(err, numberOfRemovedDocs);
			});
		}
	});
};
/**
 * aggregate aggregate(commands [, options], callback)
 * see: http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#aggregate
 * cb(err,docs)
 * */
db.aggregate = function (collectionName, commands, opts, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [aggregate]");
			cb(err,[]);
		} else {
			var col = db.collection(collectionName);
			col.aggregate(commands, opts, function (err, docs) {
				if(err){
					console.log("execute method [aggregate] for collection : "+collectionName+" of db :" +db.serverConfig.name+" is failure");
				}
				var end = now();
				console.log("execute method [aggregate] for collection : "+collectionName+" of db :" +db.serverConfig.name+" cost time :"+(end - start)+" ms");
				cb(err, docs);
				pool.release(db);
			});
		}
	});
};

/**
 * mapReduce mapReduce(map, reduce[, options], callback)
 * see: http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#mapreduce
 * cb(err,docs)
 * */
db.mapReduce = function (collectionName, map, reduce, opt, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [mapReduce]");
			cb(err,[]);
		} else {
			var col = db.collection(collectionName);
			opt.out = {inline: 1};
			col.mapReduce(map, reduce, opt, function (err, results) {
				if(err){
					console.log("execute method [aggregate] for collection : "+collectionName+" , map :"+map+" , reduce :" + reduce +" of db :" +db.serverConfig.name+" is failure");
				}
				var end = now();
				console.log("execute method [aggregate] for collection : "+collectionName+" , map :"+map+" , reduce :" + reduce +" of db :" +db.serverConfig.name+" cost time :"+(end - start)+" ms");
				cb(err, results);
				pool.release(db);
			});
		}
	});
};


/**
 * drop collection
 * see: http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#mapreduce
 * cb(err,docs)
 * */
db.dropCollection = function (collectionName, cb) {
	var start = now();
	pool.acquire(function (err, db) {
		if (err) {
			console.log("[acquire] a connection is failure for db:"+db+" when execute method [dropCollection]");
			cb(err,[]);
		} else {
			var col = db.collection(collectionName);
			col.drop(function (err, results) {
				if(err){
					console.log("execute method [dropCollection] for collection : "+collectionName+" of db :" +db.serverConfig.name+" is failure");
				}
				var end = now();
				console.log("execute method [dropCollection] for collection : "+collectionName+"  of db :" +db.serverConfig.name+" cost time :"+(end - start)+" ms");
				cb(err, results);
				pool.release(db);
			});
		}
	});
};

/**
 * debug tool for connection pool.
 */
db.printPool = function () {
	if (dbConfig.mode === "development") {
		if (console) {
			console.log("pool name: " + pool.getName());
			console.log("pool size: " + pool.getPoolSize());
			console.log("pool available objects count: " + pool.availableObjectsCount());
			console.log("pool waiting clients count: " + pool.waitingClientsCount());
		}

		console.log("[_printPoolInfo] pool name: %s", pool.getName());
		console.log("[_printPoolInfo] pool size: %s", pool.getPoolSize());
		console.log("[_printPoolInfo] pool available objects count: %s", pool.availableObjectsCount());
		console.log("[_printPoolInfo] pool waiting clients count: %s", pool.waitingClientsCount());
	}
};
