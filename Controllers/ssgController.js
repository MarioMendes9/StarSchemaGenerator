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
    var database = "DataNau";
    request.query("CREATE DATABASE " + database, function (err, anything) {
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

            //res.json(jsonResult);

            // Crias as dimensoes
            for (var i = 0; i < jsonResult.schema.tables.dimension.length; i++) {
                var string = "CREATE TABLE " + database + ".dbo.";
                // Tabela em questao (Para ja ainda nao se faz uso do tipo)
                var tempTable = jsonResult.schema.tables.dimension[i];
                //Adiciona o nome a tabela
                string += tempTable.name._text + "(\n";

                string += tempTable.atributes.keys.primary.name._text + " " + tempTable.atributes.keys.primary.domain._text + " PRIMARY KEY IDENTITY(1,1),\n";
                //Foreign Keys
                var fk = "";
                if (tempTable.atributes.keys.hasOwnProperty("candidates")) {
                    if (Array.isArray(tempTable.atributes.keys.candidates.candidate)) {
                        for (var t = 0; t < tempTable.atributes.keys.candidates.candidate.length - 1; t++) {
                            string += tempTable.atributes.keys.candidates.candidate[t].name._text + " " + tempTable.atributes.keys.candidates.candidate[t].domain._text + " NOT NULL UNIQUE,\n"
                        }
                        string += tempTable.atributes.keys.candidates.candidate[tempTable.atributes.keys.candidates.candidate.length - 1].name._text + " " + tempTable.atributes.keys.candidates.candidate[tempTable.atributes.keys.candidates.candidate.length - 1].domain._text + " NOT NULL UNIQUE,\n";
                    } else {
                        string += tempTable.atributes.keys.candidates.candidate.name._text + " " + tempTable.atributes.keys.candidates.candidate.domain._text + " NOT NULL UNIQUE,\n"
                    }
                }

                if (tempTable.atributes.keys.hasOwnProperty("foreigns")) {
                    if (Array.isArray(tempTable.atributes.keys.foreigns.foreign.attribute)) {
                        for (var j = 0; j < tempTable.atributes.keys.foreigns.foreign.attribute.length - 1; j++) {
                            string += tempTable.atributes.keys.foreigns.foreign.attribute[j].name._text + " " + tempTable.atributes.keys.foreigns.foreign.attribute[j].domain._text + " NOT NULL,\n"
                            fk += "FOREIGN KEY (" + tempTable.atributes.keys.foreigns.foreign.attribute[j].name._text + ") REFERENCES " + tempTable.atributes.keys.foreigns.foreign.attribute[j].references.tableName._text + "(" + tempTable.atributes.keys.foreigns.foreign.attribute[j].references.reference._text + "),\n";
                        }
                        string += tempTable.atributes.keys.foreigns.foreign.attribute[tempTable.atributes.keys.foreigns.foreign.attribute.length - 1].name._text + " " + tempTable.atributes.keys.foreigns.foreign.attribute[tempTable.atributes.keys.foreigns.foreign.attribute.length - 1].domain._text + " NOT NULL,\n";
                        fk += "FOREIGN KEY (" + tempTable.atributes.keys.foreigns.foreign.attribute[tempTable.atributes.keys.foreigns.foreign.attribute.length - 1].name._text + ") REFERENCES " + tempTable.atributes.keys.foreigns.foreign.attribute[tempTable.atributes.keys.foreigns.foreign.attribute.length - 1].references.tableName._text + "(" + tempTable.atributes.keys.foreigns.foreign.attribute[tempTable.atributes.keys.foreigns.foreign.attribute.length - 1].references.reference._text + ")\n);";
                    } else {
                        string += tempTable.atributes.keys.foreigns.foreign.attribute.name._text + " " + tempTable.atributes.keys.foreigns.foreign.attribute.domain._text + " NOT NULL,\n"
                        fk += "FOREIGN KEY (" + tempTable.atributes.keys.foreigns.foreign.attribute.name._text + ") REFERENCES " + tempTable.atributes.keys.foreigns.foreign.attribute.references.tableName._text + "(" + tempTable.atributes.keys.foreigns.foreign.attribute.references.reference._text + ")\n);";
                    }
                }

                if (tempTable.atributes.hasOwnProperty("descriptive")) {
                    if (Array.isArray(tempTable.atributes.descriptive.attribute)) {
                        for (var k = 0; k < tempTable.atributes.descriptive.attribute.length; k++) {
                            string += tempTable.atributes.descriptive.attribute[k].name_atributo._text + " " + tempTable.atributes.descriptive.attribute[k].domain._text;
                            if (tempTable.atributes.descriptive.attribute[k]._attributes.opcional == "false") {
                                string += " NOT NULL,\n";
                            } else {
                                string += ",";
                            }
                        }
                    } else {
                        string += tempTable.atributes.descriptive.attribute.name_atributo._text + " " + tempTable.atributes.descriptive.attribute.domain._text;
                        if (tempTable.atributes.descriptive.attribute._attributes.opcional == "false") {
                            string += " NOT NULL,\n";
                        } else {
                            string += ",";
                        }
                    }
                }

                if (tempTable.atributes.hasOwnProperty("dimensional")) {
                    if (Array.isArray(tempTable.atributes.dimensional.attribute)) {
                        for (var k = 0; k < tempTable.atributes.dimensional.attribute.length; k++) {
                            string += tempTable.atributes.dimensional.attribute[k].name_atributo._text + " " + tempTable.atributes.dimensional.attribute[k].domain._text;
                            if (tempTable.atributes.dimensional.attribute[k]._attributes.opcional == "false") {
                                string += " NOT NULL,\n";
                            } else {
                                string += ",";
                            }
                        }
                    } else {
                        string += tempTable.atributes.dimensional.attribute.name_atributo._text + " " + tempTable.atributes.dimensional.attribute.domain._text;
                        if (tempTable.atributes.dimensional.attribute._attributes.opcional == "false") {
                            string += " NOT NULL,\n";
                        } else {
                            string += ",";
                        }
                    }
                }

                if (fk != "") {
                    string += fk;
                }
                if (string.substr(string.length - 2) == ",\n") {
                    string = string.substr(0, string.length - 2) + ");";
                }
                console.log(string + "\n");
                 request.query(string, function (err, anything) {
                      if (err) console.log(err);
                      console.log(anything);
  
                  });

            }

            //Criar a tabela de factos (ainda so para uma) 
            var factTable = jsonResult.schema.tables.fact;

            var factString = "CREATE TABLE " + database + ".dbo.";
            factString += factTable.name._text + "(\n";
            factString += factTable.atributes.keys.primary.name._text + " " + factTable.atributes.keys.primary.domain._text + " PRIMARY KEY IDENTITY(1,1),\n";

            var factfk = "";
            if (factTable.atributes.keys.hasOwnProperty("candidates")) {
                if (Array.isArray(factTable.atributes.keys.candidates.candidate)) {
                    for (var t = 0; t < factTable.atributes.keys.candidates.candidate.length - 1; t++) {
                        factString += factTable.atributes.keys.candidates.candidate[t].name._text + " " + factTable.atributes.keys.candidates.candidate[t].domain._text + " NOT NULL UNIQUE,\n"
                    }
                    factString += factTable.atributes.keys.candidates.candidate[factTable.atributes.keys.candidates.candidate.length - 1].name._text + " " + factTable.atributes.keys.candidates.candidate[factTable.atributes.keys.candidates.candidate.length - 1].domain._text + " NOT NULL UNIQUE,\n";
                } else {
                    factString += factTable.atributes.keys.candidates.candidate.name._text + " " + factTable.atributes.keys.candidates.candidate.domain._text + " NOT NULL UNIQUE,\n"
                }
            }

            if (factTable.atributes.keys.hasOwnProperty("foreigns")) {
                if (Array.isArray(factTable.atributes.keys.foreigns.foreign.attribute)) {
                    for (var j = 0; j < factTable.atributes.keys.foreigns.foreign.attribute.length - 1; j++) {
                        factString += factTable.atributes.keys.foreigns.foreign.attribute[j].name._text + " " + factTable.atributes.keys.foreigns.foreign.attribute[j].domain._text + " NOT NULL,\n"
                        factfk += "FOREIGN KEY (" + factTable.atributes.keys.foreigns.foreign.attribute[j].name._text + ") REFERENCES " + factTable.atributes.keys.foreigns.foreign.attribute[j].references.tableName._text + "(" + factTable.atributes.keys.foreigns.foreign.attribute[j].references.reference._text + "),\n";
                    }
                    factString += factTable.atributes.keys.foreigns.foreign.attribute[factTable.atributes.keys.foreigns.foreign.attribute.length - 1].name._text + " " + factTable.atributes.keys.foreigns.foreign.attribute[factTable.atributes.keys.foreigns.foreign.attribute.length - 1].domain._text + " NOT NULL,\n";
                    factfk += "FOREIGN KEY (" + factTable.atributes.keys.foreigns.foreign.attribute[factTable.atributes.keys.foreigns.foreign.attribute.length - 1].name._text + ") REFERENCES " + factTable.atributes.keys.foreigns.foreign.attribute[factTable.atributes.keys.foreigns.foreign.attribute.length - 1].references.tableName._text + "(" + factTable.atributes.keys.foreigns.foreign.attribute[factTable.atributes.keys.foreigns.foreign.attribute.length - 1].references.reference._text + ")\n);";
                } else {
                    factString += factTable.atributes.keys.foreigns.foreign.attribute.name._text + " " + factTable.atributes.keys.foreigns.foreign.attribute.domain._text + " NOT NULL,\n"
                    factfk += "FOREIGN KEY (" + factTable.atributes.keys.foreigns.foreign.attribute.name._text + ") REFERENCES " + factTable.atributes.keys.foreigns.foreign.attribute.references.tableName._text + "(" + factTable.atributes.keys.foreigns.foreign.attribute.references.reference._text + ")\n);";
                }
            }

            if (factTable.atributes.hasOwnProperty("descriptive")) {
                if (Array.isArray(factTable.atributes.descriptive.attribute)) {
                    for (var k = 0; k < factTable.atributes.descriptive.attribute.length; k++) {
                        factString += factTable.atributes.descriptive.attribute[k].name_atributo._text + " " + factTable.atributes.descriptive.attribute[k].domain._text;
                        if (factTable.atributes.descriptive.attribute[k]._attributes.opcional == "false") {
                            factString += " NOT NULL,\n";
                        } else {
                            factString += ",";
                        }
                    }
                } else {
                    factString += factTable.atributes.descriptive.attribute.name_atributo._text + " " + factTable.atributes.descriptive.attribute.domain._text;
                    if (factTable.atributes.descriptive.attribute._attributes.opcional == "false") {
                        string += " NOT NULL,\n";
                    } else {
                        factString += ",";
                    }
                }
            }

            if (factTable.atributes.hasOwnProperty("dimensional")) {
                if (Array.isArray(factTable.atributes.dimensional.attribute)) {
                    for (var k = 0; k < factTable.atributes.dimensional.attribute.length; k++) {
                        factString += factTable.atributes.dimensional.attribute[k].name_atributo._text + " " + factTable.atributes.dimensional.attribute[k].domain._text;
                        if (factTable.atributes.dimensional.attribute[k]._attributes.opcional == "false") {
                            factString += " NOT NULL,\n";
                        } else {
                            factString += ",";
                        }
                    }
                } else {
                    string += factTable.atributes.dimensional.attribute.name_atributo._text + " " + factTable.atributes.dimensional.attribute.domain._text;
                    if (factTable.atributes.dimensional.attribute._attributes.opcional == "false") {
                        factString += " NOT NULL,\n";
                    } else {
                        factString += ",";
                    }
                }
            }
            //measures
            if (factTable.atributes.hasOwnProperty("measures")) {
                if (Array.isArray(factTable.atributes.measures.measure)) {
                    for (var k = 0; k < factTable.atributes.measures.measure.length; k++) {
                        factString += factTable.atributes.measures.measure[k].name._text + " " + factTable.atributes.measures.measure[k].domain._text;
                        if (factTable.atributes.measures.measure[k]._attributes.opcional == "false") {
                            factString += " NOT NULL,\n";
                        } else {
                            factString += ",";
                        }
                    }
                } else {
                    string += factTable.atributes.measures.measure.name._text + " " + factTable.atributes.measures.measure.domain._text;
                    if (factTable.atributes.measures.measure._attributes.opcional == "false") {
                        factString += " NOT NULL,\n";
                    } else {
                        factString += ",";
                    }
                }
            }

            if (factfk != "") {
                factString += factfk;
            }
            if (factString.substr(factString.length - 2) == ",\n") {
                factString = factString.substr(0, factString.length - 2) + ");";
            }
            console.log(factString + "\n");
            request.query(factString, function (err, anything) {
                  if (err) console.log(err);
                  console.log(anything);
  
              });

            res.json(jsonResult);
        });

    });


    // res.json("Vai criar o schema");
}

module.exports = ssgController;