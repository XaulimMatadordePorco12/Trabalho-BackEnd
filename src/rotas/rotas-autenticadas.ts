import {Router} from 'express'
import { Auth, checkAdmin } from '../middlewares/auth.js'

import carrinhoController from '../carrinho/carrinho.controller.js'
import LivrosController from '../livros/livros.controller.js'

const rotas = Router()
rotas.post('/livros',[Auth, checkAdmin],LivrosController.adicionar)
rotas.get('/livros',Auth,LivrosController.listar)



rotas.post('/adicionarItem', Auth, carrinhoController.adicionarItem)
rotas.post('/removerItem', Auth, carrinhoController.removerItem)
rotas.get('/carrinho/:usuarioId', Auth, carrinhoController.listar)
rotas.delete('/carrinho/:usuarioId', Auth, carrinhoController.remover)

export default rotas