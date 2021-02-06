
function collect_dom_request()
{
    let dom_http=null;
    dom_http=new XMLHttpRequest();
    dom_http.open("GET","../page/my-collection.html",true);
    dom_http.send(null);
    dom_http.addEventListener("load",()=>
    {
        request_empty_tip();
        document.querySelector("#main").innerHTML=dom_http.responseText;
        collect_dom_get();//在所有节点就位后，调用这个节点获得函数
    });
    dom_http.addEventListener("error",()=>
    {
        request_err();
    });
    dom_http.addEventListener("progress",()=>
    {
        request_delay();
    });
    dom_http.addEventListener("timeout",(e)=>
    {
        request_err();
    });
}
function collect_dom_get()//以后所有节点的获取都在这个函数里实现
{
    bulk_edit=document.querySelector("#bulk_edit_switch");
    bulk_edit.addEventListener("click",()=>
    {
        let ul_display=document.querySelector("#main #current_favorites .bulk_edit_ul");
        ul_display.style.display=bulk_edit.checked?"block":"none";
    });
    open_fold=document.querySelector("#main .my_collection");
    open_fold.addEventListener("click",()=>
    {
        let all_favorites=document.querySelector("#all_favorites");
        if(window.getComputedStyle(all_favorites).display!="none")    
            all_favorites.style.display="none";
        else
            all_favorites.style.display="flex";
    });
}   

events.on("leavecollect",()=>{

});

let bulk_edit=null;
let open_fold=null;

