var ssgController = {};

//Modulo responsavel por receber o ficheiro XML
var formidable = require('formidable');

//Modulo responsavel por ler o ficheiro XML
var fs = require('fs');


ssgController.generateSchema=function(req,res,next){
    //criar o star schema

    var form = new formidable.IncomingForm();
    //Parse no ficheiro que levou upload
    form.parse(req,function(err,fields,files){
        //Vai buscar o caminho do ficheiro
        var path=files.fileUpload.path;
        console.log(path);
        //Le o ficheiro
        fs.readFile(path,'UTF-8' ,function(err,data){
            console.log(data);
            res.json(data);
        });
    });
    

   // res.json("Vai criar o schema");
}

module.exports=ssgController;