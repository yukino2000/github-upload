
let search_listenr=null;
let main_search_bounce=null;
let main_json_data=[];//所有请求到的主库信息
let main_json_request=null;
let main_json_option=[];//存储满足所有搜索选项的数据
let main_modify_json=null;//获得所有的修改单，给每个有修改单的标准给予索引和链接

function main_library_dom_request()//请求主库页面
{
    let httpxml=null;
    function loaddom(url)
    {
        httpxml=new XMLHttpRequest();
        httpxml.open("GET",url,true);
        httpxml.send(null);
    }
    let str_url=path.join(__dirname,"\\..\\page\\main_library.html");
    loaddom(str_url);
    //监听请求节点完成时，执行以下事件。
    httpxml.addEventListener("load",()=>
    {
        request_empty_tip();
        document.querySelector("#main").innerHTML=httpxml.responseText;
        events.emit("loadmain");
    });
    //当请求事件正在进行时，执行请求等待提示函数。
    httpxml.addEventListener("progress",()=>
    {
        request_delay();
    });
    //当请求报错时，执行警告。
    httpxml.addEventListener("error",()=>
    {
        request_err();
    });
}


function state_check()//状态查看，标记现行和废止等的状态
{
    let dom_check=document.querySelector("#main .search_result tbody");
    for(let i=0;i<dom_check.childElementCount;i++)
    {
        if(dom_check.childNodes[i].childNodes[4].textContent.includes("现行"))
            dom_check.childNodes[i].childNodes[4].style.color="green";
        else if(dom_check.childNodes[i].childNodes[4].textContent.includes("废止"))
            dom_check.childNodes[i].childNodes[4].style.color="red";
        else
            dom_check.childNodes[i].childNodes[4].style.color="blue";
    }
}

events.on("loadmain",()=>          //触发主库页面加载完全事件。
{
    main_json_request=main_mysqlconnection();
    globaltimeout.push(debounce(main_requestdata,1000).run());
    register_page_change();
    let float_div=document.querySelector(".float_modifysheet");
    float_div.addEventListener("mouseleave",()=>
    {
        float_div.style.display="none";
    });

    //给搜索按钮注册点击事件，使其拥有搜索功能。
    document.querySelector("#main .bar button.input_btn").addEventListener("click",()=>
    {
        if(main_json_data!=null)
        {
            request_empty_tip();
            globaltimeout.push(debounce(search_result,1000).run());
        }
        else
            request_err();
    });
    //给回车键注册搜索功能。
    document.onkeydown=(e)=>
    {
        if(e.code=="Enter")
        {
            if(main_json_data!=null)
            {
                request_delay();
                globaltimeout.push(debounce(search_result,1000).run());
            }
            else
                request_err();
        }
    }

});

//触发离开主库页面事件
events.on("leavemain",()=>{
    main_json_data.length=0;
    if(main_json_request!=null)
    {
        main_json_request.destroy();
        main_json_request=null;
    }
    main_json_option.length=0;
    main_modify_json=null;
});


function main_mysqlconnection()//返回主数据库连接池
{
    let con=mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"root",
        database:"searchstandard",
        dateStrings:true,
        connectTimeout:10000,

    });
    return con;
}

function main_requestdata()//请求数据函数，如何请求数据成功就返回true，否则返回false
{
    let constream=main_json_request.query("select * from ??",["mainlibview"]);

      //发生错误时
    constream.on("error",(err)=>{
        console.log(err);
        main_json_request.destroy();
        if(main_json_data.length>0)
        {
            request_part();
            search_result();
        }
        else
            request_err();
    });
    constream.on("packet",(packet)=>{
        request_delay();
        console.log(packet);
    });
     //接受中途的数据，使其能接收多少数据就接受多少数据
    constream.on("result",(row)=>{
        main_json_request.pause();
        main_json_data.push(row);
        main_json_request.resume();
    });

    constream.on("field",(field)=>
    {
        console.log(field);
    });

    //接受数据完毕
    constream.on("end",()=>
    {
        request_empty_tip();
        main_json_request.end();
        main_json_request=null;
        search_result();
    })
}



function search_result()
{
    /*
        将json_data里的数据进行筛选，得到筛选后的json_option结果
    */
    //创建json_data权值数组
    main_json_option.splice(0,main_json_option.length);
    main_json_option.length=main_json_data.length;
    for(let a=0;a<main_json_option.length;a++)
        main_json_option[a]={
            "json":main_json_data[a]
        };
    //创建需要比较的匹配数组
    let compare_str=[];
    compare_str.length=5;
    compare_str[0]=document.querySelector("#main .bar input.input_txt").value;
    let compare_str1=document.querySelectorAll("#main .bar .search_table div");
    if(compare_str1.length<=0)
        return ;
    for(let i=1,j=0;i<5;i++,j++)
        compare_str[i]=compare_str1[j].children[1].value;
    compare_str1=["CNname","StdNo","issue_time","act_time","State"];

        //开始循环判断标准是否符合搜索标准
    for(let a=0;a<main_json_option.length;a++)
    {
        let b;
        for(b=0;b<5;b++)
        {
            if((b<4&&compare_str[b]!="")||(b==4&&compare_str[b]!="全部"))
            {
                let index=main_json_option[a].json[compare_str1[b]].indexOf(compare_str[b]);
                if(index==-1)
                    break;
                else if(b!=4)
                {
                    let str="<i class=\"search_mark\">"+compare_str[b]+"</i>";
                    main_json_option[a].json[compare_str1[b]]=main_json_option[a].json[compare_str1[b]].replace(compare_str[b],str);
                }
            }
        }
        if(b!=5)
        {
            main_json_option.splice(a,1);
            a--;
        }
    }
    document.querySelector("#main .directory_box .specify_num").value=1;
    display_result();
}


   /*
        显示搜索结果，并在搜索结果中加入修改单数据
    */
function display_result()
{
    let result=document.querySelector("#main table.search_result tbody");
    let page_number=document.querySelector("#main .directory_box .specify_num");
    if(result.hasChildNodes())
        result.innerHTML="";
    let fragment=document.createDocumentFragment();
    let display_max=page_number.value*13;
    let str=["CNname","StdNo","issue_time","act_time","State","ftext"];
    for(let a=display_max-13;a<display_max&&a<main_json_option.length;a++)
    {
        let tr=document.createElement("tr");
        for(let key in str)
        {  
            let td=document.createElement("td");
            if(str[key]=="ftext")
            {
                let alabel=document.createElement("a");
                if(main_json_option[a].json[str[key]]!=null&&main_json_option[a].json[str[key]]!="None")
                {
                    alabel.href=main_json_option[a].json[str[key]];
                    alabel.className="table_alabel";
                    alabel.innerHTML="查看全文";
                }
                else
                    alabel.textContent="暂无全文";
                td.appendChild(alabel);
            }
            else if(str[key]!="修改单")
            {
                if(str[key]=="CNname")
                {
                    let i=document.createElement("i");
                    i.className="fa fa-asterisk";
                    i.style.color="#FF4081";
                    let div=document.createElement("div");
                    div.style.display="inline";
                    div.style.fontSize="1.3rem";
                    div.innerHTML=main_json_option[a].json[str[key]];
                    td.appendChild(i);
                    td.appendChild(div);
                }
                else
                    td.innerHTML=main_json_option[a].json[str[key]];
            }
            tr.append(td);
        }
        fragment.append(tr);
    }
    result.append(fragment);
    state_check();
    request_empty_tip();
}

    /*
        给列表上的每个带有修改单的数据列设置一个悬浮窗查看修改单
    */
function add_modification()
{
    let trlist=document.querySelectorAll("#main .bar~table.search_result tbody tr");
    let page_number=document.querySelector("#main .directory_box .specify_num");
    for(let i=0;i<trlist.length;i++)
    {
        let index=i+(page_number.value-1)*13;
        if(main_json_option[index].json["修改单"].length>0)
        {
            trlist[i].childNodes[1].addEventListener("mouseenter",(e)=>
            {
                create_modifysheet(e,index,main_json_option,main_modify_json);
            });
        }
    }
}


 /* 
        监听页面数字的变化，分别从页面点击左右快进按钮、页面数字输入按键以及键盘左右按键输入入手
        页面数字不能大于所有数据能呈现的页面数字的最大值，也不能小于1
        以下是监听数据页面动态变化的函数。
    */
function register_page_change()
{
    let page_number=document.querySelector("#main .directory_box .specify_num");
    let step_forward=document.querySelector("#main .directory_box .fa.fa-step-forward");
    let step_back=document.querySelector("#main .directory_box .fa.fa-step-backward");
    step_forward.addEventListener("click",()=>
    {
        page_number.value=parseInt(page_number.value)+1;
        listener_page_number();
    });
    step_back.addEventListener("click",()=>
    {
        page_number.value=parseInt(page_number.value)-1;
        listener_page_number();
    });
    page_number.addEventListener("change",()=>
    {
        listener_page_number();
    });
    function listener_page_number()
    {
        let match_number=/^[0-9]*$/g;
        if(page_number.value.match(match_number)==null&&page_number.value!="")
            page_number.value=1;
        let max_num=1;
        if(parseFloat(main_json_option.length/13)>parseInt(main_json_option.length/13))
            max_num=parseInt(main_json_option.length/13)+1;
        else    
            max_num=parseInt(main_json_option.length/13);
        if(page_number.value>=max_num)
            page_number.value=max_num;
        else if(page_number.value<1)
            page_number.value=1;
        if(main_json_option.length>0)
        {
            display_result();
        }
    }
}


//监听是否点击了查看全文按钮，如果是则在浏览器中打开对应标签。
{
    window.addEventListener("click",(e)=>
    {
        if(e.toElement.className=="table_alabel")
        {
            e.preventDefault();
            shell.openExternal(e.toElement.href);
        }
    });
}

//创建修改单函数
function create_modifysheet(mouseevent,index,json_option,modify_json)
{
    let div=document.querySelector(".float_modifysheet");

    let fragment=document.createDocumentFragment();
    div.innerHTML="";
    let x=parseInt(mouseevent.clientX)-50;
    let y=parseInt(mouseevent.clientY)-20;
    div.style.left=x+"px";
    div.style.top=y+"px";
    div.style.display="block";
    for(let i=0;i<json_option[index].json["修改单"].length;i++)
    {
        let contain=document.createElement("div");
        let div_item1=document.createElement("div");
        let div_item2=document.createElement("div");
        let a=document.createElement("a");
        contain.className="contain";
        contain.style.display="flex";
        div_item1.className="item1";
        div_item2.className="item2";
        contain.appendChild(div_item1);
        contain.appendChild(div_item2);
        div_item1.textContent="修改单名称:  ";
        div_item1.textContent+=modify_json[json_option[index].json["修改单"][i]]["标准名称"];
        div_item1.textContent+=modify_json[json_option[index].json["修改单"][i]]["修改单名称"];
        a.href=modify_json[json_option[index].json["修改单"][i]]["查看全文"];
        a.className="table_alabel";
        div_item2.appendChild(a);
        a.textContent="查看修改单全文";
        fragment.appendChild(contain);
    }
    div.appendChild(fragment);
}