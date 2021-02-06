
const remote=require("electron").remote;
const {BrowserWindow,app}=require("electron").remote;
const {dialog}=require("electron").remote
const path=require("path");
const {shell}=require("electron");
const mysql=require("mysql");
const EventEmitter = require("events");
const events=new EventEmitter();
events.setMaxListeners(50);

let close=document.querySelector(".fa.fa-close");
let minimize=document.querySelector(".fa.fa-window-minimize");
let maxmize=document.querySelector(".fa.fa-window-maximize");
close.onclick=()=>
{
    remote.getCurrentWindow().hide();
}
minimize.onclick=()=>
{
    remote.getCurrentWindow().minimize();
}
maxmize.onclick=()=>
{
    remote.getCurrentWindow().maximize();
}

let globaltimeout=[];//定义全局变量定时器数组，每次请求新页面时，原页面的定时器务必清除，避免紊乱。

//该函数用于页面切换时，清除当前离开页面的延时请求函数
function clearalltimeout()
{
    console.log(globaltimeout.length);
    while(globaltimeout.length>0)
    {
        clearTimeout(globaltimeout.shift());
    }
}



window.onload=function()
{
    let option1={
        title:"app断开网络连接",
        body:"部分功能不能正常使用"
    };
    let option={
        title:"app成功连接网络",
        body:"app恢复正常使用"
    };
    window.addEventListener("online",()=>
    {
        new window.Notification(option.title,option);
    });
    window.addEventListener("offline",()=>
    {
        new window.Notification(option1.title,option1);
    });
    request_delay();
    main_library_dom_request();
    console.log("窗口加载完毕");
    //给加载页面注册点击事件，当点击之后页面消失，避免影响用户体验
    let loadbg=document.querySelector("#loadbg");
    loadbg.onclick=function()
    {
        loadbg.style.display="none";
    }
    addlistenertonav();
}

//给导航栏按钮注册点击事件
function addlistenertonav()
{
    let nav=document.querySelector("#nav");
    let leavelist=["leavemain","leavecollect","leavecheck"];
    let loadlist=["main_library_dom_request();","collect_dom_request()","check_dom_request();"];
    for(let a=2;a<=4;a++)
    {
        nav.children[a].onclick=function(){
            clearalltimeout();
            for(let b=0;b<leavelist.length;b++)
            {
                events.emit(leavelist[b]);
            }
            eval(loadlist[a-2]);
        };
    }
}

function all_messagebox_tip(data)
{
    if(data==0)//当解析文档出错时，弹出该信息框
    {
        dialog.showMessageBox({
            type:"error",
            buttons:["知道了"],
            title:"解析出现了问题",
            message:"解析文档时好像发生了什么错误，请检查一下你的文档内容是否符合提交标准或者网络状况",
            icon:"data/icon.png"
        });
    }
    else if(data==1)//当页面刷新时出现错误调用该提示框
    {
        let content="请求数据或者页面失败，请查看网络状况或者重启软件";
        dialog.showErrorBox("请求失败",content);
    }
    else if(data==2)//当文档解析完成时提示用户完成
    {
        dialog.showMessageBox({
            type:"none",
            buttons:["知道了"],
            title:"解析完成了！！",
            message:"已经成功解析生成对应的word，你可在你原本文件所在的目录去查看它！",
            icon:"data/icon.png"
        });
    }
}
function request_delay()//申请时页面等待提示函数
{
    let delay_content=document.querySelector("#loadbg");
    delay_content.children[0].src="../data/loading.gif";
    delay_content.style.display="flex";
}
function request_err()//请求出错提示函数
{
    let delay_content=document.querySelector("#loadbg");
    delay_content.children[0].src="../data/nofound.jpg";
    delay_content.style.display="flex";
}
function request_part()//只请求到部分数据函数
{
    let delay_content=document.querySelector("#loadbg");
    delay_content.children[0].src="../data/loadpart.jpg";
    delay_content.style.display="flex";
}

function request_empty_tip()
{
    let alltip=document.querySelector("#loadbg");
    alltip.style.display="none";
}
//定义防抖函数，用于某些容易占用大量系统资源的模块，防止模块过于频繁的使用而占用系统资源造成卡顿
function debounce(func,wait)
{
    let timer;
    let fu=func;
    let wait_time=wait;
    this.cleartime=function()
    {
        clearTimeout(timer);
    }
    this.run=function()
    {
        clearTimeout(timer);
        let ex=globaltimeout.indexOf(timer);
        globaltimeout.splice(ex,1);
        request_delay();
        timer=setTimeout(()=>{
            fu();
            let index=globaltimeout.indexOf(timer);
            globaltimeout.splice(index,1);
        },wait_time);
        return timer;
    }
    return this;
}
function throttle(func,wait)
{
    let timer;
    if(timer)
        return ;
    timer=setTimeout(()=>
    {
        func();
        timer=null;
    },wait);
}
