#include "IoTtweetSocket.h"
#include "SocketIoClient.h"

#include "EEPROM.h"

const char *ssid = "";
const char *passw = "";
const char *serverIP = "";
int serverPort = 3000;
String device_id = "iot_1";

//unsigned long counter;
int counter = 0;

unsigned long prev_ms = 0;
const long cycleTime = 1; /* in second */

struct eepMem{
  char devicename[10];
  unsigned long cnt;
};

IoTtweetSocket socket;
SocketIoClient IoT;

void response(String payload, size_t length) {
  Serial.println("Receive response from server : " + payload);
  
  Serial.println("IoT send a device name to server");
  Serial.println("IoT name : " + device_id);

  String iotname = "\"" + device_id + "\"";
  char buff[255];
  unsigned int len = iotname.length();
  iotname.toCharArray(buff, len+1);
  
  IoT.emit("iot",buff);
}

void push_data(String payload){
  payload = "\"" + payload + "\"";
  char data_buf[255];
  unsigned int data_len = payload.length();
  payload.toCharArray(data_buf, data_len+1);
  
  IoT.emit("push_data",data_buf);
}

void req_previous_cnt(String _mode){
  
  _mode = "\"" + _mode + ":" + device_id + + "\"";
  char data_buf[255];
  unsigned int data_len = _mode.length();
  _mode.toCharArray(data_buf, data_len+1);
  
  IoT.emit("cmd",data_buf);
}

void get_previous_cnt(String _prev_cnt, size_t length){
  Serial.println("PREVIOUS CNT = " + _prev_cnt);
  char* _char;
  _prev_cnt.toCharArray(_char, 10);
  counter = atoi(_char);
}

void setup() {

  Serial.begin(115200);
  
  socket.begin(ssid,passw);
      
  /* Set Event response from server */
  IoT.on("response", response);

  /* Set Event receive previous cnt */
  IoT.on("prev_cnt", get_previous_cnt);

  IoT.begin(serverIP, serverPort);
  prev_ms = millis();

  delay(3000);

  /* Get previous counter */
  //req_previous_cnt("prev_cnt");

  delay(3000);
  
}

void loop() {

  //..
  IoT.loop();

  unsigned long cur_ms = millis();

    /* Task 1 : Send data */
    if(cur_ms - prev_ms > cycleTime*1000){

      /* Random some number to send to socket protocol */
      /*
      int random_num = random(30,100); 
      Serial.println("Random number : " + String(random_num));
      push_data(String(random_num));  
      */
      
      /* Counting process*/
      //...
      counter++;

      String packet = device_id;
             packet += ":";
             packet += String(counter);
      
      push_data(packet);
      
      prev_ms = cur_ms;
    }else{
      //..
    }
      
}
