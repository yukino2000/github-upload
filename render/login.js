
let remote=require("electron").remote;
const {dialog}=require("electron").remote;
const {ipcRenderer}=require("electron");


let inputtext=null;
let inputpassword=null;
let inputbtn=null;
let close=null;
let minimize=null;


window.onload=function()
{
    inputtext=document.querySelector("#bigbox .inputbox .inputtext input[type='text']");
    inputpassword=document.querySelector("#bigbox .inputbox input[type='password']");
    inputbtn=document.querySelector("#bigbox .inputbox input[type='button']");
    close=document.querySelector(".fa.fa-close");
    minimize=document.querySelector(".fa.fa-window-minimize");
    inputbtn.addEventListener("click",()=>
    {
        login_check()
    });
    document.onkeydown=(e)=>
    {
        if(e.keyCode==13)
            login_check();
    }
    close.onclick=()=>
    {
        remote.getCurrentWindow().close();
    }
    minimize.onclick=()=>
    {
        remote.getCurrentWindow().minimize();
    }
}
function login_check()
{
    if(inputtext.value=="12345"&&inputpassword.value=="12345")
    {
        ipcRenderer.send("access_permissions",true);
    }
    else
    {
        dialog.showMessageBox({
            type:"error",
            buttons:["确定"],
            title:"登陆失败",
            message:"请检查账号密码是否输入错误",
        });
    }
}