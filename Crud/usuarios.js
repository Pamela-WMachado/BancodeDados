const express = require('express');
const app = express();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require ('cors')

app.use(cors())

app.use(express.urlencoded({
    extended: false
}));
app.use(express.json());

var pg = require('pg');

var conString = 'postgres://bxaybfdyembett:92d19c4cde195202a884492231232a78bc80c99754ba2c359c47fd1a6b4272c1@ec2-44-196-223-128.compute-1.amazonaws.com:5432/dd9f76j2b3hi2m'

const pool = new pg.Pool({
    connectionString: conString,
    ssl: {
        rejectUnauthorized: false
    }
})

//rota principal
app.get('/', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Não foi possível conectar')
        }
        res.status(200).send('Conectado com sucesso')
    })
})

//criação de tabela -> create table usuarios (nome varchar (30), cpf(11), email varchar(50), senha varchar(200), perfil varchar(15))
app.get('/criartabelausuarios', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Não foi possível conectar')
        }
        var sql = 'create table usuarios (nome varchar(30), cpf varchar(11), email varchar(50), senha varchar(200), perfil varchar(15))'

        client.query(sql, (error, result) => {
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows)
        })
    })
})

//cadastrar
app.post('/cadusuarios', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão nao autorizada')
        }

        client.query('select * from usuarios where cpf = $1', [req.body.cpf], (error, result) => {
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }

            if (result.rowCount > 0) {
                return res.status(200).send('Usuário já cadastrado')
            }
            bcrypt.hash(req.body.senha, 10, (error, hash) => {
                if (error) {
                    return res.status(500).send({
                        message: 'Erro de autenticação',
                        erro: error.message
                    })
                }
                var sql = 'INSERT INTO usuarios(nome, cpf, email, senha, perfil) VALUES ($1, $2, $3, $4, $5)'
                client.query(sql, [req.body.nome, req.body.cpf, req.body.email, hash, req.body.perfil], (error, result) => {
                    if (error) {
                        return res.status(403).send('Operação não permitida')
                    }
                    res.status(201).send({
                        mensagem: 'Usuário cadastrado com sucesso',
                        status: 201
                    })
                })
            })
        })
    })
})


//listando perfis cadastrados
app.get('/cadusuarios', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            res.status(401).send('Conexão não autorizada')
        }

        client.query('select * from usuarios', (error, result) => {
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows)
        })
    })
})


//consulta de perfis por cpf
app.get('/cadusuarios/:cpf', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }
        client.query('select * from usuarios where cpf = $1', [req.params.cpf], (error, result) => {
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows[0])
        })
    })
})

//Login
app.post('/usuarios/login', (req, res) => {
    //res.status(200).send('buscar usuário')
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send("Conexão não autorizada")
        }
        client.query(' select * from usuarios where email = $1', [req.body.email], (error, result) => {
            if (error) {
                return res.status(401).send('operação nao permitida')
            }
            if (result.rowCount > 0) {
                //criptografar a senha enviada e comparar com a recuperada
                bcrypt.compare(req.body.senha, result.rows[0].senha, (error, results) => {
                    if (error) {
                        return res.status(401).send({
                            message: "Falha na autenticação"
                        })
                    }
                    if (results) {
                        let token = jwt.sign({
                                email: result.rows[0].email,
                                perfil: result.rows[0].perfil
                            },
                            process.env.JWTKEY, {
                                expiresIn: '1h'
                            })
                        return res.status(200).send({
                            message: 'Conectado com sucesso',
                            token: token
                        })
                    }
                })
            } else {
                return res.status(200).send({
                    message: 'usuário não encontrado'
                })
            }
        })
    })
})

//metodo deletar
app.delete('/cadusuarios/:cpf', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }

        client.query('delete from usuarios where cpf = $1', [req.params.cpf], (error, result) => {

            if (error) {
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send({
                message: 'Usuário excluído com sucesso'
            })
        })
    })
})

//update
app.put('/cadusuarios/:cpf', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }
        client.query('select * from usuarios where cpf=$1', [req.params.cpf], (error, result) => {
            if (error) {
                return res.status(401).send('Operação não permitida SELECT')
            }

            //update usuarios set nome=$1, email=$2 senha=$3, perfil=$4 where cpf=$5
            if (result.rowCount > 0) {
                var sql = 'update usuarios set nome=$1, email=$2, senha=$3, perfil=$4 where cpf=$5'
                let valores = [req.body.nome, req.body.email, req.body.senha, req.body.perfil, req.params.cpf]

                client.query(sql, valores, (error2, result2) => {
                    if (error2) {
                        return res.status(401).send('Operação não permitida')
                    }

                    if (result2.rowCount > 0) {
                        return res.status(200).send('Dados alterados com sucesso')
                    }
                })
            } else {
                res.status(200).send('User não encontrado')
            }

        })
    })
})


app.listen(process.env.PORT || 8080, () => console.log('aplicação em execução na url http://localhost:8080'))