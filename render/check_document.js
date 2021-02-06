
const {spawn,exec}=require("child_process");
const { stdout, stderr } = require("process");
const fs=require("fs");


let upload_document_btn=null;
let upload_tip=null;
let upload_confirm=null;
let check_content_display=null;

function check_dom_get()//这个节点里的所有节点获得函数
{
    upload_document_btn=document.querySelector("#upload_btn_container .upload_btn");
    upload_tip=document.querySelector("#upload_tip");
    upload_confirm=document.querySelector("#upload_btn_container .confirm");
    check_content_display=document.querySelector("#check_content_display");
    let document_data=null;//存储选中文件的数据
    upload_document_btn.addEventListener("click",()=>
    {
        dialog.showOpenDialog({
            title:"选择你要上传的文档",
            buttonLabel:"选择这个文件",
            filters:[
                {name:"word",extensions:["docx","doc"]},
                {name:"excel",extensions:["xlsw"]}
            ],
            properties:["openFile","showHiddenFiles","promptToCreate"],
        },).then(result=>
        {
            check_document_select_tip(result);
            document_data=result;
        }).catch(err=>
        {
            console.log(err);
        });
    });
    upload_confirm.addEventListener("click",()=>
    {
        if(document_data!=null)
            check_document_start(document_data);
    });
}
function check_document_select_tip(data)//文档选择提示相关函数
{
    if(data==0)
    {
        let tip="没有选中文件校验";
        upload_tip.className="";
        upload_tip.innerHTML=tip;
    }
    else if(data==1)
    {
        let tip="正在校验，请稍后....";
        upload_tip.className="pass";
        upload_tip.innerHTML=tip;
    }
    else if(data==2)
    {
        let tip="校验成功，请查看！！";
        upload_tip.className="pass";
        upload_tip.innerHTML=tip;
    }
    else if(data==3)
    {
        let tip="校验失败，请查看文档名字是否存在空格或者存在其他非合格内容";
        upload_tip.className="";
        upload_tip.innerHTML=tip;
    }
    else
    {
        let tip="你总共选择了";
        tip+=data.filePaths.length?data.filePaths.length+"个文件，可以点击确认开始检查了":0+"个文件，请重新选择才可开始检查";
        upload_tip.innerHTML=tip;
        if(data.filePaths.length>0)
        {
            upload_tip.className="pass";
        }
        else
        {
            upload_tip.className="";
        }
    }
}
function check_document_start(data)//文档校验开始函数
{
    if(data.filePaths.length==0)
    {
        check_document_select_tip(0);
        return ;
    }
    check_document_select_tip(1);//使信息呈现加载中
    let parameter="";
    let filepath=[];
    let cmd=null;
    /*
        选中文件后,从所给的文件列表中检查是否存在doc文件，如果有将记录下来
        然后传给对应python脚本进行转码。
        转完码以后开始校验
    */

    //转码环节
    for(let key in data.filePaths)
    {
        let str=null;
        if(data.filePaths[key].endsWith("doc"))
        {
            parameter+=data.filePaths[key];
            if(key!=data.filePaths.length-1)
                parameter+=" ";
            str=data.filePaths[key]+"x";
        }
        else
            str=data.filePaths[key];
        filepath.push(str);
    }
    if(parameter!="")
    {
        exec("python ../render/word-transform.py "+parameter,{cwd:__dirname},(error,stdout,stderr)=>
        {
            if(error||stderr)
            {
                console.log(error,error.code);
                check_document_select_tip(3);
            }
            console.log("stdout:"+stdout);
        });
    }
    //校验环节
    /*
        和data里的数据进行比较，云服务器也是一样，调用python脚本进行校验并把输出结果保存为word文档和
        json数据返还给用户，再用js去请求json数据，把结果显示在界面上。

        因为目前没有云服务器，所以全都是在本地，调用python脚本也暂时是在本地的
    */
    if(filepath.length>0)
    {
        parameter="";
        for(let key in filepath)
        {
            parameter+=filepath[key];
            parameter+=(key==filepath.length-1)?"":" ";
        }
        exec("python ../render/word-compare.py "+parameter,{cwd:__dirname},(error,stdout,stderr)=>
        {
            if(error||stderr)
            {
                all_messagebox_tip(0);
                check_document_select_tip(3);
            }
            if(stdout)
            {
                cmd=stdout;
                if(cmd==200)
                {
                    compare_result_display(filepath)
                }
                else
                {
                    all_messagebox_tip(0);
                    check_document_select_tip(3);
                }
            }
        });
        
    }
}
function check_dom_request()//获得校验页面的dom函数
{
    let dom_http=new XMLHttpRequest();
    dom_http.open("GET","../page/check_document.html",true);
    dom_http.send(null);
    dom_http.addEventListener("load",()=>
    {
        request_empty_tip();
        document.querySelector("#main").innerHTML=dom_http.responseText;
        check_dom_get();
    });
    dom_http.addEventListener("error",()=>
    {
        all_messagebox_tip(1);
    });
    dom_http.addEventListener("progress",()=>
    {
        request_delay();
    });
}
function compare_result_display(filepath)//将返回的json数据呈现在校准页面上。
{
    let str=filepath[0];
    str=str.split("\\");
    str=str[str.length-1];
    str="result_"+str.replace(".docx",".json");//请求到对应的json数据
    let content_http=new XMLHttpRequest();
    content_http.open("GET","../data/"+str,true);
    content_http.send(null);
    content_http.addEventListener("load",()=>
    {
        let json=content_http.responseText;
                json=JSON.parse(json);
                if(check_content_display.hasChildNodes())
                    check_content_display.innerHTML="";
                let table=document.createElement("table");
                let thead=document.createElement("thead");
                let tbody=document.createElement("tbody");
                let tfoot=document.createElement("tfoot");
                let thead_tr=document.createElement("tr");
                for(let key in json[0])
                {
                    let td=document.createElement("td");
                    td.textContent=key;
                    thead_tr.append(td);
                }
                thead.append(thead_tr);
                for(let i in json)
                {
                    let tr=document.createElement("tr");
                    for(let key in json[i])
                    {
                        let td=document.createElement("td");
                        td.textContent=json[i][key];
                        tr.append(td);
                    }
                    tbody.append(tr);
                }
                table.append(thead);
                table.append(tbody);
                table.append(tfoot);
                table.className="search_result";
                check_content_display.append(table);
                all_messagebox_tip(2);
                check_document_select_tip(2);
    });
    content_http.addEventListener("error",()=>
    {
        all_messagebox_tip(1);
    });
    content_http.addEventListener("progress",()=>
    {
        check_document_select_tip(1);
    });
}


events.on("leavecheck",()=>{
    
});