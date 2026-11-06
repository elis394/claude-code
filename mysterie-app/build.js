const fs=require('fs');
const dir=__dirname+'/';
const frag=fs.readFileSync(dir+'game.html','utf8');
const head=`<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
fs.writeFileSync(dir+'index.html',head+frag+'\n</body>\n</html>\n');
console.log('built');
