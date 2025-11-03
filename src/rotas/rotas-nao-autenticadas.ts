import {Router} from 'express'


import usuariosController from '../usuarios/usuarios.controller.js'

const rotas = Router()



rotas.post('/adicionarUsuario',usuariosController.adicionar)
rotas.post('/login',usuariosController.login)


export default rotas