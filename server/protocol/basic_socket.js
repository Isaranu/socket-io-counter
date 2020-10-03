/* Setup using socket IO */
var server = require('http').createServer();
var io = require('socket.io')(server);
var port = 3000;

var mongojs = require('mongojs');
var iot_db = mongojs('iot_db');

var split = require('split-string');
var moment = require('moment');

var iot_uuid, user_uuid;

io.on('connection', function(socket){

  /* Emitting welcome message when has some client connected */
  socket.emit('response', 'This is response from server !');

    /* -- ########### [IoT device connected] ########### -- */
    socket.on('iot', function(device_id){
      console.log('[Device connected] >> ' + socket.id + ' | device id. : ' + device_id);

      socket.nickname = device_id;

      /* Set uuid of device */
      iot_uuid = socket.id;

      /* Fire Event to dashboard that device connected */
      io.to(user_uuid).emit('online_device', device_id);
    });

    /* -- ########### [User Dashboard connected] ########### -- */
    socket.on('dashboard', function(userid){
      console.log('[User connected] >> ' + socket.id + ' | user id. : ' + userid);

      /* Set uuid of user dashboard */
      user_uuid = socket.id;
    });

    socket.on('disconnecting', function(){
      if(socket.id == iot_uuid){
        io.to(user_uuid).emit('offline_device', socket.nickname);
      }else {
        //..
      }
    });

    /* ------------- ########### ------------------- */

/* ----------------------------- EVENT ---------------------------------- */

  /* EVENT : Report device online when request from dashboard */
  socket.on('check_device_online', function(data){
    console.log('[device online] : ' + device_id);
    io.to(user_uuid).emit('online_device', device_id);
  });

  /* EVENT : Data pushed from IoT device >> Forwarding to Dashbaord user */
  socket.on('push_data', function(pushData){
    console.log('[push data from IoT] : ' + pushData);
    io.to(user_uuid).emit('iot_data', pushData);

    var splited_arr = split(pushData, {separator:':'});

    var rec_cnt_col = iot_db.collection(String(splited_arr[0]));
        rec_cnt_col.insert({
          device_id: String(splited_arr[0]),
          accum_cnt: Number(splited_arr[1]),
          ts: new Date().getTime(),
          ts_pretty: moment(new Date().getTime()).format('Do MMMM YYYY, HH:mm:ss')
        }, function(err){
          if(err) return console.log(err);
          console.log('RECORED count of ' + splited_arr[0]);
        });

  });

  socket.on('cmd', function(cmd){
    console.log('[cmd from IoT] : ' + cmd);

    var splited_arr = split(cmd, {separator:':'});

    switch (true) {
      case splited_arr[0] == 'prev_cnt':
        var getprev_cnt_col = iot_db.collection(String(splited_arr[1]));
            getprev_cnt_col.find({}).limit(1).sort({_id:-1}, function(err, lastcnt){
              if(err) return console.log(err);
              io.to(iot_uuid).emit('prev_cnt', lastcnt[0].accum_cnt);
            });
        break;
      default:
        //..
    }

  });

});

server.listen(port, function(){
  console.log('socket protocol running on port ' + port);
});
