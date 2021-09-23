import ArgumentType from './extension-support/argument-type';
import BlockType from './extension-support/block-type';
import blockIconURI from './image/icon.svg';

let { setLocaleData, formatMessage } = require('./translation/index');



const PN532_I2C_ADDRESS = 0x24;
const PN532_COMMAND_SAMCONFIGURATION = 0x14;
const PN532_PREAMBLE = 0x00;
const PN532_STARTCODE2 = 0xFF;
const PN532_HOSTTOPN532 = 0xD4;
const PN532_POSTAMBLE = 0x00;

class NFC {
    constructor (runtime) {
        this.runtime = runtime;
        this.board = runtime.getBoard();
        this.addr = PN532_I2C_ADDRESS;
        this._passWord = new Uint8Array(6);
        this._passWord.fill(0xff)
        this.enable = false;
    }
    init () {
        let packet = [
            PN532_COMMAND_SAMCONFIGURATION, 
            0x01, // normal mode;
            0x14, // timeout 50ms * 20 = 1 second
            0x01, // use IRQ pin!
            0x00, 
            0x00
        ]
        // i2c 初始化
        this.board.i2cConfig();
        // delay(20)
        const buf = new Uint8Array(12);
        buf[0] = PN532_PREAMBLE;
        buf[1] = PN532_PREAMBLE;
        buf[2] = PN532_STARTCODE2;
        buf[3] = 5;
        buf[4] = ~buf[3] + 1;
        buf[5] = PN532_HOSTTOPN532;
        // checksum
        let sum = PN532_PREAMBLE + PN532_PREAMBLE + PN532_STARTCODE2 + PN532_HOSTTOPN532;
        for (let i = 0; i < 4; i++) {
            buf[6+i] = packet[i];
            sum += packet[i];
        }
        buf[10] = sum;
        buf[10] = ~buf[10];
        buf[11] = PN532_POSTAMBLE;
        this.board.i2cWrite(this.addr, [...buf]);
        // delay(10);
        return this.readData(14)
            .then((data) => {
                if (data[12] !== 0x15) return Promise.reject();
                this.enable = true;
            })
    }

    detect (_uid) {
        if (!this.enable) return Promise.reject('no init');
        let UIDCommand = new Uint8Array([0x00, 0x00, 0xFF, 0x04, 0xFC, 0xD4, 0x4A, 0x01, 0x00, 0xE1, 0x00]);
        
        this.board.i2cWrite(this.addr, [...UIDCommand]);
        let uid = new Uint8Array(4, 0x00);
        return this.readData(25).then((data) => {
            for (let i = 0; i < 4; i++) {
                uid[i] = data[i + 19];
            }
            if(uid[0] === 0xFF && uid[1] === 0xFF && uid[2] === 0xFF && uid[3] === 0xFF) return false;
            if(uid[0] === 0x80 && uid[1] === 0x80 && uid[2] === 0x80 && uid[3] === 0x80) return false;
            if (_uid) {
                let uidStr = '';
                for (let i = 0; i < 4; i++) {
                    let str = uid[i].toString(16);
                    uidStr += str.length > 1 ? str : `0${str}`;
                }
                return uidStr === _uid;
            }
            return true;
        })
        .catch(() => false);
    }
    readUID () {
        if (!this.enable) return Promise.reject('no init');
        let UIDCommand = new Uint8Array([0x00, 0x00, 0xFF, 0x04, 0xFC, 0xD4, 0x4A, 0x01, 0x00, 0xE1, 0x00]);
        this.board.i2cWrite(this.addr, [...UIDCommand]);
        return this.readData(25).then((data) => {
            let uid = new Uint8Array(4, 0x00)
            for (let i = 0; i < 4; i++) {
                uid[i] = data[i + 19];
            }
            if(uid[0] === 0xFF && uid[1] === 0xFF && uid[2] === 0xFF && uid[3] === 0xFF) return '';
            if(uid[0] === 0x80 && uid[1] === 0x80 && uid[2] === 0x80 && uid[3] === 0x80) return '';

            let uidStr = '';
            for (let i = 0; i < 4; i++) {
                let str = uid[i].toString(16);
                uidStr += str.length > 1 ? str : `0${str}`;
            }
            return uidStr;
        })
        .catch(() => '');
    }

    readBlockData (page, isStr = true) {
        if (!this.enable) return Promise.reject('no init');
        return this.checkPassword(page, this._passWord)
            .then(() => {
                let readCommand = new Uint8Array([0x00,0x00,0xff,0x05,0xfb,0xD4,0x40,0x01,0x30,0x07,0xB4,0x00]);
                readCommand[9] = page;
                let sum = 0;
                for(let i = 0; i < 10; i++) sum += readCommand[i];
                readCommand[10] = 0xff - sum & 0xff;
                this.board.i2cWrite(this.addr, [...readCommand]);
                return this.readData(32);
            })
            .then((data) => {
                if (this.checkDCS(32, data) && data[12] === 0x41 && data[13] === 0x00){
                    let blockData = new Uint8Array(16);
                    for(let i = 0; i < 16; i++) {
                        blockData[i] = data[i + 14];
                    }
                    if (!isStr) return blockData;
                    return blockData.map(item => {
                        let str = item.toString(16);
                        return str.length > 1 ? str : `0${str}`;
                    }).join(' ');
                }
                return '';
            })
    }

    readByteData (page, index) {
        return this.readBlockData(page, false).then(data => data[index - 1]);
    }

    writeData (page, index, value) {
        return this.readBlockData(page, false)
            .then(data => {
                if (!data) return;
                data[index - 1] = value;
                let writeCommand = new Uint8Array([0x00,0x00,0xff,0x15,0xEB,0xD4,0x40,0x01,0xA0,0x06,0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F,0xCD,0x00]);
                writeCommand[9] = page;
                let sum = 0;
                for(let i = 10; i < 26; i++) writeCommand[i] = data[i - 10];// 待写入的数据
                for(let i = 0; i < 26; i++) sum += writeCommand[i];//加和
                writeCommand[26] = 0xff - sum & 0xff;//  计算DCS
                this.board.i2cWrite(this.addr, [...writeCommand]);
                return this.readData(16);
            })
            .then(() => new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 100);
            }))
    }

    reset () {

    }

    checkPassword (page, password) {
        if (!this.enable) return Promise.reject('no init');
        let UIDCommand = new Uint8Array([0x00, 0x00, 0xFF, 0x04, 0xFC, 0xD4, 0x4A, 0x01, 0x00, 0xE1, 0x00]);
        this.board.i2cWrite(this.addr, [...UIDCommand]);
        return this.readData(25).then((data) => {
            let uid = new Uint8Array(4, 0x00)
            for (let i = 0; i < 4; i++) {
                uid[i] = data[i + 19];
            }
            if(uid[0] === 0xFF && uid[1] === 0xFF && uid[2] === 0xFF && uid[3] === 0xFF) return Promise.reject('no card');
            if(uid[0] === 0x80 && uid[1] === 0x80 && uid[2] === 0x80 && uid[3] === 0x80) return Promise.reject('no card');
            return uid;
        })
        .then((uid) => {
            let passwordCommand = new Uint8Array([0x00,0x00,0xFF,0x0F,0xF1,0xD4,0x40,0x01,0x60,0x07,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xD1,0xAA,0x40,0xEA,0xC2,0x00]);
            passwordCommand[9] = page;
            let sum = 0;
            for(let i = 10; i < 16; i++) passwordCommand[i] = password[i-10];// 密码
            for(let i = 16; i < 20; i++) passwordCommand[i] = uid[i-16];// UID
            for(let i = 0; i < 20; i++) sum += passwordCommand[i];
            passwordCommand[20] = 0xff - sum & 0xff;
            this.board.i2cWrite(this.addr, [...passwordCommand]);
            return this.readData(16);
        })
        .then((data) => {
            return this.checkDCS(16, data) && data[12] === 0x41 && data[13] === 0x00;
        })
    }

    checkDCS (num, data) {
        let sum = 0, dcs = 0;
        for(let i = 6; i < num - 2; i++) {
            sum += data[i];
        }
        dcs = 0xff - sum & 0xff;
        return dcs === data[num - 2];
    }

    readData (x, timeout) {
        return new Promise((resolve, reject) => {
            let ack = new Uint8Array([0x00, 0x00, 0xFF, 0x00, 0xFF, 0x00]);
            this.board.sendI2CReadRequest(this.addr, 8, (data) => {
                let _receive = new Uint8Array(35);
                for (let i = 0; i < 6; i++) {
                    _receive[i] = data[i+1];
                }
                // delay(100);
                setTimeout(() => {
                    this.board.sendI2CReadRequest(this.addr, x-4, (data1) => {
                        for (let i = 0; i < x - 6; i++) {
                            _receive[6+i] = data1[i+1];
                        }
                        this.compare(ack, _receive, 6) ? resolve(_receive) : reject();
                    })
                }, 100);
            })

            setTimeout(() => {
                reject('timeout');
            }, timeout || 3000);
        })
    }
    compare (arr, arr1, length) {
        if (arr.length < length || arr1.length < length) return false;
        for (let i = 0; i < length; i++) {
            if (arr[i] !== arr1[i]) return false;
        }
        return true;
    }
}


setLocaleData({
    "en": {
        "extensionTest.initNFC": "Initialize the NFC module(I2C)",
        "extensionTest.writeData": "Write [VALUE] to byte [BYTES] of block [DATABLOCK]",
        "extensionTest.detectCard": "Card detected?",
        "extensionTest.readBlockData": "Read all data (string) of block [DATABLOCK]",
        "extensionTest.readByteData": "Read byte [BYTES] of block [DATABLOCK](number)",
        "extensionTest.detectCardByUID": "UID [UID] Card detected?",
        "extensionTest.readCardUID": "Read UID of card",
    },
    "zh-cn": {
        "extensionTest.initNFC": "初始化NFC模块(I2C)",
        "extensionTest.writeData": "在数据块[DATABLOCK]第[BYTES]字节写入[VALUE]",
        "extensionTest.detectCard": "检测到卡片?",
        "extensionTest.readBlockData": "读取数据块[DATABLOCK]的所有数据(string)",
        "extensionTest.readByteData": "读取数据块[DATABLOCK]的第[BYTES]字节(number)",
        "extensionTest.detectCardByUID": "检测到UID[UID]卡片?",
        "extensionTest.readCardUID": "读取卡片的UID",
    }
});

const BYTES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];

const DATABLOCK = ['1', '2', '4', '5', '6', '8', '9', '10', '12', '13', '14', '16', '17', '18', '20', '21', '22', '24', '25', '26', '28', '29', '30', '32', '33', '34', '36', '37', '38', '40', '41', '42', '44', '45', '46', '48', '49', '50', '52', '53', '54', '56', '57', '58', '60', '61', '62'];


class YourExtension {
    constructor(runtime) {
        this.runtime = runtime;
        formatMessage = formatMessage.bind(null, runtime.getLocale);
        this.nfc = new NFC(runtime);
        this.board = this.runtime.getBoard();
    }

    static get EXTENSION_ID () {
        return 'extensionTest';
    }

    getInfo () {
        return {
            id: YourExtension.EXTENSION_ID,
            name: 'NFC',
            blockIconURI: blockIconURI,
            blockIconHeight: 38,
            color: '#616e7f',
            blocks: [
                {
                    opcode: "initNFC",
                    text: formatMessage({
                        id: "extensionTest.initNFC",
                        default: 'Initialize the NFC module(I2C)'
                    }),
                    blockType: BlockType.COMMAND,
                },
                {
                    opcode: 'writeData',
                    text: formatMessage({
                        id: "extensionTest.writeData",
                        default: 'Write [VALUE] to byte [BYTES] of block [DATABLOCK]'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        DATABLOCK: {
                            type: ArgumentType.STRING,
                            menu: 'datablockMenu',
                            // onlyField: true,
                            defaultValue: DATABLOCK[0]
                        },
                        BYTES: {
                            type: ArgumentType.STRING,
                            menu: 'bytesMenu',
                            // onlyField: true,
                            defaultValue: BYTES[0]
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 200
                        }
                    }
                },
                {  
                    opcode: 'readCardUID',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "extensionTest.readCardUID",
                        default: 'Read UID of card'
                    })
                },
                {  
                    opcode: 'readBlockData',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "extensionTest.readBlockData",
                        default: 'Read all data (string) of block [DATABLOCK]'
                    }),
                    arguments: {
                        DATABLOCK: {
                            type: ArgumentType.STRING,
                            menu: 'datablockMenu',
                            defaultValue: DATABLOCK[0]
                        }
                    }
                },
                {  
                    // REPORTER类型
                    opcode: 'readByteData',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "extensionTest.readByteData",
                        default: 'Read byte [BYTES] of block [DATABLOCK](number)'
                    }),
                    arguments: {
                        DATABLOCK: {
                            type: ArgumentType.STRING,
                            menu: 'datablockMenu',
                            defaultValue: DATABLOCK[0]
                        },
                        BYTES: {
                            type: ArgumentType.STRING,
                            menu: 'bytesMenu',
                            // onlyField: true,
                            defaultValue: BYTES[0]
                        }
                    }
                },
                {  
                    opcode: 'detectCard',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: "extensionTest.detectCard",
                        default: 'Card detected?'
                    })
                },
                {  
                    opcode: 'detectCardByUID',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: "extensionTest.detectCardByUID",
                        default: 'UID [UID] Card detected?'
                    }),
                    arguments: {
                        UID: {
                            type: ArgumentType.STRING,
                            defaultValue: '4978ef9c'
                        }
                    }
                }
            ],
            menus: {
                datablockMenu: DATABLOCK,
                bytesMenu: BYTES,
            }
        }
    }

    initNFC (args, util) {
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return;
        // 查询串口写是否占用
        if (this.board.serialWriteIsAvailable()){
            this.board.setSerialWriteBusy(true);
            return this.nfc.init().finally(()=>{this.board.setSerialWriteBusy(false)})
        } else {
            util.yield();
            this.runtime.requestBreakThreads();
        }
    }
    writeData (args, util) {
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return;
        if (!this.runtime.isBuildinBoardConnected()) return '';
        // 查询串口写是否占用
        if (this.board.serialWriteIsAvailable()){
            this.board.setSerialWriteBusy(true);
            return this.nfc.writeData(parseInt(args.DATABLOCK), parseInt(args.BYTES), parseInt(args.VALUE)).finally(()=>{this.board.setSerialWriteBusy(false)})
        } else {
            util.yield();
            this.runtime.requestBreakThreads();
        }
    }
    detectCard (args, util) {
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return;
        // 查询串口写是否占用
        if (this.board.serialWriteIsAvailable()){
            this.board.setSerialWriteBusy(true);
            return this.nfc.detect().finally(()=>{this.board.setSerialWriteBusy(false)})
        } else {
            util.yield();
            this.runtime.requestBreakThreads();
        }
    }
    readByteData (args, util) {
        if (!this.runtime.isBuildinBoardConnected()) return '';
        // 查询串口写是否占用
        if (this.board.serialWriteIsAvailable()){
            this.board.setSerialWriteBusy(true);
            return this.nfc.readByteData(parseInt(args.DATABLOCK), parseInt(args.BYTES)).finally(()=>{this.board.setSerialWriteBusy(false)})
        } else {
            util.yield();
            this.runtime.requestBreakThreads();
        }

    }
    readBlockData (args, util) {
        if (!this.runtime.isBuildinBoardConnected()) return '';
        // 查询串口写是否占用
        if (this.board.serialWriteIsAvailable()){
            this.board.setSerialWriteBusy(true);
            return this.nfc.readBlockData(parseInt(args.DATABLOCK)).finally(()=>{this.board.setSerialWriteBusy(false)})
        } else {
            util.yield();
            this.runtime.requestBreakThreads();
        }
    }
    detectCardByUID (args, util) {
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return false;
        if (!args.UID) return false;
        // 查询串口写是否占用
        if (this.board.serialWriteIsAvailable()){
            this.board.setSerialWriteBusy(true);
            return this.nfc.detect(args.UID).finally(()=>{this.board.setSerialWriteBusy(false)})
        } else {
            util.yield();
            this.runtime.requestBreakThreads();
        }
    }
    readCardUID (args, util) {
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return false;
        // 查询串口写是否占用
        if (this.board.serialWriteIsAvailable()){
            this.board.setSerialWriteBusy(true);
            return this.nfc.readUID().finally(()=>{this.board.setSerialWriteBusy(false)})
        } else {
            util.yield();
            this.runtime.requestBreakThreads();
        }
    }
}
module.exports = YourExtension;