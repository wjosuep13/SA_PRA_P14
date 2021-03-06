require('dotenv').config();

const express = require('express');
const request = require('request');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json())

const orders = [];

/*
    Estados pedidos:
    0: Recibido por restaurante
    1: Recibido por repartidor
    2: Entregado
*/

app.get('/send_to_delivery', authenticateToken, (req, res) => {
    const user_actual = req.user;
    const rol_usuario = user_actual.rol;
    // console.log("RES: ", user_actual);
    if(rol_usuario == 2)
    {
        // console.log("RES: ", req.headers['authorization']);
        if(orders.length > 0)
        {
            const order = orders.filter(post => post.status === 0)[0];
            order.status = 1;
            console.log(order);
            request.post(
                {
                "headers" : { 
                    "content-type": "application/json",
                    "Authorization": req.headers['authorization']
                },
                "url" : "http://0.0.0.0:7007/add_order_delivery",
                "body": JSON.stringify({
                    "order" : order
                })
                }, (err, response, body) => {
                    if(err) {
                        console.log(err);
                        return response.sendStatus(401);
                    }else{
                        res.json(JSON.parse(body));
                    }
                    // console.dir("CLIENTE: ", JSON.parse(body));
                }
            )
        } else
        {
            res.json({ message: "Aun no hay pedidos." });
        }
    }else{
        res.json({ message: "Solamente los restaurantes pueden enviar pedidos al repartidor." });
    }
});

let id_order = 0;
app.post('/add_order', authenticateToken, (req, res) => {
    // console.log("RESTAURANTE: ", req);
    const user_actual = req.body.username;
    const order = {
        id: id_order,
        user: user_actual,
        status: 0
    }
    id_order++;
    orders.push(order);
    res.json({ message: `El restaurante recibio el pedido. No Orden: ${order.id}` });
});

app.post('/send_status_to_client', authenticateToken, (req, res) => {
    // console.log("RESTAURANTE: ", req);
    console.log("status")
    console.log(req.body)
    const user_actual = req.body.username;
    const id_order = req.body.id_order;
    console.log(orders)
    let order_actual;
    // order_actual = orders.forEach((order)=>{
    //     if (order.user === user_actual && order.id === id_order ){
    //         console.log(order)
    //         return order;
    //     }
    // });
    order_actual = orders.filter(post => post.user === user_actual && post.id === id_order)[0];
    console.log(order_actual)
    let estado =""
    if (typeof order_actual !== 'undefined')
    {
        switch(order_actual.status)
        {
            case 0:
                estado = "Recibido por restaurante"
                break;
            case 1:
                estado = "Recibido por repartidor"
                break;
            case 2:
                estado = "Entregado"
                break;
            default:
                estado = ""
                break;
        }
        estado = `No Orden: ${order_actual.id} ` + estado
    }else{
        res.json({ message: "Orden No encontrada" });
    }
    
    res.json({ message: estado });
});

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.get('/', (req, res) => {
    res.json({ message: "Restaurante server running on 6006." });
});

console.log('Restaurante server running on http://0.0.0.0:6006');

app.listen(6006);