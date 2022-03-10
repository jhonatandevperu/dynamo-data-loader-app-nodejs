const express = require('express');
const app = express();
const http = require("http");
const server = http.createServer(app);
const AWS = require('aws-sdk');

app.set("port", process.env.PORT || 3000);

app.use(express.json({ limit : process.env.JSON_BODY_LIMIT || '20mb' }));

let credentials = new AWS.Credentials({ accessKeyId : process.env.AWS_ACCESS_KEY_ID || "local", secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY || "local"});

AWS.config.credentials = credentials;

AWS.config.update({region: process.env.AWS_DEFAULT_REGION || 'eu-west-1'});

const endpoint = new AWS.Endpoint(process.env.AWS_ENDPOINT || "http://localhost:4566");

const dynamoDB = new AWS.DynamoDB({ endpoint });

app.post('/upload-json', async (req, res) => {
  let { content, table_name, partition_key_name } = req.body;

  let responseAPI = [];

  content = content.Items.map((item) => {
    return {
      "PutRequest" : {
        "Item" : {
          [partition_key_name] : item[partition_key_name],
          ...item
        }
      }
    };
  });

  let registrosPermitidos = 25;
  
  let totalRegistros = content.length;

  let totalRequests = Math.ceil(totalRegistros/registrosPermitidos);

  console.log("Total elementos a insertar:", totalRegistros)

  console.log("Total requests a realizar:", totalRequests)

  for (let request = 1; request <= totalRequests; request++) {
    console.log("Request nro:", request)

    let indiceCorte = content.length > registrosPermitidos ? registrosPermitidos : content.length;
    
    let contentParcial = content.slice(0, indiceCorte);

    console.log("Request nro:", request, "contentParcial total elementos:", contentParcial.length)

    let params = {
      "RequestItems" : { [table_name] : contentParcial }
    };

    responseFinal.push(params);

    dynamoDB.batchWriteItem(params, (err, data) => {
      if (err) {
        console.error("Error operación:", err);
      } else {
        console.log("Respuesta operación:", data);
      }
    });

    content = content.slice(indiceCorte, content.length);

    console.log("Request nro:", request, "content total elementos actualmente:", content.length)
 }
 
  res.json(responseAPI).status(200);
});

server.listen(app.get("port"), () => {
  console.log(`Servidor ejecutándose por el puerto ${app.get("port")}`);
});