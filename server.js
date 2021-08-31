const express = require('express');
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const fs = require('fs')
const exphbs = require('express-handlebars')


app.use(express.json())
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main",
        layoutsDir: `${__dirname}/views/main`,
        helpers:{
            leftTo10: function(entradas){return entradas.length%10},
            getLastEntry: function(entradas){return entradas.slice(-1).join()}}
       
    })
)
app.set("view engine", "handlebars")



app.use('/nModules', express.static(__dirname+"/node_modules"))
app.use('/imgs', express.static(__dirname+"/assets/imgs"))
app.use('/css', express.static(__dirname+"/assets/css"))



app.get('/',(req,res)=>{
    let {entradas}= JSON.parse(fs.readFileSync(__dirname+'/json/cadaver.json',"utf8"))
    let ips = JSON.parse(fs.readFileSync(__dirname+'/json/ips.json',"utf8"))
    res.render("index",{entradas,ips})

  
})


app.get("/cadaver",(req,res)=>{
    let cadaveresJSON= JSON.parse(fs.readFileSync(__dirname+'/json/cadaveres.json',"utf8"))
    let cadaveresValues = Object.values(cadaveresJSON)
    let cadaveresEntradas = cadaveresValues.filter((a)=>a.entradas).map((a)=>a.entradas)
    res.render("cadaver",{cadaveresEntradas})
    
})

io.on('connection',(socket)=>{
        
    socket.on('new entry',(entry)=>{
        let cadaver= JSON.parse(fs.readFileSync(__dirname+'/json/cadaver.json',"utf8"))
        let ips = JSON.parse(fs.readFileSync(__dirname+'/json/ips.json',"utf8"))
        ips.push(entry[1])
        let {entradas} = cadaver
        entradas.push(entry[0])
        cadaver.entradas = entradas
        fs.writeFileSync(__dirname+'/json/cadaver.json',JSON.stringify(cadaver))
        if(entradas.length===10){
            fs.writeFileSync(__dirname+'/json/ips.json',JSON.stringify([0]))
            let newCadaverObject = {}
            newCadaverObject.entradas = [cadaver.entradas.pop()]
             let cadaveres = JSON.parse(fs.readFileSync(__dirname+'/json/cadaveres.json',"utf8"))
            let rondaActual = cadaveres.rondaActual    
             cadaveres[rondaActual] = {"entradas":cadaver.entradas}
            cadaveres.rondaActual +=1
            fs.writeFileSync(__dirname+'/json/cadaver.json',JSON.stringify(newCadaverObject))
            fs.writeFileSync(__dirname+'/json/cadaveres.json',JSON.stringify(cadaveres))



        }
            
            else{fs.writeFileSync(__dirname+'/json/ips.json',JSON.stringify(ips))}

        io.emit('last entry',entry)
    })

    socket.on('writing',(writing)=>{
        socket.broadcast.emit('writing',writing)
    })

    socket.on('not writing',(msg)=>{
        socket.broadcast.emit("not writing",msg)
    })
    
})


http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
  });