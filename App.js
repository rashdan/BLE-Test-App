import React, { Component } from 'react';
import { Platform, NativeModules, NativeEventEmitter, PermissionsAndroid, Alert } from 'react-native';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  View,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
const transactionId = "moniter";

export default class App extends Component {

  constructor() {
    super()
    this.manager = new BleManager()
    this.state = {
      deviceid: '', serviceUUID: '', characteristicsUUID: '', text1: '', device: {}, makedata: [], showToast: false,
      notificationReceiving: false, allDevices: [], deviceName: ''
    }
  }

  bluetoothConfig = () => {
    const subscription = this.manager.onStateChange((state) => {
      console.log(state, 'this is the console of state change')
      if (state == 'PoweredOn') {
        this.scanAndConnect();
      }
    }, true);
  }

  componentWillUnmount() {
    this.manager.cancelTransaction(transactionId)
    this.manager.stopDeviceScan();
    this.manager.destroy();
    delete this.manager;
  }

  async writeMesage(code, message) {
    this.manager.cancelTransaction(transactionId)
    var device = this.state.device;
    const senddata = base64.encode(message);
    if (device) {
      console.log(this.state.serviceUUID, this.state.deviceid, this.state.characteristicsUUID, 'this is console of IDS in message function')
      this.manager.servicesForDevice(this.state.deviceid).then((characteristic) => {

        console.log("write response");
        console.log(characteristic);
        console.log("device")
        console.log(this.state.serviceUUID, "device", this.state.characteristicsUUID)
        console.log(this.state.device)
        if(characteristic) {
          alert('Connected Successfully. You can check connection by Clicking on "IsConnected" Button')
        } else {
          alert('Device not Connected')
        }
        // let snifferService = null
        // var SERVICE_SNIFFER_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
        // var SNIFFER_VOLTAGE_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

        // device.services().then(services => {
        //   let voltageCharacteristic = null
        //   snifferService = services.filter(service => service.uuid === this.state.serviceUUID)[0]
        //   snifferService.characteristics().then(characteristics => {
        //     console.log("characteristics characteristics")
        //     console.log(characteristics)
        //     this.setState({ notificationReceiving: true })
        //     // voltageCharacteristic is retrieved correctly and data is also seems correct
        //     voltageCharacteristic = characteristics.filter(c => c.uuid === characteristics[0].uuid)[0]
        //     voltageCharacteristic.monitor((error, c) => {
        //       // RECEIVED THE ERROR HERE (voltageCharacteristic.notifiable === true)
        //       if (error) {
        //         console.log("error in monitering", error)
        //         return;
        //       }
        //       else {
        //         // console.log("c",base64.decode(c.value))  
        //         const data1 = base64.decode(c.value);
        //         var s = data1.split(" ");
        //         var s1 = parseInt(s[1]);
        //         if (isNaN(s1)) { count++; }
        //         else {
        //           if (count == 1) {
        //             this.state.makedata.push(<Text key={moment().valueOf()}>{s[0]} : {s1 / 1000} {"\n"} </Text>);
        //             this.setState({ dateTime: "Data Received at : " + moment().format("MMMM Do, h:mm:ss a"), makedata: this.state.makedata });
        //           }
        //           if (count == 3) { count = 0; this.setState({ makedata: [] }) }
        //         }
        //       }
        //     }, transactionId)
        //   }).catch(error => console.log(error))
        // })
        // return
      }).catch((error) => {
        console.log(error, 'this is the console of write message function')
      })
    }
    else {
      this.alert("No device is connected")
    }
  }

  getServicesAndCharacteristics(device) {
    return new Promise((resolve, reject) => {
      device.services().then(services => {
        const characteristics = []
        console.log("ashu_1", services)
        services.forEach((service, i) => {
          service.characteristics().then(c => {
            console.log("service.characteristics")

            characteristics.push(c)
            console.log(characteristics)
            if (i === services.length - 1) {
              const temp = characteristics.reduce(
                (acc, current) => {
                  return [...acc, ...current]
                },
                []
              )
              const dialog = temp.find(
                characteristic =>
                  characteristic.isWritableWithResponse
              )
              if (!dialog) {
                reject('No writable characteristic')
              }
              resolve(dialog)
            }

          })
        })
      })
    })
  }

  async scanAndConnect() {
    console.log('Scanning all devices!!!!')
    this.setState({ text1: "Scanning..." })
    this.manager.startDeviceScan(null, null, async (error, device) => {
      console.log(device.id, "Scanning...");
      this.setState({ allDevices: [...this.state.allDevices, device.id] }, () => {
        console.log(this.state.allDevices, 'this is the console of all Devices')
      })
      const HeadsetID = device.id
      // this.manager.stopDeviceScan();
      // console.log(/[_]/g.test(device.id), 'console of device:')
      // this.manager.stopDeviceScan();
      if (null) {
        console.log('null')
      }
      if (error) {
        this.alert("Error in scan=> " + error)
        this.setState({ text1: "" })
        this.manager.stopDeviceScan();
        return
      }
      // if (/[_]/g.test(device.name)) {
      // let nameSplit = device.name.split('_');
      // if (nameSplit[0] == 'TAPP') { //T3X1 //TAPP
      // const serviceUUIDs = device.serviceUUIDs[0]
      // this.setState({ text1: "Connecting to " + device.name })
      //listener for disconnection
      /* this.manager.onDeviceDisconnected(device.id, (error, device) => {
           console.log(error);
           console.log("errordddd",device);
           // if(this.props.device.isConnected) {
           //     this.scanAndConnect()
           // }
           
       });*/
      //  ++++++++++++++++
      // ---------------------------
      // .then((device) => {
      //   // return this.setupNotifications(device)
      // }).then(() => {
      //   console.log("Listening...")
      // }, (error) => {
      //   this.alert("Connection error" + JSON.stringify(error))
      // })
      // }
      // }
    });
  }

  ConnectFunc(id) {
    console.log(id, 'outside connect function')
    this.manager.connectToDevice(id, { autoConnect: true }).then((device) => {
      // console.log(device, 'this the console of connected device!!!!!')
      (async () => {
        const services = await device.discoverAllServicesAndCharacteristics()
        console.log(services, 'this is the console of descover services')
        const characteristic = await this.getServicesAndCharacteristics(services)
        console.log("characteristic")
        console.log(characteristic.serviceUUID)
        console.log("Discovering services and characteristics", characteristic.uuid);
        if(device.id && characteristic.serviceUUID && characteristic.uuid) {
          this.setState({ deviceid: device.id, serviceUUID: characteristic.serviceUUID, characteristicsUUID: characteristic.uuid, device: device })
          this.setState({ text1: "Conneted to " + device.name })
          this.setState({deviceName: device.name})
          alert('Now, Device is ready to connect')
        } else {
          alert('Problem occur while getting Services')
        }
      })();
      this.setState({ device: device })
      return device.discoverAllServicesAndCharacteristics()
    }).catch((error) => {
      console.log(error, 'this is the console of connection error')
    })
  }

  checkDeviceConnection() {
    const device = this.state.device;
    this.manager.isDeviceConnected(this.state.deviceid).then((res) => {
      if(res){
        alert('You are connected to: ' + this.state.deviceName + ' ' + this.state.deviceid)
      } else {
        alert('You are not connected with any device')
      }
      console.log(res, 'is device connected')
    })
  }

  disconnectDevice() {
    this.manager.cancelDeviceConnection(this.state.deviceid).then((res) => {
      alert('Disconnected Successfully')
      console.log(res, 'Device disconnected successfully')
    })
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>
          <View style={styles.backgroundStyle}>
            <TouchableOpacity onPress={() => this.bluetoothConfig()} style={styles.Button_container}>
              <Text style={{ fontSize: 22, fontWeight: "600", color: 'white' }}>Start Scanning</Text>
            </TouchableOpacity>
            {this.state.allDevices && <View style={{ width: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {this?.state?.allDevices?.map((item) => {
                return (
                  <TouchableOpacity onPress={() => this.ConnectFunc(item)} key={item}>
                    <Text key={item} style={{ fontSize: 16, fontWeight: '600', marginTop: 20 }}>{item}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>}
            <TouchableOpacity style={styles.Button_container} onPress={() => this.writeMesage("ACK", "ACK Writted")}>
              <Text style={{ fontSize: 22, fontWeight: '600', color: 'white' }}>Connect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.Button_container} onPress={() => this.checkDeviceConnection()}>
              <Text style={{ fontSize: 22, fontWeight: '600', color: 'white' }}>Is Connected</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.Button_container} onPress={() => this.disconnectDevice()}>
              <Text style={{ fontSize: 22, fontWeight: '600', color: 'white' }}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

}

const styles = StyleSheet.create({

  backgroundStyle: {
    width: '100%',
    alignItems: 'center',
    height: '100%',
    flexDirection: 'column',
  },

  Button_container: {
    width: '80%',
    height: 60,
    marginTop: 50,
    backgroundColor: 'dodgerblue',
    alignItems: 'center',
    borderRadius: 20,
    justifyContent: 'center',
  },

});

