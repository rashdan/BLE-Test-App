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

const getGateway = () => {
  return {
    BLE_COMMUNICATION: {
      BLE_SERVICE_UUID: '537a0400-0995-481f-926c-1604e23fd515',
      BLE_CHARACTERISTIC_WRITE_UUID: '537a0401-0995-481f-926c-1604e23fd515',
      BLE_CHARACTERISTIC_NOTIFY_UUID: '537a0402-0995-481f-926c-1604e23fd515',
    }
  }
};

const isDometicDevice = MANUFACTURER_ID => MANUFACTURING_ID_ARRAY.includes(MANUFACTURER_ID);

export default class App extends Component {

  constructor() {
    super()
    this.gateway = getGateway()
    this.bleSubscription = null;
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
        if (characteristic) {
          alert('Connected Successfully. You can check connection by Clicking on "IsConnected" Button')
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
    console.log('Scanning all devices!!!!')
    this.setState({ text1: "Scanning..." })
    this.manager.startDeviceScan(null, null, async (error, device) => {
      const { manufacturerData } = device;
      const MANUFACTURER_ID = manufacturerData && manufacturerData.substring(0, 4);
      // if (isDometicDevice(MANUFACTURER_ID)) {
      console.log(device.id, "ID of all scanning devices");
      this.setState({ allDevices: [...this.state.allDevices, device.id] })
      if (null) {
        console.log('null')
      }
      if (error) {
        this.alert("Error in scan=> " + error)
        this.setState({ text1: "" })
        this.manager.stopDeviceScan();
        return
      }
      // }
    });
  }

  ConnectFunc(id) {
    this.manager
      .connectToDevice(id, { autoConnect: true })
      .then(async device => {
        this.setState({ device: device })
        return device.discoverAllServicesAndCharacteristics();
      })
      .then(async device => {
        await this.manager.isDeviceConnected(device.id);
        await this.manager.characteristicsForDevice(
          device.id,
          this.gateway.BLE_COMMUNICATION.BLE_SERVICE_UUID,
        );
        this.listen();
        console.log('Success Message')
        alert('Connection Successfull')
        this.setState({deviceid: id})
      })
      .catch(err => {
        console.log(
          'bleDevice connect error - ',
          err,
          'error code',
          err.code,
        );
        if (err.errorCode === 2) {
          // 2 is OperationCancelled
          this.shouldRescan = true;
        }
      });
  }

  checkDeviceConnection() {
    const device = this.state.device;
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
    })
  }

  async listen() {
    this.bleSubscription = await this.manager.monitorCharacteristicForDevice(
      this.state.device.id,
      this.gateway.BLE_COMMUNICATION.BLE_SERVICE_UUID,
      this.gateway.BLE_COMMUNICATION.BLE_CHARACTERISTIC_NOTIFY_UUID,
      (error, characteristic) => {
        if (error) {
          console.log('characteristic error===>: ', error);
        } else {
          console.log('receive characteristic: ', characteristic.value);
          const bytes = base64ToBytes(characteristic.value);
          console.log('receive characteristic bytes===>: ', bytes);
        }
      },
    );
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
            {/* <TouchableOpacity style={styles.Button_container} onPress={() => this.writeMesage("ACK", "ACK Writted")}>
              <Text style={{ fontSize: 22, fontWeight: '600', color: 'white' }}>Connect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.Button_container} onPress={() => this.checkDeviceConnection()}>
              <Text style={{ fontSize: 22, fontWeight: '600', color: 'white' }}>Is Connected</Text>
            </TouchableOpacity> */}
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