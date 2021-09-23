import ArgumentType from './extension-support/argument-type';
import BlockType from './extension-support/block-type';
let { setLocaleData, formatMessage } = require('../../src/translation/index');
import blockIconURI from './image/icon.svg';

setLocaleData({
    "en": {
        "extensionTest.extensionName": "Blocks",
        "extensionTest.whenReceive": "When I receive [TEXT]",
        "extensionTest.sendMessage": "send [TEXT]",
        "extensionTest.defaultText": "hello",
    },
    "zh-cn": {
        "extensionTest.extensionName": "积木类型",
        "extensionTest.whenReceive": "当接收到 [TEXT]",
        "extensionTest.sendMessage": "发送 [TEXT]",
        "extensionTest.defaultText": "你好",
    }
});

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
            name: 'Extension Test',
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {  
                    // 事件类型
                    opcode: 'whenReceive',
                    blockType: BlockType.HAT,
                    isEdgeActivated: false,
                    text: formatMessage({
                        id: "extensionTest.whenReceive",
                        default: 'When I receive [TEXT]'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: "extensionTest.defaultText",
                                default: 'hello'
                            })
                        }
                    }
                },
                '---',
                {  
                    // 布尔类型
                    opcode: 'compare',
                    blockType: BlockType.BOOLEAN,
                    text: '[NUM1] > [NUM2]',
                    arguments: {
                        NUM1: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        },
                        NUM2: {
                            type: ArgumentType.STRING,
                            defaultValue: '1'
                        }
                    }
                },
                {  
                    // REPORTER类型
                    opcode: 'add',
                    blockType: BlockType.REPORTER,
                    text: '[NUM1] + [NUM2]',
                    arguments: {
                        NUM1: {
                            type: ArgumentType.STRING,
                            defaultValue: '1'
                        },
                        NUM2: {
                            type: ArgumentType.STRING,
                            defaultValue: '2'
                        }
                    }
                },
                {
                    // 命令
                    opcode: "sendMessage",
                    text: formatMessage({
                        id: "extensionTest.sendMessage",
                        default: 'send [TEXT]'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: "extensionTest.defaultText",
                                default: 'hello'
                            })
                        }
                    }
                },
            ],
        }
    }

    whenReceive (args) {
        return true;
    }
    compare (args) {
        return parseInt(args.NUM1) > parseInt(args.NUM2);
    }
    add (args) {
        return parseInt(args.NUM1) + parseInt(args.NUM2);
    }
    sendMessage (args) {
        this.runtime.extensionStartHats('extensionTest.whenReceive', {TEXT: args.TEXT});
    }

}
module.exports = YourExtension;