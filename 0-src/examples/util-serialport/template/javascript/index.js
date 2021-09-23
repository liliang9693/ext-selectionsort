import ArgumentType from './extension-support/argument-type';
import BlockType from './extension-support/block-type';
import blockIconURI from './image/icon.svg';

const PERIPHERAL_REQUEST_ERROR = 'PERIPHERAL_REQUEST_ERROR';
const PERIPHERAL_LIST_UPDATE = 'PERIPHERAL_LIST_UPDATE';
const PERIPHERAL_SCAN_TIMEOUT = 'PERIPHERAL_SCAN_TIMEOUT';
const PERIPHERAL_CONNECTED = 'PERIPHERAL_CONNECTED';
const PERIPHERAL_DISCONNECTED = 'PERIPHERAL_DISCONNECTED';

const SERIAL_DATA_BUFFER_MAX = 1024;

class Peripheral {
    constructor (runtime, id) {
        this._runtime = runtime;
        this._extensionId = id;
        this._runtime.registerPeripheralExtension(this._extensionId, this);
        this._serialBuffer = Buffer.from([]);
    }

    scan () {
        console.log('scan');
        if (this._intervalID) clearInterval(this._intervalID);
        if (this._timeoutID) clearTimeout(this._timeoutID);
        const Serialport = this._runtime.getSerialport();
        this._intervalID = setInterval(() => {
            Serialport.list((err, ports) => {
                if (err) {
                    this._runtime.changePeripheralStatus(PERIPHERAL_REQUEST_ERROR);
                    clearInterval(this._intervalID);
                    this._intervalID = null;
                    clearTimeout(this._timeoutID);
                    this._timeoutID = null;
                } else {
                    const peripherals = ports.map(port => {
                        if (port.pnpId.indexOf('USB') === 0 || port.pnpId.indexOf('FTDIBUS') == 0) {
                            let name = '';
                            if (port.pnpId.indexOf('VID_1A86&PID_7523') !== -1) {
                                name = '-CH340';
                            } else if (port.pnpId.indexOf('VID_2341&PID_0043') !== -1) {
                                name = '-Uno';
                            } else if (port.pnpId.indexOf('VID_0D28&PID_0204') !== -1) {
                                name = '-Microbit';
                            } else if (port.pnpId.indexOf('VID_2341&PID_8036') !== -1) {
                                name = '-Leonardo';
                            } else if (port.pnpId.indexOf('VID_2341&PID_0036') !== -1) {
                                name = '-Leonardo-bootloader';
                            } else if (port.pnpId.indexOf('VID_0403+PID_6001') !== -1) {
                                name = '-FT232';
                            } else if (port.pnpId.indexOf('VID_10C4&PID_EA60') !== -1) {
                                name = '-CP210x';
                            } else if (port.pnpId.indexOf('VID_2341&PID_0042') !== -1) {
                                name = '-Mega2560';
                            }
                            return {
                                name: `${port.comName}${name}`,
                                peripheralId: port.comName
                            }
                        }
                        return null;
                    }).filter(item => item);

                    if (peripherals.length) {
                        this._runtime.changePeripheralStatus(PERIPHERAL_LIST_UPDATE, peripherals);
                        clearInterval(this._intervalID);
                        this._intervalID = null;
                        clearTimeout(this._timeoutID);
                        this._timeoutID = null;
                    }
                }
            })
        }, 1000);
        this._timeoutID = setTimeout(() => {
            this._runtime.changePeripheralStatus(PERIPHERAL_SCAN_TIMEOUT);
            clearInterval(this._intervalID);
            this._intervalID = null;
            this._timeoutID = null;
        }, 5000);
    }

    connect (id) {
        console.log('connect');
        const Serialport = this._runtime.getSerialport();
        this._serial = new Serialport(id, {
            baudRate: this._baudRate || 9600,  //波特率
            dataBits: 8,    //数据位
            parity: 'none',   //奇偶校验
            stopBits: 1,   //停止位
            flowControl: false,
            autoOpen: true
        });
        this._serial.on('open', () => {
            this._runtime.changePeripheralStatus(PERIPHERAL_CONNECTED);
        })
        this._serial.on('error', () => {
            console.log('error');
            this._runtime.changePeripheralStatus(PERIPHERAL_DISCONNECTED);
            if (this._serial && this._serial.isOpen) this._serial.close();
            this._serial = null;
        })
        this._serial.on('close', () => {
            console.log('close');
            this._runtime.changePeripheralStatus(PERIPHERAL_DISCONNECTED);
            if (this._serial && this._serial.isOpen) this._serial.close();
            this._serial = null;
        })
        this._serial.on('data', (data) => {
            data = Buffer.from(data);
            console.log('data', data.toString('hex'));
            this._serialBuffer = Buffer.concat([this._serialBuffer, data]);
            if (this._serialBuffer.length > SERIAL_DATA_BUFFER_MAX)
                this._serialBuffer = this._serialBuffer.slice(this._serialBuffer.length - SERIAL_DATA_BUFFER_MAX)
        })
    }

    disconnect () {
        if (this._serial && this._serial.isOpen) this._serial.close();
        this._serial = null;
        this._runtime.changePeripheralStatus(PERIPHERAL_DISCONNECTED);
    }

    isConnected () {
        return this._serial && this._serial.isOpen;
    }

    isAvailable () {
        return this._serialBuffer && this._serialBuffer.length;
    }

    getSerialData () {
        let temp = this._serialBuffer;
        // 清空串口缓存数据
        this._serialBuffer = Buffer.from([]);
        return temp;
    }

    compareData (type, data) {
        if (!this._serialBuffer.length) return false;
        if (type === 'original'){
            // 将用户输入的16进制字符串(00 01 FF ...) 转成buffer
            let buf = Buffer.from(data.split(' ').filter(item => item).map(item => parseInt(item, 16)));
            // 比较两个buffer
            let index = buf.compare(this._serialBuffer);
            console.log('original', buf, this._serialBuffer, index);
            // 清除 
            if (index !== -1) this._serialBuffer = this._serialBuffer.slice(index + buf.length);
            return index !== -1;
        } else {
            let text = this._serialBuffer.toString();
            // 比较两个文本
            let index = text.indexOf(data);
            if (index !== -1) this._serialBuffer = this._serialBuffer.slice(index + data.length);
            return index !== -1;
        }
    }

    write (data) {
        this._serial.write(Buffer.from(data));
    }

    setBaudRate (baud) {
        console.log('setBaudRate', baud);
        if (this.isConnected){
            this._serial.update({baudRate: baud});
        } else {
            this._baudRate = baud;
        }
    }

    flowControl (option) {
        console.log('flowControl', option);
        this._serial.set(option);
        
    }
}

class Scratch3SerialportBlocks {
    constructor(runtime, EXTENSION_ID) {
        this.runtime = runtime;
        console.log('EXTENSION_ID', EXTENSION_ID);
        this._peripheral = new Peripheral(this.runtime, EXTENSION_ID);
    }

    dispose () {
        this._peripheral.disconnect();
    }

    getInfo () {
        return {
            name: '串口',
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'whenReceivedMessage',
                    blockType: BlockType.HAT,
                    text: '当接收到 [TYPE] [MSG]',
                    arguments: {
                        MSG: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello'
                        },
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'messageType',
                            defaultValue: 'text'
                        }
                    }
                },
                '---'
                ,{  
                    opcode: 'sendData',
                    blockType: BlockType.COMMAND,
                    text: '发送 [TYPE] [MSG]',
                    arguments: {
                        MSG: {
                            type: ArgumentType.STRING,
                            defaultValue: 'hello'
                        },
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'messageType',
                            defaultValue: 'text'
                        }
                    }
                },
                {  
                    opcode: 'isAvailable',
                    blockType: BlockType.BOOLEAN,
                    text: '串口有数据可读'
                },
                {  
                    opcode: 'readData',
                    blockType: BlockType.REPORTER,
                    text: '读取 [TYPE]',
                    arguments: {
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'messageType',
                            defaultValue: 'text'
                        }
                    }
                },{  
                    opcode: 'setBaudRate',
                    blockType: BlockType.COMMAND,
                    text: '设置串口波特率 [BAUDRATE]',
                    arguments: {
                        BAUDRATE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 9600
                        }
                    }
                },{  
                    opcode: 'flowControl',
                    blockType: BlockType.COMMAND,
                    text: '设置 DTR [DTR] RTS [RTS]',
                    arguments: {
                        DTR: {
                            type: ArgumentType.STRING,
                            menu: 'boolean',
                            defaultValue: 'True'
                        },
                        RTS: {
                            type: ArgumentType.STRING,
                            menu: 'boolean',
                            defaultValue: 'True'
                        }
                    }
                }
            ],
            menus: {
                messageType: [
                    {
                        text: '原始数据',
                        value: 'original'
                    },{
                        text: '字符串',
                        value: 'text'
                    }
                ],
                boolean: ['True', 'False']
            }
        }
    }
    whenReceivedMessage (args) {
        // TYPE MSG 不是string类型 
        if (typeof args.TYPE !== 'string' || typeof args.MSG !== 'string' || !this._peripheral.isConnected()) return false;
        // 用户输入的 MSG 不符合16进制格式(00 01 FF ...)
        // if (!args.MSG || args.MSG.test) return;
        return this._peripheral.compareData(args.TYPE, args.MSG);
    }
    sendData (args) {
        if (typeof args.TYPE !== 'string' || typeof args.MSG !== 'string' || !this._peripheral.isConnected()) return;
        if (args.TYPE === 'original'){
            // 将字符串转成buffer
            let buf = Buffer.from(args.MSG.split(' ').filter(item => item).map(item => parseInt(item, 16)))
            this._peripheral.write(buf);
        } else {
            this._peripheral.write(args.MSG);
        }
    }
    isAvailable () {
        if (!this._peripheral.isConnected()) return false;
        return this._peripheral.isAvailable();
    }
    readData (args) {
        if (typeof args.TYPE !== 'string' || !this._peripheral.isConnected()) return;
        if (args.TYPE === 'original'){
            return this._peripheral.getSerialData().toString('hex').replace(/(.{2})/g,'$1 ').toUpperCase().slice(0, -1);
        } else {
            return this._peripheral.getSerialData().toString();
        }
    }
    setBaudRate (args) {
        this._peripheral.setBaudRate(parseInt(args.BAUDRATE));

    }
    flowControl (args) {
        if (!this._peripheral.isConnected()) return;
        this._peripheral.flowControl({dtr: args.DTR === 'True', rts: args.RTS === 'True'});
    }
}
module.exports = Scratch3SerialportBlocks;