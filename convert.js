var Fs = require("fs");
var Xml = require("libxml/lib/libxml");
var Async = require("asyncjs");

var colors = {};

var sourceDir = __dirname + "/sources/iterm2-themes";
var destDir = __dirname + "/out";

Async.readdir(sourceDir)
    .filter(function(file) {
        return file.name.indexOf(".itermcolors") > -1;
    })
    .each(function(file, next) {
        Fs.readFile(file.path, "utf8", function(err, data) {
            if (err)
                return next(err);

            var root;
            try {
                root = Xml.parseFromString(data).documentElement;
            }
            catch (ex) {
                return next(ex);
            }
            
            var themeName = file.name.substr(0, file.name.lastIndexOf("."));
            colors[themeName] = [];
            var keys = root.selectNodes("dict/key");
            var dicts = root.selectNodes("dict/dict");
            var color, caption, dictKeys, dictNumbers, j, k, name, colorVal;
            for (var i = 0, l = keys.length; i < l; ++i) {
                caption = keys[i].firstChild.nodeValue.replace(/[\s\t\r\n]+/g, "");
                color = {
                    name: caption.charAt(0).toLowerCase() + caption.substr(1)
                };
                dictKeys = dicts[i].getElementsByTagName("key");
                dictNumbers = dicts[i].getElementsByTagName("real");
                for (j = 0, k = dictKeys.length; j < k; ++j) {
                    name = dictKeys[j].firstChild.nodeValue.toLowerCase();
                    colorVal = parseInt(parseFloat(dictNumbers[j].firstChild.nodeValue) * 255, 10);
                    if (name.indexOf("red") > -1)
                        color.r = colorVal;
                    else if (name.indexOf("green") > -1)
                        color.g = colorVal;
                    else if (name.indexOf("blue") > -1)
                        color.b = colorVal;
                }
                colors[themeName].push(color);
            }
            next();
        });
    })
    .end(function(err) {
        if (err) {
            console.log("ERROR:" + err);
            process.exit(1);
        }
        else {
            var head = "/**\n"
                     + " * This stylesheet is generated automatically, please don't edit manually.\n"
                     + " * Generated by iterm2css - http://github.com/mikedeboer/iterm2css\n"
                     + " */\n\n";
            Async.list(Object.keys(colors))
                .each(function(themeName, next) {
                    var classes = colors[themeName].map(function(cls) {
                        var css = "." + cls.name + " {\n";
                        var rgb = "rgb(" + cls.r + ", " + cls.g + ", " + cls.b + ");\n";
                        if (cls.name.indexOf("background") > -1 || cls.name.indexOf("cursor") > -1)
                            css += "    background-color: " + rgb;
                        else
                            css += "    color: " + rgb;
                        return css + "}\n\n";
                    });
                    
                    Fs.writeFile(destDir + "/" + themeName + ".css", head + classes.join(""), "utf8", next);
                })
                .end(function(err) {
                    if (err) {
                        console.log("ERROR:", err);
                        process.exit(1);
                    }
                    else
                        process.exit(0);
                });
        }
    });
