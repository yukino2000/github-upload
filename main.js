const {app,BrowserWindow,Tray,Menu} = require("electron");
let path=require("path");
const { IncomingMessage } = require("http");
const { BrowserView } = require("electron");
const {ipcMain}=require("electron");
let win=null;
let tray=null;
let tray_menu=null;

app.on("ready",function()
{
    login_browser();
});
ipcMain.on("access_permissions",(event,param)=>
{
    if(param)
    {
        win.hide();
        main_browser();
        tray_establish();
    }
});
function tray_establish()
{
    tray=new Tray(path.join(__dirname,"data/icon.png"));
    tray.on("click",()=>
    {
        win.show();
    });
    tray_menu=Menu.buildFromTemplate([{
        click()
        {
            win.minimize();
        },
        label:"最小化",
        type:"normal"
    },{
        click()
        {
            win.maximize();
        },
        label:"最大化",
        type:"normal"
    },{
        click()
        {
            tray.destroy();
            tray=null;
            win.close();
        },
        label:"退出应用",
        type:"normal"
    }])
    tray.setContextMenu(tray_menu);
}
function login_browser()
{
    win=new BrowserWindow({
        webPreferences:{nodeIntegration:true},
        useContentSize:true,
        height:340,
        width:496,
        frame:false,
        resizable:false,
        icon:"data/icon.png",
        center:true,
        hasShadow:true,
        title:"航油规范检索",
    });
    win.loadFile("page/login.html");
    win.webContents.openDevTools({mode:"detach",activate:false});
    win.on("close",()=>
    {
        win=null;
    })
    win.once("ready-to-show",()=>
    {
        win.show();
    });
}
function main_browser()
{
    win=new BrowserWindow(
        {
            webPreferences:
            {
                nodeIntegration:true,
            },
             width:1000,
             height:800,
             frame:false,
             minHeight:650,
             minWidth:650,
             icon:path.join(__dirname,"data/icon.png"),
             title:"航油规范检索",
             plugin:true,
             show:false
        });
        win.loadFile("page/main.html");
        win.webContents.openDevTools({mode:"detach",activate:false});//打开开发者工具
        win.on("close",function(e)
        {
            if(tray==null)
            {
                win=null;
                app.quit();
            }
            else
            {
                e.preventDefault();
                win.hide();
            }
        });
        win.once("ready-to-show",()=>
        {
            win.show();
        });
    
}