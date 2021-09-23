import ArgumentType from './extension-support/argument-type';
import BlockType from './extension-support/block-type';
import blockIconURI from './image/icon.svg';



class YourExtension{
    constructor(runtime) {
        this.runtime = runtime;
        this.array1 = new Array;
    }

    getInfo () {
        return {
            name: '排序算法',
            color:'#23a8f2',
            blockIconURI: blockIconURI,
            blocks: [                
                {  
                    opcode: 'add_elements',
                    blockType: BlockType.COMMAND,
                    text: '将数字[ELEMENTS]加入排序列表',
                    arguments: {
                        TYPES:{
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        ELEMENTS: {
                            type: ArgumentType.STRING,
                            defaultValue: "1"
                        }
                    }
                },
                {  
                    opcode: 'delete_elements',
                    blockType: BlockType.COMMAND,
                    text: '删除排序列表中所有数字',
                    arguments: {
                        TYPES:{
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {  
                    opcode: 'selection_sort',
                    blockType: BlockType.COMMAND,
                    text: '将列表所有数字进行排序'
                },
                '---',//空行
                {  
                    // REPORTER类型
                    opcode: 'get_elements_list',
                    blockType: BlockType.REPORTER,
                    checkboxInFlyout:true,
                    text: '获取排序列表所有项',
                    arguments: {
                        TYPES:{
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {  
                    opcode: 'get_elements_item_count',
                    blockType: BlockType.REPORTER,
                    text: '排序列表的长度'
                },  
                {  
                    opcode: 'get_elements_item',
                    blockType: BlockType.REPORTER,
                    text: '获取排序列表第[NUM]项',
                    arguments: {
                        NUM:{
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                }
            ]
        }
    }
    // block运行函数, 与opcode同名
    selection_sort (args) {
        // NUM1与NUM2参数都是'ArgumentType.STRING'类型, 所以要parseInt解析成number
        
        var int_array = new Array();
        for(var i = 0; i < this.array1.length; i++){
            int_array.push(parseInt(this.array1[i]));
        }
        var len = int_array.length;
        var minIndex, temp;
        for (var i = 0; i < len - 1; i++) {
            minIndex = i;
            for (var j = i + 1; j < len; j++) {
                if (int_array[j] < int_array[minIndex]) {     // 寻找最小的数
                    minIndex = j;                 // 将最小数的索引保存
                }
            }
            temp = int_array[i];
            int_array[i] = int_array[minIndex];
            int_array[minIndex] = temp;
        }

        for(var i = 0; i < int_array.length; i++){
            this.array1[i]=int_array[i];
        }

        return this.array1;
    }
    delete_elements(args) {
        this.array1 = new Array;
        return true;
    }


    add_elements (args) {
        this.array1.push(args.ELEMENTS);
        return true;
    }

    get_elements_list(args){
        return this.array1.toString();
    }
    get_elements_item(args){
       // console.log(args.NUM)
       if(((args.NUM)<=this.array1.length)&&(args.NUM>0))
       {
           return this.array1[(args.NUM-1)].toString();
       }
        return 
    }
    get_elements_item_count(args){
       
        return this.array1.length;
    }
}
module.exports = YourExtension;