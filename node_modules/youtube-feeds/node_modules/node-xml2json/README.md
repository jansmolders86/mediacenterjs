##xml2json Node.js Library
基于Node.js版的xml to json

### 使用方法：  
安装：  
<pre>
$ npm install -g node-xml2json
</pre>

使用：  
<pre>
var xml2json = require(&quot;node-xml2json&quot;);
var xml      = &quot;<xml>hello</xml>&quot;;
var json     = xml2json.parser( xml );
console.log( json.xml )
</pre>

详细用法：  
[http://www.thomasfrank.se/xml_to_json.html](http://www.thomasfrank.se/xml_to_json.html)

测试：  
<pre>
..\node_modules\node-xml2json\test\ node test.js
</pre>

其他版本的分页组件：  
JavaScript版：[https://github.com/Kenshin/js-pagination](https://github.com/Kenshin/js-pagination)

## 更新日志：
version 1.0.0 [2012-05-06]
* 在[http://www.thomasfrank.se/xml_to_json.html](http://www.thomasfrank.se/xml_to_json.html)的基础上，修改为Node.js的模块
* xml对象转换Json对象

## 联系方式：
* 博客：[k-zone.cn](http://www.k-zone.cn/zblog)
* 微博：[新浪微博](http://weibo.com/23784148)
* 联络：kenshin[AT]ksria.com

## 版权和许可：
Copyright 2012 [k-zone.cn](http://www.k-zone.cn/zblog)  
Licensed under MIT or GPL Version 2 licenses
