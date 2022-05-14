const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: false })); 
app.use(express.json());


var pg = require('pg');

var conString = 'postgres://kwxxklmjsbpeqs:4411086cc999ba61eb11ec83a22fb515b268a66024f1f4190b0f7b8baf4fccdc@ec2-3-224-164-189.compute-1.amazonaws.com:5432/df0s14c56o9oun';

const pool = new pg.Pool({connectionString: conString, ssl: {rejectUnauthorized: false}});

//ROTA PRINCIPAL
app.get('/', (req, res) =>{
    pool.connect((err, product)=>{
        if (err){
            return res.status(401).send('Não foi possível conectar')
        }
        res.status(200).send('Conectado com sucesso')
    })
})

//CADASTRO DE NOVOS PRODUTOS
app.post('/cadprodutos', (req, res) => {
    pool.connect((err, product) =>{
        if (err) {
            return res.status(401).send('Conexão nao autorizada')
        }
        
        product.query('select * from produtos where id = $1', [req.body.id], (error,result) =>{
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }

            if (result.rowCount > 0) {
                return res.status(200).send('Produto cadastrado')
            }

             var sql = 'INSERT INTO produtos(categoria, preco, foto) VALUES ($1, $2, $3)'

            product.query(sql,[req.body.categoria, req.body.preco, req.body.foto], (error, result) => {
                if (error) {
                    return res.status(403).send('Operação não permitida')
            }

            res.status(201).send({
                mensagem: 'Produto cadastrado com sucesso',
                status: 201
            })
            
            })
        
        }) 
        
    })
})

//LISTANDO PRODUTOS
app.get('/produtos', (req, res) => {
    pool.connect((err, product) => {
        if(err){
            res.status(401).send('Conexão não autorizada')
        }

        product.query('select * from produtos', (error, result) => {
            if(error) {
               return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows)
        })
    })
})

//PESQUISA DE PRODUTO POR ID
//(tentar add um aviso caso nao exista o id buscado)
app.get('/produtos/:id', (req, res) =>{
    pool.connect((err, product) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
         }
         product.query('select * from produtos where id = $1', [req.params.id], (error, result) =>{
             if(error) {
                 return res.status(401).send('Operação não autorizada')
             }
             res.status(200).send(result.rows[0])
         })
    })
})

//DELETAR PRODUTOS
app.delete('/cadprodutos/:id', (req, res) =>{
    pool.connect((err, product) => {
        if (err) {
           return res.status(401).send('Conexão não autorizada')
        }

        product.query('delete from produtos where id = $1', [req.params.id], (error, result) =>{

            if (error) {
                return res.status(401).send('Operação não autorizada')
            }
                res.status(200).send({message: 'Produto excluído com sucesso'})
        })
    })
})

//UPDATE DE PRODUTOS
app.put('/cadprodutos/:id', (req, res) => {
    pool.connect((err, product) =>{
        if (err){
            return res.status(401).send('Conexão não autorizada')
        }
        product.query('select * from produtos where id =$1', [req.params.id], (error, result) =>{
            if (error){
                return res.status(401).send('Operação não permitida')
            }

            //update produtos set  categoria=$1, preco=$2, foto=$3 where id=$4
            if (result.rowCount > 0) {
                var sql = 'update produtos set  categoria=$1, preco=$2, foto=$3 where id=$4'
                let valores = [req.body.categoria, req.body.preco, req.body.foto, req.params.id]
                
                product.query(sql, valores, (error2, result2) =>{
                    if(error2) {
                        return res.status(401).send('Operação não permitida')
                    }

                    if(result2.rowCount > 0) {
                        return res.status(200).send('Dados alterados com sucesso')
                    }
                })
            } else {
                res.status(200).send('Produto não encontrado')
            }

        })
    })
})

app.listen(8081, () => console.log('aplicação em execução na url http://localhost:8081'));
