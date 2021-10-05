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

const MANUFACTURING_ID_ARRAY = [
  '//8A',
  '//8B',
  '//8C',
  '//8D',
  'RQgA',
  'RQgB',
  'RQgC',
  'RQgD',
  'RQgE',
  'RQgF',
];

const isDometicDevice = MANUFACTURER_ID => MANUFACTURING_ID_ARRAY.includes(MANUFACTURER_ID);

export default class App extends Component {

  constructor() {
    super()
    this.manager = new BleManager()
    this.state = {
      deviceid: '', serviceUUID: '', characteristicsUUID: '', text1: '', device: {}, makedata: [], showToast: false,
      notificationReceiving: false, allDevices: [], deviceName: '', existingDevices: ''
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
        if (characteristic) {
          alert('Connected Successfully. You can check connection by Clicking on "IsConnected" Button')
          // this.setState({existingDevices: this.state.deviceid})
        } else {
          alert('Device not Connected')
        }
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
    var i = 0
    console.log('Scanning all devices!!!!')
    this.setState({ text1: "Scanning..." })
    this.manager.startDeviceScan(null, null, async (error, device) => {
      const { manufacturerData } = device;
      const MANUFACTURER_ID = manufacturerData && manufacturerData.substring(0, 4);
      // if (isDometicDevice(MANUFACTURER_ID)) {
      // console.log(device.id, "ID of all scanning devices");
      this.setState({ allDevices: [...this.state.allDevices, device.id] })
      // if (i < 3) {
      //   this.ConnectFunc(this.state.allDevices[i])
      //   console.log(this.state.allDevices[i], 'inside setState All devices')
      //   i++
      // }
      // if(this.state.existingDevices){
      //   // const ExID = this.state.allDevices.filter((item) => {
      //   //   if(this.state.existingDevices == item)
      //   //   {
      //   //     return item 
      //   //   }
      //   // })
      //   this.manager.stopDeviceScan();
      //   console.log(this.state.existingDevices, 'Console of ExID')
      //   this.ConnectFunc(this.state.existingDevices)
      // }
      if (null) {
        console.log('null')
      }
      if (error) {
        this.alert("Error in scan=> " + error)
        this.setState({ text1: "" })
        this.manager.stopDeviceScan();
        return
      }
      // if(i < 3)
      // {
      //   console.log(this.state.allDevices[0], 'inside if statement')
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
        if (device.id && characteristic.serviceUUID && characteristic.uuid) {
          this.setState({ deviceid: device.id, serviceUUID: characteristic.serviceUUID, characteristicsUUID: characteristic.uuid, device: device })
          this.setState({ text1: "Conneted to " + device.name })
          this.setState({ deviceName: device.name })
          this.writeMesage("ACK", "ACK Writted")
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
    this.manager.isDeviceConnected(this.state.deviceid).then((res) => {
      if (res) {
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
      this.setState({ deviceid: '', serviceUUID: '', characteristicsUUID: '', text1: '', device: {}, allDevices: [], deviceName: '' })
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