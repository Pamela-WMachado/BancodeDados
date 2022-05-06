const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: false })); 
app.use(express.json());


var pg = require('pg');

var conString = 'postgres://bxaybfdyembett:92d19c4cde195202a884492231232a78bc80c99754ba2c359c47fd1a6b4272c1@ec2-44-196-223-128.compute-1.amazonaws.com:5432/dd9f76j2b3hi2m'
const pool = new pg.Pool({connectionString: conString, ssl: {rejectUnauthorized: false}})

//rota principal
app.get('/', (req, res) =>{
    pool.connect((err, product)=>{
        if (err){
            return res.status(401).send('Não foi possível conectar')
        }
        res.status(200).send('Conectado com sucesso')
    })
})

//criação de tabela -> create table produtos (nome varchar(100) , descricao varchar (200), preco varchar (6), foto varchar (400))
app.get('/criartabelaprodutos', (req, res) =>{
    pool.connect((err, product)=>{
        if (err){
            return res.status(401).send('Não foi possível conectar')
        }
            var sql = 'create table produtos (nome varchar (100), descricao varchar (300), preco varchar (6), foto varchar (500))'
            product.query(sql, (error, result) =>{
            if (error){
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows)
        })
    })
})

//cadastrar
app.post('/cadprodutos', (req, res) => {
    pool.connect((err, product) =>{
        if (err) {
            return res.status(401).send('Conexão nao autorizada')
        }
        
        product.query('select * from produtos where nome = $1', [req.body.nome], (error,result) =>{
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }

            if (result.rowCount > 0) {
                return res.status(200).send('Produto cadastrado')
            }

             var sql = 'INSERT INTO produtos(nome, descricao, preco, foto) VALUES ($1, $2, $3, $4)'

            product.query(sql,[req.body.nome, req.body.descricao, req.body.preco, req.body.foto], (error, result) => {
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

//listando produtos cadastrados
app.get('/cadprodutos', (req, res) => {
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

//consulta produtos pelo nome
app.get('/cadprodutos/:nome', (req, res) =>{
    pool.connect((err, product) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
         }
         product.query('select * from produtos where nome = $1', [req.params.nome], (error, result) =>{
             if(error) {
                 return res.status(401).send('Operação não autorizada')
             }
             res.status(200).send(result.rows[0])
         })
    })
})

//metodo deletar
app.delete('/cadprodutos/:nome', (req, res) =>{
    pool.connect((err, product) => {
        if (err) {
           return res.status(401).send('Conexão não autorizada')
        }

        product.query('delete from produtos where nome = $1', [req.params.nome], (error, result) =>{

            if (error) {
                return res.status(401).send('Operação não autorizada')
            }
                res.status(200).send({message: 'Produto excluído com sucesso'})
        })
    })
})

//update
app.put('/cadprodutos/:nome', (req, res) => {
    pool.connect((err, product) =>{
        if (err){
            return res.status(401).send('Conexão não autorizada')
        }
        product.query('select * from produtos where nome=$1', [req.params.nome], (error, result) =>{
            if (error){
                return res.status(401).send('Operação não permitida SELECT')
            }

            //update produtos set  descricao=$1, preco=$2, foto=$3 where nome=$4
            if (result.rowCount > 0) {
                var sql = 'update produtos set descricao=$1, preco=$2, foto=$3 where nome=$4'
                let valores = [req.body.descricao, req.body.preco, req.body.foto, req.params.nome]
                
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







app.listen(8080, () => console.log('aplicação em execução na url http://localhost:8080'))