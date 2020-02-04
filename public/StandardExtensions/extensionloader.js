

loadJSON(init);

function init(config){    
    var Extensions = config.Extensions;
    var loaderconfig = {"initialload":false}
    Extensions.forEach(element => {
        let path = "StandardExtensions/"+element.name+"/contents/";
        element.FilesToLoad.cssfiles.forEach(ele => {loadjscssfile((path+ele), 'css')});
        element.FilesToLoad.jsfiles.forEach(ele => {loadjscssfile((path+ele), 'js')});
    });
    document.addEventListener('loadextension',function(e){
        loaderconfig.Viewer = e.detail.viewer;
        e.detail.viewer.loadExtension(e.detail.extension);
    })
    document.addEventListener('viewerinstance',function(e){
        loaderconfig.Viewer = e.detail.viewer;
        if (!loaderconfig.initialload) {
            loadStartupExtensions();
            loaderconfig.initialload = true;
        }
        document.getElementById(config.ListConfig.ListId).style.display = 'block';
        if(config.InbuiltExtensionsConfig && config.InbuiltExtensionsConfig.CreateList === "true") ListInbuiltExtensions();
        if(config.ListConfig && config.ListConfig.CreateList === "true") CreateList();
    });

    function loadStartupExtensions(){
        Extensions.forEach(element => {
            if (element.Loadonstartup === "true") {
                loaderconfig.Viewer.loadExtension(element.name);
            }
        });
    }    

    function CreateList() {        
        var list = document.getElementById(config.ListConfig.ListId);
        var ExtensionList = '';
        Extensions.forEach(element => {
            if (element.IncludeinList === "true") {                
                var name = element.name;
                var checked = '';
                if(element.Loadonstartup === 'true') checked = ' checked ';
                ExtensionList += '<label><input class="checkextension" type="checkbox"'+checked+' name="'+name+'" value="'+name+'"> '+name+'</label><br>';
            }
        });
        list.innerHTML = ExtensionList;
        var checkbox = document.getElementsByClassName('checkextension');
        for (var i=0; i < checkbox.length; i++) {
            checkbox.item(i).onclick = clickerFn;
        }
        function clickerFn(e) {
            console.log(e.target.value)
            if (e.target.checked) {
                loaderconfig.Viewer.loadExtension(e.target.value)
            } else {
                loaderconfig.Viewer.unloadExtension(e.target.value)
            }
        }     
    }

    function ListInbuiltExtensions() {
        let Extensions = config.InbuiltExtensions;
        let list = document.getElementById(config.InbuiltExtensionsConfig.ListId);
        let ExtensionList = '';
        for (let index = 0; index < Extensions.length; index++) {
            var element = Extensions[index];
            ExtensionList += '<label><input class="checkextension" type="checkbox" name="'+element+'" value="'+element+'"> '+element.slice(9,element.length)+'</label><br>';
            
        };
        list.innerHTML = ExtensionList;
        let checkbox = document.getElementsByClassName('checkextension');
        for (var i=0; i < checkbox.length; i++) {
            checkbox.item(i).onclick = clickerFn;
        }
        function clickerFn(e) {
            console.log(e.target.value)
            if (e.target.checked) {
                loaderconfig.Viewer.loadExtension(e.target.value)
            } else {
                loaderconfig.Viewer.unloadExtension(e.target.value)
            }
        }
    }

    function loadjscssfile(filename, filetype){
        if (filetype=="js"){ 
            var fileref=document.createElement('script')
            fileref.setAttribute("type","text/javascript")
            fileref.setAttribute("src", filename)
        }
        else if (filetype=="css"){ 
            var fileref=document.createElement("link")
            fileref.setAttribute("rel", "stylesheet")
            fileref.setAttribute("type", "text/css")
            fileref.setAttribute("href", filename)
        }
        if (typeof fileref!="undefined");
        document.getElementsByTagName("head")[0].appendChild(fileref);
    }
}   

function loadJSON(callback) {   
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'StandardExtensions/config.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);  
}