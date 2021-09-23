import ArgumentType from './extension-support/argument-type';
import BlockType from './extension-support/block-type';
import blockIconURI from './image/icon.svg';

let { setLocaleData, formatMessage } = require('./translation/index');

setLocaleData({
    "en": {
        "extensionTest.digitalRead": "read pin [PIN] digital value",
        "extensionTest.analogRead": "read pin [PIN] analog value",
        "extensionTest.digitalWrite": "set digital pin [PIN] to [LEVEL]",
        "extensionTest.analogWrite": "set analog pin [PIN] to [VALUE]",
        "extensionTest.levelHigh": "high",
        "extensionTest.levelLow": "low",
    },
    "zh-cn": {
        "extensionTest.digitalRead": "读取数字引脚 [PIN]",
        "extensionTest.analogRead": "读取模拟引脚 [PIN]",
        "extensionTest.digitalWrite": "设置数字引脚 [PIN] 为 [LEVEL]",
        "extensionTest.analogWrite": "设置模拟引脚 [PIN] 的值为 [VALUE]",
        "extensionTest.levelHigh": "高",
        "extensionTest.levelLow": "低",

    }
});

const LEVEL = {
    HIGH: 'high',
    LOW: 'low' 
}

class YourExtension {
    constructor(runtime) {
        this.runtime = runtime;
        formatMessage = formatMessage.bind(null, runtime.getLocale);
    }

    static get EXTENSION_ID () {
        return 'extensionTest';
    }

    getInfo () {
        return {
            id: YourExtension.EXTENSION_ID,
            name: 'Pin Controller',
            blockIconURI: blockIconURI,
            blockIconHeight: 38,
            blocks: [
                {  
                    // 布尔类型
                    opcode: 'digitalRead',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: "extensionTest.digitalRead",
                        default: 'read pin [PIN] digital value'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digitalPins',
                            defaultValue: this._initDigitalPinsParam()[0].value
                        }
                    },
                },
                {  
                    // REPORTER类型
                    opcode: 'analogRead',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: "extensionTest.analogRead",
                        default: 'read pin [PIN] analog value'
                    }),
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'analogPins',
                            defaultValue: this._initAnalogPinsParam()[0].value
                        }
                    }
                },
                {
                    // 命令
                    opcode: "digitalWrite",
                    text: formatMessage({
                        id: "extensionTest.digitalWrite",
                        default: 'set digital pin [PIN] to [LEVEL]'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digitalPins',
                            defaultValue: this._initDigitalPinsParam()[0].value
                        },
                        LEVEL: {
                            type: ArgumentType.STRING,
                            menu: 'level',
                            defaultValue: this._initLevelParam()[0].value
                        }
                    }
                },
                {
                    // 命令
                    opcode: "analogWrite",
                    text: formatMessage({
                        id: "extensionTest.analogWrite",
                        default: 'set analog pin [PIN] to [VALUE]'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'digitalPins',
                            defaultValue: this._initDigitalPinsParam()[0].value
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: '255'
                        }
                    }
                }
            ],
            menus: {
                digitalPins: this._initDigitalPinsParam(),
                analogPins: this._initAnalogPinsParam(),
                level: this._initLevelParam(),
            }
        }
    }

    _initDigitalPinsParam () {
        switch (this.runtime.getBoardName()){
            case 'microbit': 
                return [
                    'P0', 'P1', 'P2', 'P3', 'P4', 'P5', 
                    'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 
                    'P12', 'P13', 'P14', 'P15', 'P16'
                ].map((item, index) => ({text: item, value: index}));
            case 'arduino':
            default:
                return [
                    '2', '3', '4', '5', '6', '7', '8', '9', 
                    '10', '11', '12', '13', 'A0', 'A1', 'A2',
                    'A3', 'A4', 'A5'
                ].map((item, index) => ({text: item, value: index + 2}));
        }
    }

    _initAnalogPinsParam () {
        switch (this.runtime.getBoardName()){
            case 'microbit': 
                return [
                    'P0', 'P1', 'P2', 'P3', 'P4', 'P10'
                ].map((item, index) => ({text: item, value: index}));
            case 'arduino':
            default:
                return [
                    'A0', 'A1', 'A2', 'A3', 'A4', 'A5'
                ].map((item, index) => ({text: item, value: index}));
        }
    }

    _initLevelParam () {
        return [
            {
                text: formatMessage({id: 'extensionTest.levelHigh'}),
                value: LEVEL.HIGH
            },
            {
                text: formatMessage({id: 'extensionTest.levelLow'}),
                value: LEVEL.LOW
            }
        ]
    }

    digitalRead (args, util) {
        console.log(args);
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return;
        // 获取主板对象
        const board = this.runtime.getBoard();
        console.log(parseInt(args.PIN));
        return board.digitalRead(parseInt(args.PIN), util);
    }
    analogRead (args, util) {
        console.log(args);
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return;
        // 获取主板对象
        const board = this.runtime.getBoard();
        console.log(parseInt(args.PIN));
        return board.analogRead(parseInt(args.PIN), util);
    }
    digitalWrite (args, util) {
        console.log(args);
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return;
        // 获取主板对象
        const board = this.runtime.getBoard();
        console.log(parseInt(args.PIN));
        return board.digitalWrite(parseInt(args.PIN), args.LEVEL === 'high' ? 1 : 0, util);
    }
    analogWrite (args, util) {
        console.log(args);
        // 内置主板是否连接
        if (!this.runtime.isBuildinBoardConnected()) return;
        // 获取主板对象
        const board = this.runtime.getBoard();
        console.log(parseInt(args.PIN));
        return board.analogWrite(parseInt(args.PIN), parseInt(args.VALUE), util);
    }

}
module.exports = YourExtension;