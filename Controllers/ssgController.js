var ssgController = {};

// Modulo responsavel por receber o ficheiro XML
var formidable = require('formidable');
var convert = require('xml-js');
// Modulo responsavel por ler o ficheiro XML
var fs = require('fs');

const sql = require('mssql');
const connStr = "Server=.\\;User Id=mario;Password=mario;";

sql.connect(connStr)
    .then(conn => console.log("conectou!"))
    .catch(err => function (err) {
        if (err) console.log(err);

    });

ssgController.generateSchema = function (req, res, next) {

    // Cria a base da dados
    var request = new sql.Request();
    var database="DataNau";
    request.query("CREATE DATABASE "+database, function (err, anything) {
        if (err) console.log(err);
        console.log(anything);
    });
    
    //criar o star schema
    var form = new formidable.IncomingForm();
    // Parse no ficheiro que levou upload
    form.parse(req, function (err, fields, files) {
        // Vai buscar o caminho do ficheiro
        var path = files.fileUpload.path;
        // Le o ficheiro
        fs.readFile(path, 'UTF-8', function (err, data) {
            var xml = convert.xml2json(data, { compact: true, spaces: 4 });

            var jsonResult = JSON.parse(xml);
            // Crias as dimensoes
            for (var i = 0; i < jsonResult.ss_generator.dims.table.length; i++) {
                var string = "CREATE TABLE "+database+".dbo.";
                // Tabela em questao 
                var tempTable = jsonResult.ss_generator.dims.table[i];
                // Adiciona o nome a tabela
                string += jsonResult.ss_generator.dims.table[i].table_name._text + " (\n";
                // Adiciona a primary key 
                string += tempTable.pk.name_atributo._text + " " + tempTable.pk.dominio._text + " PRIMARY KEY,\n"
                if (Array.isArray(tempTable.atributos.atributo)) {
                    for (var j = 0; j < tempTable.atributos.atributo.length - 1; j++) {
                        string += tempTable.atributos.atributo[j].name_atributo._text + " " + tempTable.atributos.atributo[j].dominio._text + ",\n"
                    }
                    string += tempTable.atributos.atributo[tempTable.atributos.atributo.length - 1].name_atributo._text + " " + tempTable.atributos.atributo[tempTable.atributos.atributo.length - 1].dominio._text + "\n);";
                } else {
                    string += tempTable.atributos.atributo.name_atributo._text + " " + tempTable.atributos.atributo.dominio._text + "\n);";
                }

                console.log(string);
                request.query(string, function (err, anything) {
                    if (err) console.log(err);
                    console.log(anything);

                });
            }


            res.json(jsonResult.ss_generator);

        });
    });


    // res.json("Vai criar o schema");
}

module.exports = ssgController;