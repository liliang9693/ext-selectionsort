import ArgumentType from './extension-support/argument-type';
import BlockType from './extension-support/block-type';
import blockIconURI from './image/icon.svg';



class YourExtension{
    constructor(runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        return {
            name: 'Extension Test',
            blockIconURI: blockIconURI,
            blocks: [
                {  
                    opcode: 'calc',
                    blockType: BlockType.REPORTER,
                    text: '计算 [NUM1] [OPERATOR] [NUM2] 的值 ',
                    arguments: {
                        NUM1: {
                            type: ArgumentType.STRING,
                            defaultValue: 1
                        },
                        OPERATOR: {
                            type: ArgumentType.STRING,
                            menu: 'operator',
                            defaultValue: '+'
                        },
                        NUM2: {
                            type: ArgumentType.STRING,
                            defaultValue: 2
                        }
                    }
                }
            ],
            menus: {
                operator: ['+', '-', '*', '/']
            }
        }
    }
    // block运行函数, 与opcode同名
    calc (args) {
        // NUM1与NUM2参数都是'ArgumentType.STRING'类型, 所以要parseInt解析成number
        const num1 = parseInt(args.NUM1);
        const num2 = parseInt(args.NUM2);
        switch (args.OPERATOR){
            case '+':
                return num1 + num2;
            case '-':
                return num1 - num2;
            case '*':
                return num1 * num2;
            case '/':
                return num1 / num2;
            default:
                return 0;
        }
    }
}
module.exports = YourExtension;