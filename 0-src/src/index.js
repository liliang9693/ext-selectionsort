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
                    text: '将[ELEMENTS]加入排序列表',
                    arguments: {
                        ELEMENTS: {
                            type: ArgumentType.STRING,
                            defaultValue: "1"
                        }
                    }
                },
                {  
                    opcode: 'delete_elements',
                    blockType: BlockType.COMMAND,
                    text: '删除排序列表中所有项'
                },
                {  
                    opcode: 'selection_sort',
                    blockType: BlockType.COMMAND,
                    text: '将列表所有项进行排序 [MODE]',
                    arguments: {
                        MODE:{
                            type: ArgumentType.NUMBER,
                            menu: 'exMenu'
                        }
                    }
                    
                },
                '---',//空行
                {  
                    // REPORTER类型
                    opcode: 'get_elements_list',
                    blockType: BlockType.REPORTER,
                    checkboxInFlyout:true,
                    text: '获取排序列表所有项'
                },
                {  
                    opcode: 'get_elements_item_count',
                    blockType: BlockType.REPORTER,
                    text: '排序列表的长度'
                },  
                {  
                    opcode: 'get_elements_item',
                    blockType: BlockType.REPORTER,
                    text: '获取排序列表第[NUM]项的值',
                    arguments: {
                        NUM:{
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                }
            ],
            menus: {
                exMenu: {
                    items: [{text: "降序" ,value:'down'}, {text: "升序" ,value:'up'}]
                }
            }
        }
    }
    // block运行函数, 与opcode同名
    //可以允许以“中文+数字”形式传参，排序之后依然保持“中文+数字”形式，注意不能用“中文+数字+中文”或者“数字+中文”形式传参
    selection_sort (args) {
        // NUM1与NUM2参数都是'ArgumentType.STRING'类型, 所以要parseInt解析成number
        // console.log(`array1:${this.array1.toString()}`)
        var int_array = new Array();
        var id_array = new Array();
        //拆分文字与数字
        for(var i = 0; i < this.array1.length; i++){//遍历字符串数组
            // console.log("i-start")
            for (var j = 0; j < this.array1[i].length; j++) {//遍历数组中每一个字符串的每一个字符，根据ascii字符区分
                // console.log(`i=${i} j=${j} this.array1[i].length=${this.array1[i].length} this.array1[i].charCodeAt(0)=${this.array1[i].charCodeAt(j)} `)
                if((this.array1[i].charCodeAt(0)>=48)&&(this.array1[i].charCodeAt(0)<=57)){//直接就是数字开始则认为没有中文
                    // console.log("no string")
                    id_array.push("");
                    int_array.push(Number(this.array1[i]));
                    break;//不用继续遍历每一个字符了，直接下一个数组元素
                }

                if((this.array1[i].charCodeAt(j)>=48)&&(this.array1[i].charCodeAt(j)<=57)){//根据ascii判断是否到了数字开始点
                    // console.log("<256")
                    var ids = this.array1[i].substr(0,j);//前面中文后面数字，字符串截取
                    var nums = this.array1[i].substr(j);
                    // console.log(`id=${a} number=${b}`)
                    int_array.push(Number(nums));//将前面的字符和后面的数字分别存放
                    id_array.push(ids);
                    break;
                }
                else{
                    //console.log(">256")
                }    
                
            }
            //console.log("i-end")

        }
        //console.log("end")
        //console.log(`int_array:${int_array.toString()}`)
        //console.log(`id_array:${id_array.toString()}`)

        //冒泡排序
        var len = int_array.length;
        var minIndex, temp,temp_id;
        for (var i = 0; i < len - 1; i++) {
            minIndex = i;
            for (var j = i + 1; j < len; j++) {
                if (int_array[j] < int_array[minIndex]) {     // 寻找最小的数
                    minIndex = j;                 // 将最小数的索引保存
                }
            }
            temp = int_array[i];
            temp_id = id_array[i];
            int_array[i] = int_array[minIndex];
            id_array[i] = id_array[minIndex];//中文所在的数组一起交换位置
            int_array[minIndex] = temp;
            id_array[minIndex] = temp_id;
        }

        // console.log("paixuhou:")
        // console.log(`int_array:${int_array.toString()}`)
        // console.log(`id_array:${id_array.toString()}`)

        //console.log(args.MODE) ;

        if(args.MODE=="up"){//升序降序
            for(var i = 0; i < int_array.length; i++){
                this.array1[i]=`${id_array[i]}${int_array[i]}`;
            }
        }else if(args.MODE=="down"){
            for(var i = 0; i < int_array.length; i++){
                this.array1[i]=`${id_array[int_array.length-i-1]}${int_array[int_array.length-i-1]}`;
                //console.log(id_array[int_array.length-i-1])
            }
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